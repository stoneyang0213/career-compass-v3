// ============================================================
// Career Compass v3 · POST /api/generate
//
// Astro API Route → 编译为 Cloudflare Pages Function。
// 接收完整 AssessmentProfile,调 SiliconFlow GLM-5.1 stream,
// 把 SSE 流原样 forward 给浏览器。
//
// 与 v2 的差异:
//   1. 无 D1(MVP 无服务端持久化),不写 reports / assessments 表
//   2. 无 IP rate limit(MVP 阶段不上,后续按 KV 加)
//   3. 在 stream 头部注入 meta 事件(model + scores),供前端摘要 UI
// ============================================================

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

import { computeAllScores } from "../../lib/scoring";
import { validateProfileForGeneration } from "../../lib/prompt";
import { buildStreamPrompt } from "../../lib/prompt-stream";
import type { AssessmentProfile, QuizQuestion } from "../../lib/types";

import mbtiQs from "../../data/questions/mbti.json";
import hollandQs from "../../data/questions/holland.json";
import valuesQs from "../../data/questions/values.json";

export const prerender = false;

const SILICONFLOW_ENDPOINT = "https://api.siliconflow.cn/v1/chat/completions";

interface RuntimeEnv {
  SILICONFLOW_API_KEY?: string;
  LLM_MODEL_PRIMARY?: string;
  LLM_MODEL_FALLBACK?: string;
}

export const POST: APIRoute = async ({ request }) => {
  const e = env as RuntimeEnv;

  // 0. env 校验(常见生产 deploy 后忘配 secret 的坑)
  if (!e.SILICONFLOW_API_KEY) {
    return jsonError(500, "missing_env", "SILICONFLOW_API_KEY 未配置 (CF Pages dashboard 或本地 .dev.vars)");
  }
  const modelPrimary = e.LLM_MODEL_PRIMARY ?? "Pro/zai-org/GLM-5.1";

  // 1. 解析 body
  let profile: AssessmentProfile;
  try {
    profile = await request.json();
  } catch {
    return jsonError(400, "invalid_json", "无法解析请求体");
  }

  // 2. 校验完整度
  const validation = validateProfileForGeneration(profile);
  if (!validation.ok) {
    return jsonError(400, "profile_incomplete", `测评数据缺失:${(validation.missing ?? []).join(", ")}`);
  }

  // 3. 计分
  const computed = computeAllScores(
    profile.mbtiAnswers!,
    mbtiQs as QuizQuestion[],
    profile.hollandAnswers!,
    hollandQs as QuizQuestion[],
    profile.valuesAnswers!,
    valuesQs as QuizQuestion[]
  );

  // 4. 构造 prompt (v3 streaming markdown,不输出 JSON)
  const promptText = buildStreamPrompt({
    basic: profile.basic!,
    context: profile.context!,
    computed,
    dimensions: profile.dimensions!
  });

  // 5. fetch SiliconFlow stream
  let upstream: Response;
  try {
    upstream = await fetch(SILICONFLOW_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${e.SILICONFLOW_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelPrimary,
        messages: [{ role: "user", content: promptText }],
        stream: true,
        max_tokens: 16000,
        temperature: 0.7
      })
    });
  } catch (err) {
    return jsonError(502, "siliconflow_network_error", `调用 SiliconFlow 网络失败: ${String(err)}`);
  }

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "(no body)");
    return jsonError(502, "siliconflow_upstream_failed", `LLM 上游返回 ${upstream.status}: ${text.slice(0, 200)}`);
  }

  // 6. 在 SSE 流头部注入 meta 事件
  const metaPayload = JSON.stringify({
    event: "meta",
    model: modelPrimary,
    scores: {
      hollandCode: computed.holland.code,
      mbtiType: computed.mbti.type,
      valuesTop3: computed.values.top3
    }
  });

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  await writer.write(new TextEncoder().encode(`data: ${metaPayload}\n\n`));
  writer.releaseLock();

  // pipe upstream body 到 writable
  upstream.body.pipeTo(writable).catch((err) => {
    console.error("[api/generate] pipe error:", err);
  });

  return new Response(readable, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-LLM-Model": modelPrimary
    }
  });
};

// ─── helpers ───────────────────────────────────────────────────

function jsonError(status: number, reason: string, message: string): Response {
  return new Response(
    JSON.stringify({ event: "error", reason, message }),
    {
      status,
      headers: { "Content-Type": "application/json" }
    }
  );
}
