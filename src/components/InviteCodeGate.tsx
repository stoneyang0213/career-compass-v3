// ============================================================
// Career Compass v3 · InviteCodeGate
//
// 首页"开始测评"前的邀请码门槛。
// - 4 位数字输入(自动 trim,只接受数字字符)
// - 支持 URL 参数预填: /?code=8888 → 自动校验
// - localStorage 记住已验证码,刷新页面不再二次验证
// - 验证通过 → 显示"开始测评"按钮,跳转 /assess/chapter/1
// ============================================================

import { useEffect, useRef, useState } from "react";

type Status = "idle" | "checking" | "ok" | "error";

const STORAGE_KEY = "cc_invite_code";

export default function InviteCodeGate() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errMsg, setErrMsg] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const autoCheckedRef = useRef(false);

  // Mount: 检查 localStorage / URL ?code=
  useEffect(() => {
    if (autoCheckedRef.current) return;
    autoCheckedRef.current = true;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && /^\d{4}$/.test(stored)) {
      setCode(stored);
      setStatus("ok");
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const urlCode = urlParams.get("code")?.trim();
    if (urlCode && /^\d{4}$/.test(urlCode)) {
      setCode(urlCode);
      void verify(urlCode);
    }
  }, []);

  async function verify(targetCode: string): Promise<void> {
    setStatus("checking");
    setErrMsg("");
    try {
      const resp = await fetch("/api/check-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: targetCode })
      });
      const data = (await resp.json()) as { ok: boolean; message?: string };
      if (data.ok) {
        localStorage.setItem(STORAGE_KEY, targetCode);
        setStatus("ok");
      } else {
        setStatus("error");
        setErrMsg(data.message ?? "邀请码无效");
      }
    } catch (err) {
      setStatus("error");
      setErrMsg("网络异常,请稍后再试");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!/^\d{4}$/.test(trimmed)) {
      setStatus("error");
      setErrMsg("请输入 4 位数字邀请码");
      inputRef.current?.focus();
      return;
    }
    void verify(trimmed);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // 只保留数字,最多 4 位
    const v = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCode(v);
    if (status === "error") {
      setStatus("idle");
      setErrMsg("");
    }
  }

  // 验证通过 → 显示"开始测评"按钮
  if (status === "ok") {
    return (
      <div className="flex flex-col items-center gap-3">
        <a
          href="/assess/chapter/1"
          className="inline-flex items-center justify-center gap-2 font-semibold rounded-md transition-opacity duration-150 hover:opacity-90 active:opacity-80 cursor-pointer px-8 py-3 text-lg"
          style={{ background: "var(--color-brand)", color: "white" }}
        >
          开始测评
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </a>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          邀请码 {code} 已验证 ·{" "}
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              setCode("");
              setStatus("idle");
            }}
            className="underline hover:opacity-70"
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "inherit" }}
          >
            换个码
          </button>
        </p>
      </div>
    );
  }

  // 默认 / checking / error 状态 → 显示输入表单
  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="4 位邀请码"
          value={code}
          onChange={handleChange}
          disabled={status === "checking"}
          maxLength={4}
          className="px-4 py-3 rounded-md text-center text-lg font-mono tracking-widest"
          style={{
            width: "180px",
            border: `1.5px solid ${status === "error" ? "#DC2626" : "var(--color-border)"}`,
            background: "white",
            outline: "none"
          }}
        />
        <button
          type="submit"
          disabled={status === "checking" || code.length !== 4}
          className="inline-flex items-center justify-center gap-2 font-semibold rounded-md transition-opacity duration-150 hover:opacity-90 active:opacity-80 cursor-pointer px-6 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "var(--color-brand)", color: "white" }}
        >
          {status === "checking" ? "验证中…" : "开始测评"}
        </button>
      </div>
      {status === "error" && (
        <p className="text-xs" style={{ color: "#DC2626" }}>
          {errMsg}
        </p>
      )}
      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        没有邀请码?请联系 stoneyang 申请内测资格
      </p>
    </form>
  );
}
