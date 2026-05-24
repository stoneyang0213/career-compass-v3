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
import { Copy, Printer, RotateCcw, AlertCircle, Sparkles } from "lucide-react";
import { store } from "../lib/store";

type Status = "idle" | "connecting" | "streaming" | "done" | "error";

interface MetaInfo {
  model: string;
  scores: {
    hollandCode: string;
    mbtiType: string;
    valuesTop3: string[];
  };
}

export default function ReportStream() {
  const [status, setStatus] = useState<Status>("idle");
  const [meta, setMeta] = useState<MetaInfo | null>(null);
  const [reportText, setReportText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
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
            setMeta({ model: json.model, scores: json.scores });
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
    setFinishedAt(Date.now());
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

      {/* === Connecting / streaming-but-no-content === */}
      {(status === "connecting" || (status === "streaming" && reportText.length === 0)) && (
        <div
          className="rounded-xl p-6 text-center"
          style={{ background: "var(--color-surface-warm)" }}
        >
          <div className="flex justify-center gap-1 mb-3" aria-label="加载中">
            <span className="loading-dot" />
            <span className="loading-dot" style={{ animationDelay: "0.2s" }} />
            <span className="loading-dot" style={{ animationDelay: "0.4s" }} />
          </div>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            正在为你生成深度报告,大约需要 4-5 分钟。
            <br />
            <span style={{ color: "var(--color-text-muted)" }}>
              期间可以离开页面再回来,但**不要关闭浏览器**,否则需重新提交答案。
            </span>
          </p>
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
