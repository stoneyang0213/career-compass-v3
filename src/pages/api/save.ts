// ============================================================
// Career Compass v3.2 · POST /api/save
//
// 把完整测评 + 生成的报告写入 D1 (env.DB)。前端在 ReportStream 完成后调用。
// 校验链:
//   1. consent === true(法律红线,不勾就拒)
//   2. profile 完整度(借 validateProfileForGeneration)
//   3. INSERT 一行 到 assessments 表
// ============================================================

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

import { validateProfileForGeneration } from "../../lib/prompt";
import { sendReportEmail } from "../../lib/email";
import type { AssessmentProfile } from "../../lib/types";

export const prerender = false;

interface RuntimeEnv {
  DB?: D1Database;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
}

interface SaveRequest {
  profile: AssessmentProfile;
  reportText: string;
  durationMs: number;
  model: string;
  computed: {
    mbtiType: string;
    hollandCode: string;
    valuesTop3: string[];
    valuesBottom3?: string[];
  };
}

export const POST: APIRoute = async ({ request }) => {
  const e = env as RuntimeEnv;

  if (!e.DB) {
    return jsonError(500, "missing_db_binding", "D1 binding 'DB' 未配置 (wrangler.toml 或 CF Pages dashboard)");
  }

  // 1. 解析 body
  let body: SaveRequest;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "invalid_json", "无法解析请求体");
  }

  const { profile, reportText, durationMs, model, computed } = body;

  // 2. 校验 consent(法律红线)
  if (!profile?.consent) {
    return jsonError(403, "no_consent", "未勾选知情同意,不能持久化");
  }

  // 3. 校验 profile 完整度
  const validation = validateProfileForGeneration(profile);
  if (!validation.ok) {
    return jsonError(400, "profile_incomplete", `测评数据缺失:${(validation.missing ?? []).join(", ")}`);
  }

  // 4. 校验 reportText 非空(防止前端 bug 写空报告)
  if (!reportText || reportText.length < 500) {
    return jsonError(400, "report_too_short", `报告文本过短 (${reportText?.length ?? 0} chars),拒绝持久化`);
  }

  // 5. 生成 id
  const id = crypto.randomUUID();
  const now = Date.now();

  // 6. INSERT
  try {
    await e.DB.prepare(
      `INSERT INTO assessments (
        id, created_at, email, consent,
        name, age, gender, identity_role,
        context_json,
        mbti_answers_json, holland_answers_json, values_answers_json,
        mbti_type, holland_code, values_top3_json, values_bottom3_json,
        dim_passion, dim_strength, dim_value,
        report_text, report_model, report_chars, report_duration_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        now,
        profile.email ?? null,
        1,
        profile.basic!.name,
        profile.basic!.age,
        profile.basic!.gender ?? null,
        profile.context?.identityRole ?? null,
        JSON.stringify(profile.context ?? {}),
        JSON.stringify(profile.mbtiAnswers ?? {}),
        JSON.stringify(profile.hollandAnswers ?? {}),
        JSON.stringify(profile.valuesAnswers ?? {}),
        computed.mbtiType,
        computed.hollandCode,
        JSON.stringify(computed.valuesTop3 ?? []),
        JSON.stringify(computed.valuesBottom3 ?? []),
        profile.dimensions!.passion,
        profile.dimensions!.strength,
        profile.dimensions!.value,
        reportText,
        model,
        reportText.length,
        durationMs
      )
      .run();
  } catch (err) {
    console.error("[api/save] D1 INSERT error:", err);
    return jsonError(500, "db_insert_failed", `D1 写入失败: ${String(err)}`);
  }

  // 7. fire-and-forget 发邮件(失败不影响 INSERT 已经成功)
  let emailStatus: { sent: boolean; error?: string } = { sent: false };
  if (profile.email && e.RESEND_API_KEY) {
    const emailResult = await sendReportEmail(
      { RESEND_API_KEY: e.RESEND_API_KEY, RESEND_FROM: e.RESEND_FROM },
      {
        to: profile.email,
        name: profile.basic!.name,
        reportText,
        identityRole: profile.context?.identityRole
      }
    );
    if (emailResult.ok) {
      emailStatus = { sent: true };
      console.log("[api/save] Resend ok, messageId:", emailResult.resendMessageId);
    } else {
      emailStatus = { sent: false, error: emailResult.errorMsg };
      console.warn("[api/save] Resend failed (报告已存 D1,不影响):", emailResult.errorMsg);
    }
  }

  return new Response(JSON.stringify({ ok: true, id, emailStatus }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};

function jsonError(status: number, reason: string, message: string): Response {
  return new Response(JSON.stringify({ ok: false, event: "error", reason, message }), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
