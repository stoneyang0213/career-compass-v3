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
import type { AssessmentProfile, QuizQuestion, Fact, FactsLibrary } from "../../lib/types";

import mbtiQs from "../../data/questions/mbti.json";
import hollandQs from "../../data/questions/holland.json";
import valuesQs from "../../data/questions/values.json";
import factsLibrary from "../../data/industry_facts.json";

/**
 * 加载事实库,按 expires_at 过滤掉过期条目。
 * 过期条目不喂给 LLM,但会 console.warn 提醒维护团队复核。
 */
function loadValidFacts(): Fact[] {
  const lib = factsLibrary as unknown as FactsLibrary;
  const today = new Date().toISOString().slice(0, 10);
  const valid: Fact[] = [];
  const expired: string[] = [];

  for (const f of lib.facts) {
    if (f.expires_at < today) {
      expired.push(f.id);
    } else {
      valid.push(f);
    }
  }

  if (expired.length > 0) {
    console.warn(`[facts] ${expired.length} 条事实已过期需复核:`, expired);
  }
  return valid;
}

export const prerender = false;

const SILICONFLOW_ENDPOINT = "https://api.siliconflow.cn/v1/chat/completions";

interface RuntimeEnv {
  SILICONFLOW_API_KEY?: string;
  LLM_MODEL_PRIMARY?: string;
  LLM_MODEL_FALLBACK?: string;
}

export const POST: APIRoute = async ({ request }) => {
  const e = env as RuntimeEnv;

  // DEBUG: 看 env 到底注入了什么
  console.log("[api/generate] env keys:", Object.keys(e));
  console.log("[api/generate] LLM_MODEL_PRIMARY:", JSON.stringify(e.LLM_MODEL_PRIMARY));
  console.log("[api/generate] LLM_MODEL_FALLBACK:", JSON.stringify(e.LLM_MODEL_FALLBACK));

  // 0. env 校验(常见生产 deploy 后忘配 secret 的坑)
  if (!e.SILICONFLOW_API_KEY) {
    return jsonError(500, "missing_env", "SILICONFLOW_API_KEY 未配置 (CF Pages dashboard 或本地 .dev.vars)");
  }
  const modelPrimary = e.LLM_MODEL_PRIMARY ?? "Pro/zai-org/GLM-5.1";
  console.log("[api/generate] resolved modelPrimary:", modelPrimary);

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

  // 4. 加载有效事实库(过期自动剔除),构造 v3.1 严谨性 prompt
  const facts = loadValidFacts();
  const promptText = buildStreamPrompt({
    basic: profile.basic!,
    context: profile.context!,
    computed,
    dimensions: profile.dimensions!,
    facts
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
        temperature: 0.7,
        // Kimi-K2.6 / GLM-5.1 等 reasoning 模型默认开 thinking,
        // 会把内容全花在 reasoning_content 字段,标准 content 几乎空。
        // 短输出/流式必须显式关掉。见 memory reference_glm5_disable_thinking。
        thinking: { type: "disabled" }
      })
    });
  } catch (err) {
    return jsonError(502, "siliconflow_network_error", `调用 SiliconFlow 网络失败: ${String(err)}`);
  }

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "(no body)");
    return jsonError(502, "siliconflow_upstream_failed", `LLM 上游返回 ${upstream.status}: ${text.slice(0, 200)}`);
  }

  // 6. 在 SSE 流头部注入 meta 事件,然后 forward upstream chunks
  //    用 ReadableStream controller 模式,所有 IO 在 start() 内 await,
  //    避免 wrangler/miniflare 的 hang detection 误判 fire-and-forget pipe。
  const metaPayload = JSON.stringify({
    event: "meta",
    model: modelPrimary,
    scores: {
      hollandCode: computed.holland.code,
      mbtiType: computed.mbti.type,
      valuesTop3: computed.values.top3
    }
  });

  const encoder = new TextEncoder();
  const upstreamBody = upstream.body;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // 6a. 先送 meta 事件
      controller.enqueue(encoder.encode(`data: ${metaPayload}\n\n`));

      // 6b. 边读边送 upstream chunks(全程 await,无 fire-and-forget)
      const reader = upstreamBody.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
      } catch (err) {
        console.error("[api/generate] upstream read error:", err);
        const errPayload = JSON.stringify({
          event: "error",
          reason: "upstream_read_error",
          message: String(err)
        });
        controller.enqueue(encoder.encode(`data: ${errPayload}\n\n`));
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
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
