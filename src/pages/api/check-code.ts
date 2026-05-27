// ============================================================
// Career Compass v3 · POST /api/check-code
//
// 邀请码校验 + 暴力防御。流程:
//   1. 取 IP(CF-Connecting-IP)→ sha256 hash
//   2. 查 code_attempts 是否 ban 中(同 IP 10min 内 5 次错 → ban 24h)
//   3. 校验格式 ^\d{4}$
//   4. 查 invite_codes 表(存在 / 未过期 / 未用尽)
//   5. max_uses>0 时查 invite_code_uses 防 IP 复用
//   6. 通过 → INSERT invite_code_uses(批次码)+ UPDATE used++ → ok
//   7. 失败 → 累计 code_attempts.failure_count(必要时 ban)→ 统一错误
//
// 错误响应统一为 "邀请码无效",不区分原因(防 1 万种 4 位数字暴力)。
// ============================================================

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

interface RuntimeEnv {
  DB?: D1Database;
}

interface CheckCodeRequest {
  code?: string;
}

const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 min
const MAX_FAILURES_BEFORE_BAN = 5;
const BAN_DURATION_MS = 24 * 60 * 60 * 1000; // 24h

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function genericFail(): Response {
  return new Response(
    JSON.stringify({ ok: false, message: "邀请码无效" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

function banned(): Response {
  return new Response(
    JSON.stringify({ ok: false, message: "尝试次数过多,请 24 小时后再试" }),
    { status: 429, headers: { "Content-Type": "application/json" } }
  );
}

export const POST: APIRoute = async ({ request }) => {
  const e = env as RuntimeEnv;
  if (!e.DB) {
    return new Response(JSON.stringify({ ok: false, message: "服务暂不可用" }), {
      status: 503,
      headers: { "Content-Type": "application/json" }
    });
  }

  // IP hash
  const ip = request.headers.get("CF-Connecting-IP") ?? "0.0.0.0";
  const ipHash = await sha256Hex(ip);
  const now = Date.now();

  // 1. 暴力防御: 检查 ban 状态
  const banRow = await e.DB.prepare(
    "SELECT failure_count, last_failure_at, blocked_until FROM code_attempts WHERE ip_hash = ?"
  )
    .bind(ipHash)
    .first<{ failure_count: number; last_failure_at: number; blocked_until: number | null }>();

  if (banRow?.blocked_until && banRow.blocked_until > now) {
    return banned();
  }

  // 2. 解析 body
  let body: CheckCodeRequest;
  try {
    body = await request.json();
  } catch {
    await recordFailure(e.DB, ipHash, now, banRow);
    return genericFail();
  }

  const code = body.code?.trim();

  // 3. 格式校验: 严格 4 位数字
  if (!code || !/^\d{4}$/.test(code)) {
    await recordFailure(e.DB, ipHash, now, banRow);
    return genericFail();
  }

  // 4. 查 invite_codes
  const codeRow = await e.DB.prepare(
    "SELECT code, max_uses, used, expires_at FROM invite_codes WHERE code = ?"
  )
    .bind(code)
    .first<{ code: string; max_uses: number; used: number; expires_at: number | null }>();

  if (!codeRow) {
    await recordFailure(e.DB, ipHash, now, banRow);
    return genericFail();
  }

  // 过期
  if (codeRow.expires_at && codeRow.expires_at < now) {
    await recordFailure(e.DB, ipHash, now, banRow);
    return genericFail();
  }

  // 用尽
  if (codeRow.max_uses > 0 && codeRow.used >= codeRow.max_uses) {
    await recordFailure(e.DB, ipHash, now, banRow);
    return genericFail();
  }

  // 5. 批次码(max_uses>0)IP 去重
  if (codeRow.max_uses > 0) {
    const usedRow = await e.DB.prepare(
      "SELECT 1 FROM invite_code_uses WHERE code = ? AND ip_hash = ?"
    )
      .bind(code, ipHash)
      .first();

    if (usedRow) {
      // 同 IP 已用过此批次码 — 拒绝(不计入 failure,这不是 brute force)
      return new Response(
        JSON.stringify({ ok: false, message: "此邀请码已被你使用过" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 记录 IP 使用 + 累加 used
    await e.DB.batch([
      e.DB.prepare(
        "INSERT INTO invite_code_uses (code, ip_hash, used_at) VALUES (?, ?, ?)"
      ).bind(code, ipHash, now),
      e.DB.prepare(
        "UPDATE invite_codes SET used = used + 1 WHERE code = ?"
      ).bind(code)
    ]);
  }
  // 无限码(max_uses=0):不去重,不累加 used 也行(used 仅对批次码有意义)

  // 6. 通过 — 清零此 IP 失败计数(可选,但留着方便后续 ban 同 IP)
  if (banRow) {
    await e.DB.prepare(
      "UPDATE code_attempts SET failure_count = 0, blocked_until = NULL WHERE ip_hash = ?"
    ).bind(ipHash).run();
  }

  return new Response(
    JSON.stringify({ ok: true, code }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};

async function recordFailure(
  db: D1Database,
  ipHash: string,
  now: number,
  prev: { failure_count: number; last_failure_at: number; blocked_until: number | null } | null | undefined
): Promise<void> {
  let newCount: number;
  if (!prev) {
    newCount = 1;
  } else if (now - prev.last_failure_at > RATE_WINDOW_MS) {
    newCount = 1; // 窗口外,重置
  } else {
    newCount = prev.failure_count + 1;
  }
  const blockedUntil = newCount >= MAX_FAILURES_BEFORE_BAN ? now + BAN_DURATION_MS : null;

  await db.prepare(
    `INSERT INTO code_attempts (ip_hash, failure_count, last_failure_at, blocked_until)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(ip_hash) DO UPDATE SET
       failure_count = excluded.failure_count,
       last_failure_at = excluded.last_failure_at,
       blocked_until = excluded.blocked_until`
  )
    .bind(ipHash, newCount, now, blockedUntil)
    .run();
}
