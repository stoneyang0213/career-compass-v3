// ============================================================
// Career Compass v3 · streaming markdown prompt
//
// 复用 v2 prompt.ts 上半部分(用户画像 / industry_trends 注入 / 6 section 骨架),
// **只替换底部输出格式段**:从"返回纯 JSON"→"返回 markdown 格式"。
//
// 设计理由:
//   v2 输出 JSON 是为了 D1 持久化 + 邮件渲染;
//   v3 推翻 D1 + 走 streaming UX,LLM 输出 markdown 才能 react-markdown 实时渲染。
// ============================================================

import { buildPrompt } from "./prompt";
import type { BasicInfo, Context, Dimensions } from "./types";
import type { ComputedProfile } from "./scoring";

interface BuildStreamPromptInput {
  basic: BasicInfo;
  context: Context;
  computed: ComputedProfile;
  dimensions: Dimensions;
}

const JSON_SECTION_MARKER = "## 输出格式";
const MARKDOWN_OUTPUT_INSTRUCTION = `## 输出格式

**直接输出 Markdown 格式的报告全文**,无任何额外包装(不要用 \`\`\`markdown 围栏)。
按下面 6 个 section 顺序写,每个 section 用 \`## \` 二级标题开头:

\`\`\`markdown
## 执行摘要
(300-400 字,引用 careerStage / educationLevel / targetLocation 等情境字段,
点出首要推荐职业路径名称)

## 个人画像
基于 MBTI / Holland / 价值观三套量表 + dimensions 三段自述,从「爱、长、需、利」四个维度
分析用户。每个维度独立小节(\`### \` 三级标题),100-150 字。引用真实测评数据(MBTI 类型 /
Holland 三字代码 / 价值观 top3) + dimensions 原话,避免泛泛而谈。

## 推荐职业路径
2-3 条具体职业路径。每条用 \`### N. 职业名称(matchScore: XX)\` 开头,然后:
- **行业分类**: ...
- **爱-长-需-利 贴合度论证**: 每条 1-2 句,**必须引用 industry_trends 数据**和 AI 暴露度
- **核心职责**(5 条 bullet)
- **入行门槛**(3 条 bullet)
- **薪资范围**: 按 targetLocation 给区间
- **AI 时代视角**: 该职业哪些任务被 AI 替代 / 哪些因 AI 增值 / 差异化定位建议

## 首选路径深度剖析
聚焦"## 推荐职业路径"里 matchScore 最高的那一条:
- **职业发展轨迹** (300-400 字,3-5 年内的路径地图)
- **3 个核心挑战 + 对策**(每条用 \`#### 挑战 N: ...\` 子标题)
- **3 个机会窗口**
- **可立即开始的 3 个试水步骤**
- **必备技能清单**(5-8 条 bullet)
- **推荐认证/课程**(2-3 条具体名称)

## 行动计划
按"30 天 / 90 天 / 1 年"三段式 milestone:
- **第一个 30 天**(3-5 条具体动作)
- **90 天内**(3-5 条 milestone)
- **1 年内**(2-3 条长期目标)

## 导师寄语
200-300 字。基于用户特质和当前 careerStage 给鼓励,引用一句相关名言或框架。
避免假大空套话,要真诚、具体。
\`\`\`

**硬约束**:
1. 直接以 \`## 执行摘要\` 开头,不要 preamble("好的""我将为你..."等)
2. 全文中文(除 MBTI 字母 / Holland 字母 / 专有名词)
3. 总字数 ≥ 4500 中文字
4. 每个推荐路径的爱-长-需-利论证必须引用 industry_trends 中具体行业的 growth / drivers / ai_exposure 数据,不许空说
5. 不许用 \`\`\` 代码围栏包裹任何 section
6. 不输出 JSON
`;

/**
 * 复用 v2 buildPrompt 的全部上半段,替换底部输出格式段为 markdown 指令
 */
export function buildStreamPrompt(input: BuildStreamPromptInput): string {
  const fullJsonPrompt = buildPrompt(input);
  const cutIdx = fullJsonPrompt.indexOf(JSON_SECTION_MARKER);

  if (cutIdx === -1) {
    // 找不到 marker → 直接 append markdown 指令到末尾(保底)
    return fullJsonPrompt + "\n\n" + MARKDOWN_OUTPUT_INSTRUCTION;
  }

  const head = fullJsonPrompt.slice(0, cutIdx);
  return head + MARKDOWN_OUTPUT_INSTRUCTION;
}
