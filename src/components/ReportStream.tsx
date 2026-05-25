// ============================================================
// Career Compass v3 · 报告流式渲染岛屿
//
// mount 时 POST /api/generate(带 store.load() 的 profile),
// 用 fetch + ReadableStream 接 SSE,逐 chunk 解析 OpenAI 兼容格式:
//   - data: {"event":"meta","model":"...","scores":{...}}    → setMeta
//   - data: {"choices":[{"delta":{"content":"..."}}]}        → 追加到 reportText
//   - data: [DONE]                                            → 结束
//
// 显示规则:
//   - 第一个 chunk 到达前显示 skeleton + 友好提示
//   - 流入时用 react-markdown + remark-gfm 实时渲染
//   - 末尾闪烁光标 ▌
//   - 完成后底部按钮:复制全文 / 打印为 PDF / 重新开始
// ============================================================

import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Printer, RotateCcw, AlertCircle, Sparkles, Check } from "lucide-react";
import { store } from "../lib/store";

/**
 * v3.2 阶段性进度。基于 streaming 中 reportText 实时长度判断当前阶段。
 * 阈值粗略对齐 prompt 的 11 段累计长度(总 7500-9000 字)。
 */
const REPORT_STAGES = [
  { name: "提取你的画像", desc: "整合 Holland · MBTI · 舒伯三套测评", minLen: 0 },
  { name: "对照行业数据", desc: "从公开权威报告事实库取证", minLen: 1500 },
  { name: "推荐职业路径", desc: "爱 · 长 · 需 · 利 四维论证 3 条路径", minLen: 3500 },
  { name: "深度剖析首选", desc: "职业轨迹 + 挑战 + 机会 + 试水步骤", minLen: 5500 },
  { name: "完成行动计划", desc: "30 天 / 90 天 / 1 年三梯度落地", minLen: 7000 }
];

function getStageIndex(textLen: number, isDone: boolean): number {
  if (isDone) return REPORT_STAGES.length;
  for (let i = REPORT_STAGES.length - 1; i >= 0; i--) {
    if (textLen >= REPORT_STAGES[i].minLen) return i;
  }
  return 0;
}

type Status = "idle" | "connecting" | "streaming" | "done" | "error";

interface MetaInfo {
  model: string;
  scores: {
    hollandCode: string;
    mbtiType: string;
    valuesTop3: string[];
  };
}

interface SaveResult {
  ok: boolean;
  id?: string;
  emailStatus?: { sent: boolean; error?: string };
  toEmail?: string;
}

export default function ReportStream() {
  const [status, setStatus] = useState<Status>("idle");
  const [meta, setMeta] = useState<MetaInfo | null>(null);
  const [reportText, setReportText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const startedRef = useRef(false); // 防 StrictMode 双跑

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    startStream();
    return () => {
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startStream() {
    setStatus("connecting");
    setReportText("");
    setErrorMsg(null);
    setStartedAt(Date.now());
    setFinishedAt(null);

    const profile = store.load();
    if (!profile) {
      setStatus("error");
      setErrorMsg("没找到测评数据。请先回到首页完成 5 章测评。");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    let response: Response;
    try {
      response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
        signal: controller.signal
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setStatus("error");
      setErrorMsg(`网络错误:${(err as Error).message}`);
      return;
    }

    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => "(no body)");
      setStatus("error");
      setErrorMsg(`服务端错误 ${response.status}: ${text.slice(0, 300)}`);
      return;
    }

    setStatus("streaming");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let accumulated = "";
    let localMeta: MetaInfo | null = null;

    while (true) {
      let result: ReadableStreamReadResult<Uint8Array>;
      try {
        result = await reader.read();
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setStatus("error");
        setErrorMsg(`stream 读取失败:${(err as Error).message}`);
        return;
      }

      if (result.done) break;

      buffer += decoder.decode(result.value, { stream: true });

      // SSE 一行一个 event,以 \n\n 分隔
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // 留住未完整的最后一行

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload) continue;
        if (payload === "[DONE]") {
          // upstream OpenAI 协议结束符
          continue;
        }

        try {
          const json = JSON.parse(payload);

          // 1. v3 自家注入的 meta 事件
          if (json.event === "meta") {
            localMeta = { model: json.model, scores: json.scores };
            setMeta(localMeta);
            continue;
          }
          if (json.event === "error") {
            setStatus("error");
            setErrorMsg(json.message ?? json.reason ?? "未知错误");
            return;
          }

          // 2. OpenAI 兼容 chunk: choices[0].delta.content
          const delta = json.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta.length > 0) {
            accumulated += delta;
            setReportText(accumulated);
          }
        } catch {
          // JSON 解析失败的行直接吞掉,可能是 SiliconFlow keep-alive 心跳
        }
      }
    }

    setStatus("done");
    const finishedTs = Date.now();
    setFinishedAt(finishedTs);

    // v3.2 · stream 完成后 fire-and-forget 写 D1(失败不影响用户看报告)
    if (localMeta && accumulated.length > 500 && profile.consent) {
      const durationMs = startedAt ? finishedTs - startedAt : 0;
      try {
        const saveRes = await fetch("/api/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile,
            reportText: accumulated,
            durationMs,
            model: localMeta.model,
            computed: {
              mbtiType: localMeta.scores.mbtiType,
              hollandCode: localMeta.scores.hollandCode,
              valuesTop3: localMeta.scores.valuesTop3
            }
          })
        });
        if (saveRes.ok) {
          const body = (await saveRes.json()) as SaveResult;
          setSaveResult({ ...body, toEmail: profile.email });
        } else {
          const errText = await saveRes.text().catch(() => "(no body)");
          console.warn("[ReportStream] /api/save 写入失败(不影响阅读):", saveRes.status, errText.slice(0, 200));
        }
      } catch (err) {
        console.warn("[ReportStream] /api/save 网络错误(不影响阅读):", err);
      }
    } else if (!profile.consent) {
      console.info("[ReportStream] 用户未勾选 consent,跳过 /api/save");
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(reportText).then(
      () => alert("报告已复制到剪贴板"),
      () => alert("复制失败,请手动选中文本复制")
    );
  }

  function handlePrint() {
    window.print();
  }

  function handleRestart() {
    startedRef.current = false;
    setMeta(null);
    setReportText("");
    setErrorMsg(null);
    startStream();
  }

  const duration =
    startedAt && finishedAt
      ? `${Math.round((finishedAt - startedAt) / 1000)} 秒`
      : startedAt
      ? `已进行 ${Math.round((Date.now() - startedAt) / 1000)} 秒`
      : "";

  // ─── 渲染 ───────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* === Meta 摘要(收到 meta 事件后显示) === */}
      {meta && (
        <div
          className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: "var(--color-brand-light)", border: "1px solid var(--color-brand-muted)" }}
        >
          <Sparkles size={20} style={{ color: "var(--color-brand)", flexShrink: 0, marginTop: "2px" }} />
          <div className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            基于 <strong style={{ color: "var(--color-brand)" }}>Holland {meta.scores.hollandCode}</strong> ·{" "}
            <strong style={{ color: "var(--color-brand)" }}>MBTI {meta.scores.mbtiType}</strong> · 价值观 Top 3{" "}
            <strong style={{ color: "var(--color-brand)" }}>{meta.scores.valuesTop3.join(" / ")}</strong>
            <br />
            <span style={{ color: "var(--color-text-muted)" }}>
              报告模型 {meta.model} · {duration}
            </span>
          </div>
        </div>
      )}

      {/* === Error 态 === */}
      {status === "error" && (
        <div
          className="rounded-xl p-5 flex items-start gap-3"
          style={{ background: "rgba(155, 56, 56, 0.08)", border: "1px solid var(--color-error)" }}
        >
          <AlertCircle size={20} style={{ color: "var(--color-error)", flexShrink: 0, marginTop: "2px" }} />
          <div className="text-sm leading-relaxed flex-1" style={{ color: "var(--color-text-primary)" }}>
            <strong>报告生成失败</strong>
            <p className="mt-1" style={{ color: "var(--color-text-secondary)" }}>{errorMsg}</p>
            <button
              type="button"
              onClick={handleRestart}
              className="mt-3 px-4 py-1.5 text-sm rounded-md cursor-pointer transition hover:opacity-90"
              style={{ background: "var(--color-brand)", color: "white" }}
            >
              重试
            </button>
          </div>
        </div>
      )}

      {/* === 阶段性进度条 (streaming 全程显示,done 后隐藏) === */}
      {(status === "connecting" || status === "streaming") && (
        <div
          className="rounded-xl p-5 md:p-6"
          style={{ background: "var(--color-surface-warm)" }}
        >
          {(() => {
            const stageIdx = getStageIndex(reportText.length, false);
            return (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    正在为你生成深度报告
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {reportText.length > 0 ? `已生成 ${reportText.length} 字` : "约 4-5 分钟"}
                  </p>
                </div>

                {/* 5 步阶段条 */}
                <div className="grid grid-cols-5 gap-1 mb-3">
                  {REPORT_STAGES.map((_, i) => {
                    const isDone = i < stageIdx;
                    const isCurrent = i === stageIdx;
                    return (
                      <div
                        key={i}
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{
                          background: isDone
                            ? "var(--color-brand)"
                            : isCurrent
                            ? "var(--color-brand-muted)"
                            : "var(--color-border)",
                          animation: isCurrent ? "stageStreaming 1.6s ease-in-out infinite" : "none"
                        }}
                      />
                    );
                  })}
                </div>

                {/* 5 步阶段名 */}
                <div className="grid grid-cols-5 gap-1">
                  {REPORT_STAGES.map((s, i) => {
                    const isDone = i < stageIdx;
                    const isCurrent = i === stageIdx;
                    return (
                      <div key={i} className="text-center">
                        <div className="flex justify-center mb-1">
                          {isDone ? (
                            <Check
                              size={14}
                              style={{ color: "var(--color-brand)", strokeWidth: 3 }}
                            />
                          ) : (
                            <span
                              className="inline-block w-2.5 h-2.5 rounded-full"
                              style={{
                                background: isCurrent ? "var(--color-brand)" : "var(--color-border)",
                                animation: isCurrent ? "stageDotPulse 1.2s ease-in-out infinite" : "none"
                              }}
                            />
                          )}
                        </div>
                        <p
                          className="text-xs font-medium leading-tight"
                          style={{
                            color: isDone
                              ? "var(--color-brand)"
                              : isCurrent
                              ? "var(--color-text-primary)"
                              : "var(--color-text-muted)"
                          }}
                        >
                          {s.name}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* 当前阶段描述 */}
                <p
                  className="text-xs mt-4 text-center leading-relaxed"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {REPORT_STAGES[stageIdx]?.desc ?? "完成精修..."} · 期间可以离开页面再回来,但不要关闭浏览器。
                </p>
              </>
            );
          })()}
        </div>
      )}

      {/* === 流式渲染主体 === */}
      {reportText.length > 0 && (
        <article
          className="prose prose-sm max-w-none rounded-xl p-6 md:p-8"
          style={{
            background: "var(--color-surface)",
            boxShadow: "var(--shadow-md)",
            color: "var(--color-text-primary)",
            fontSize: "0.95rem",
            lineHeight: 1.75
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{reportText}</ReactMarkdown>
          {status === "streaming" && (
            <span
              className="cursor-blink"
              style={{
                display: "inline-block",
                width: "8px",
                height: "1em",
                marginLeft: "2px",
                verticalAlign: "text-bottom",
                background: "var(--color-brand)"
              }}
              aria-hidden="true"
            />
          )}
        </article>
      )}

      {/* === 完成后邮件状态 banner === */}
      {status === "done" && saveResult?.emailStatus?.sent && saveResult.toEmail && (
        <div
          className="rounded-lg p-4 flex items-start gap-3"
          style={{ background: "rgba(45, 125, 95, 0.08)", border: "1px solid var(--color-success)" }}
        >
          <Check size={20} style={{ color: "var(--color-success)", flexShrink: 0, marginTop: "2px", strokeWidth: 3 }} />
          <div className="text-sm leading-relaxed" style={{ color: "var(--color-text-primary)" }}>
            <strong>报告备份已发到 {saveResult.toEmail}</strong>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
              发件人 hi@mail.stoneyang.top · 检查垃圾邮件夹找不到时,刷新一下首页或私信我们。
            </p>
          </div>
        </div>
      )}
      {status === "done" && saveResult?.emailStatus && !saveResult.emailStatus.sent && saveResult.toEmail && (
        <div
          className="rounded-lg p-4 flex items-start gap-3"
          style={{ background: "rgba(201, 122, 74, 0.08)", border: "1px solid var(--color-accent)" }}
        >
          <AlertCircle size={20} style={{ color: "var(--color-accent)", flexShrink: 0, marginTop: "2px" }} />
          <div className="text-sm leading-relaxed" style={{ color: "var(--color-text-primary)" }}>
            <strong>邮件发送暂时失败</strong>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
              报告已保存,你可以现场复制全文或打印 PDF;邮件发送问题已记录,后续会人工跟进。
            </p>
          </div>
        </div>
      )}

      {/* === 完成后底部按钮 === */}
      {status === "done" && (
        <div
          className="flex flex-wrap items-center gap-3 pt-4"
          style={{ borderTop: "1px solid var(--color-border-light)" }}
        >
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-semibold cursor-pointer transition hover:opacity-90"
            style={{ background: "var(--color-brand)", color: "white" }}
          >
            <Copy size={18} />
            复制全文
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-semibold cursor-pointer transition"
            style={{
              background: "transparent",
              color: "var(--color-brand)",
              border: "1.5px solid var(--color-brand)"
            }}
          >
            <Printer size={18} />
            打印为 PDF
          </button>
          <button
            type="button"
            onClick={handleRestart}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md cursor-pointer transition hover:opacity-70"
            style={{ background: "transparent", color: "var(--color-text-muted)" }}
          >
            <RotateCcw size={16} />
            重新生成
          </button>
          <span className="ml-auto text-xs" style={{ color: "var(--color-text-muted)" }}>
            {reportText.length} 字符 · {duration}
          </span>
        </div>
      )}

      {/* === keyframes 通过 inline style + class === */}
      <style>{`
        .loading-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--color-brand);
          display: inline-block;
          animation: loadingBounce 1.4s infinite ease-in-out;
        }
        @keyframes loadingBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        .cursor-blink {
          animation: cursorBlink 1s infinite;
        }
        @keyframes cursorBlink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        /* === v3.2 阶段性进度条动画 === */
        @keyframes stageStreaming {
          0%, 100% { opacity: 0.6; }
          50%      { opacity: 1; }
        }
        @keyframes stageDotPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.35); opacity: 0.7; }
        }

        /* === v3.1 报告样式:三版块视觉强分隔 === */
        article p { margin: 0.85em 0; }

        /* H2 = 三版块大标题(行业背景 / 个人画像 / 行动建议),视觉上强烈分隔 */
        article h2 {
          font-size: 1.6rem;
          font-weight: 700;
          margin-top: 3em;
          margin-bottom: 1em;
          padding-top: 1.5em;
          color: var(--color-text-primary);
          font-family: var(--font-display);
          border-top: 2px solid var(--color-brand);
          position: relative;
        }
        article h2:first-of-type {
          margin-top: 1.5em;
          padding-top: 0.5em;
          border-top: none;
        }

        /* H3 = 子小节(择己所爱/所长 等),用 brand-light 背景的标签感 */
        article h3 {
          font-size: 1.15rem;
          font-weight: 600;
          margin-top: 1.8em;
          margin-bottom: 0.6em;
          color: var(--color-brand);
          padding-bottom: 0.25em;
          border-bottom: 1px dashed var(--color-brand-muted);
          display: inline-block;
        }

        /* H4 = 细分小标题 */
        article h4 {
          font-size: 1rem;
          font-weight: 600;
          margin-top: 1.2em;
          margin-bottom: 0.4em;
          color: var(--color-text-primary);
        }

        article ul, article ol {
          margin: 0.6em 0;
          padding-left: 1.5em;
        }
        article li { margin: 0.35em 0; line-height: 1.7; }
        article strong { color: var(--color-text-primary); font-weight: 600; }
        article hr { border: none; border-top: 1px dashed var(--color-border); margin: 2em 0; }

        /* blockquote = 免责声明(开头/结尾)+ 行业背景的"以下为参考"段 */
        article blockquote {
          margin: 1.2em 0;
          padding: 0.8em 1.2em;
          background: var(--color-surface-warm);
          border-left: 3px solid var(--color-brand-muted);
          color: var(--color-text-secondary);
          font-size: 0.9em;
          line-height: 1.7;
          font-style: normal;
        }
        article blockquote p { margin: 0.3em 0; }

        /* 行内 source 标注 — 给来源圆点 / 浅 brand 强调 */
        article code {
          padding: 0.1em 0.4em;
          background: var(--color-brand-light);
          color: var(--color-brand-hover);
          border-radius: 3px;
          font-size: 0.9em;
          font-family: var(--font-mono);
        }

        @media print {
          .loading-dot, .cursor-blink { display: none !important; }
          article h2 { page-break-before: auto; page-break-after: avoid; }
        }
      `}</style>
    </div>
  );
}
