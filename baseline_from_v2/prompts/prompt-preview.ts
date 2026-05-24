// ============================================================
// 试吃报告 prompt(F 方案 change 2, 2026-05-13)
// 用户走完 5 章测评 → 看试吃版(40-60s,~1800 字) → 决定要不要留邮箱看深度版
//
// 设计原则(D1-B):
// - 中等深度,有钩子但不全说完
// - 输出 JSON,前端结构化渲染
// - 引用真实测评数据(MBTI/Holland/Values)和用户自述
// - 不用"震惊""必看""爆款"等营销词(feedback_brand_voice 公理)
// ============================================================

import type { BasicInfo, Context, Dimensions } from "./types";
import type { ComputedProfile } from "./scoring";

interface BuildPreviewPromptInput {
  basic: BasicInfo;
  context: Context;
  computed: ComputedProfile;
  dimensions: Dimensions;
}

/** 截断到 N 字以内(用户自述太长,试吃用不上完整版) */
function truncate(s: string | undefined, n: number): string {
  if (!s) return "(用户未填写)";
  return s.length > n ? s.slice(0, n) + "…" : s;
}

export function buildPreviewPrompt(input: BuildPreviewPromptInput): string {
  const { basic, context, computed, dimensions } = input;

  const stageLine = context.careerStage ?? "未知";
  const eduLine = context.educationLevel
    ? `${context.educationLevel}${context.major ? " / " + context.major : ""}`
    : "未填";
  const workLine =
    context.workYears != null
      ? `${context.workYears} 年工作经验${context.currentIndustry ? " / " + context.currentIndustry : ""}`
      : "无工作信息";

  return `你是职业规划顾问。基于用户的测评结果,给一份「试吃版」职业方向报告。

【用户基础】
姓名:${basic.name}(${basic.age} 岁,${basic.gender ?? "未填性别"})
职业阶段:${stageLine}
教育:${eduLine}
工作:${workLine}

【测评结果】
- MBTI 类型:${computed.mbti.type}
- Holland 代码:${computed.holland.code}(实/研/艺/社/企/常 中得分最高的三个)
- 价值观 Top 3:${computed.values.top3.join("、")}
- 价值观 Bottom 3(用户最不看重):${computed.values.bottom3.join("、")}

【用户自述(三维 — 第四维 "需" 由你基于市场趋势推断)】
- 爱(passion 你真心喜欢什么):
${truncate(dimensions.passion, 200)}

- 长(strength 你擅长 / 优势在哪):
${truncate(dimensions.strength, 200)}

- 需(value 你的价值观 / 想要的生活):
${truncate(dimensions.value, 200)}

---

【任务】
输出严格的 JSON,~1800 字总长度,结构如下:

\`\`\`json
{
  "fourD_overview": "...",
  "directions": [
    {
      "name": "...",
      "why_fit": "...",
      "hook": "..."
    },
    {"name": "...", "why_fit": "...", "hook": "..."},
    {"name": "...", "why_fit": "...", "hook": "..."}
  ],
  "teaser": "..."
}
\`\`\`

【字段要求】

1. **fourD_overview** (~400 字)
   四维总览:把用户的「爱 / 长 / 需 / 利」四维做一个交叉概括。
   - 「爱」「长」「需」直接基于用户自述
   - 「利」(市场需求)由你基于 MBTI/Holland/Values 推断当下哪些行业需求适合 ta
   - 找四维交集 — 不是罗列,是综合判断 ta 的"职业基调"
   - 引用至少 2 个具体测评数据点(比如 "你的 INTP 和 价值观 Top 1: ${computed.values.top3[0] ?? "..."} 决定了...")

2. **directions** (3 个,各 ~120 字)
   - **name**:8-12 字,具体的职业 / 业态(不要 "教育" 这种大词,要 "AI 教育课程主理人" 这种具体)
   - **why_fit**:~80 字,为什么适合你 — 引用 MBTI/Holland/价值观/自述其中 2-3 个点交叉论证
   - **hook**:~30 字,1 句留白勾起想看深度版的兴趣(不要给完整理由,只点钩子)

3. **teaser** (~80 字)
   完整深度版会展开的内容预告:四维框架贴合度图谱、行业趋势对照、短中长期行动计划、推荐学习资源等。

【风格硬约束】
- 不用"震惊""必看""爆款""颠覆""10x""史上最"等营销词
- 不用 emoji
- 接地气 + 口语化,但不卖弄
- 方向名要具体业态,不要给"教育"这种太宽的词
- hook 留白勾人,不要全说完
- 直接出 JSON,不要前后加解释 / 不要 markdown 代码块包裹
`;
}
