// ============================================================
// Career Compass v3 · Resend 集成(简化版)
//
// 从 v2 src/lib/email.ts 沿用核心 fetch 调用,但去掉成功/失败两套模板,
// 改成"备份"语境:邮件正文 = 用户报告 markdown(简单 HTML 包裹)。
// 触发位置:/api/save 完成 D1 INSERT 后,if email + consent → fire-and-forget 调用。
// ============================================================

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export interface SendReportEmailEnv {
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
}

export interface SendReportEmailParams {
  to: string;
  name: string;
  reportText: string;
  identityRole?: "student" | "professional";
}

export interface SendReportEmailResult {
  ok: boolean;
  resendMessageId?: string;
  errorMsg?: string;
}

export async function sendReportEmail(
  env: SendReportEmailEnv,
  params: SendReportEmailParams
): Promise<SendReportEmailResult> {
  if (!env.RESEND_API_KEY) {
    return { ok: false, errorMsg: "RESEND_API_KEY not configured" };
  }

  const from = env.RESEND_FROM ?? "Career Compass <hi@mail.stoneyang.top>";
  const subject = `${params.name},这是你的 Career Compass 报告备份`;

  // markdown → 极简 HTML(只处理标题 + 段落 + 列表 + 引用,够邮件客户端)
  const html = renderReportHtml(params);
  const text = params.reportText; // 纯文本版直接给 markdown(主流客户端能读)

  try {
    const resp = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject,
        text,
        html
      })
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      return {
        ok: false,
        errorMsg: `Resend ${resp.status}: ${errBody.slice(0, 300)}`
      };
    }

    const data = (await resp.json()) as { id?: string };
    return { ok: true, resendMessageId: data.id };
  } catch (e) {
    return {
      ok: false,
      errorMsg: e instanceof Error ? e.message : String(e)
    };
  }
}

// ─── helpers ──────────────────────────────────────────────────

function renderReportHtml(params: SendReportEmailParams): string {
  const body = markdownToHtml(params.reportText);
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>你的 Career Compass 报告</title>
</head>
<body style="margin:0;padding:24px;background:#FCFAF5;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;color:#1F2937;line-height:1.75;">
  <div style="max-width:680px;margin:0 auto;background:#fff;padding:32px 40px;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
    <p style="color:#6B7280;font-size:13px;margin:0 0 24px;">
      ${escapeHtml(params.name)} 你好,这是你刚刚生成的 Career Compass 报告备份。
    </p>
    <div style="border-top:1px solid #E5E7EB;padding-top:24px;">
      ${body}
    </div>
    <hr style="border:none;border-top:1px dashed #E5E7EB;margin:32px 0 16px;">
    <p style="color:#9CA3AF;font-size:12px;line-height:1.6;margin:0;">
      Career Compass · MVP 内测版 · 2026<br>
      报告基于你的 Holland · MBTI · 舒伯三套测评 + 公开权威报告事实库生成,仅供方向参考,重大决策请结合线下专业咨询。
    </p>
  </div>
</body>
</html>`;
}

function markdownToHtml(md: string): string {
  // 极简 markdown 转 HTML:## h2 / ### h3 / **bold** / - bullet / > quote / 段落
  const lines = md.split("\n");
  const out: string[] = [];
  let inList = false;
  let inQuote = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (inList) { out.push("</ul>"); inList = false; }
      if (inQuote) { out.push("</blockquote>"); inQuote = false; }
      continue;
    }
    if (line.startsWith("## ")) {
      if (inList) { out.push("</ul>"); inList = false; }
      if (inQuote) { out.push("</blockquote>"); inQuote = false; }
      out.push(`<h2 style="font-size:20px;font-weight:700;margin:32px 0 12px;color:#2D5F8B;border-top:2px solid #2D5F8B;padding-top:18px;">${escapeInline(line.slice(3))}</h2>`);
    } else if (line.startsWith("### ")) {
      if (inList) { out.push("</ul>"); inList = false; }
      if (inQuote) { out.push("</blockquote>"); inQuote = false; }
      out.push(`<h3 style="font-size:16px;font-weight:600;margin:20px 0 8px;color:#2D5F8B;">${escapeInline(line.slice(4))}</h3>`);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      if (inQuote) { out.push("</blockquote>"); inQuote = false; }
      if (!inList) { out.push('<ul style="margin:8px 0;padding-left:24px;">'); inList = true; }
      out.push(`<li style="margin:4px 0;">${escapeInline(line.slice(2))}</li>`);
    } else if (line.startsWith("> ")) {
      if (inList) { out.push("</ul>"); inList = false; }
      if (!inQuote) { out.push('<blockquote style="margin:12px 0;padding:10px 14px;background:#F5F2EB;border-left:3px solid #C9C2B0;color:#5E6F82;font-size:14px;">'); inQuote = true; }
      out.push(`<p style="margin:4px 0;">${escapeInline(line.slice(2))}</p>`);
    } else {
      if (inList) { out.push("</ul>"); inList = false; }
      if (inQuote) { out.push("</blockquote>"); inQuote = false; }
      out.push(`<p style="margin:10px 0;">${escapeInline(line)}</p>`);
    }
  }
  if (inList) out.push("</ul>");
  if (inQuote) out.push("</blockquote>");
  return out.join("\n");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeInline(s: string): string {
  // 先 escape 再处理 **粗体**(避免 escapeHtml 把 ** 吃了)
  const escaped = escapeHtml(s);
  return escaped.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#111827;">$1</strong>');
}
