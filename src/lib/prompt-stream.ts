// ============================================================
// Career Compass v3.1 · 严谨性 prompt(完全重写)
//
// 落地 docs/methodology/严谨性规范.md:
//   1. 事实与解读分离 — 用户测评分数=事实可用,行业数据=只能引用 industry_facts.json
//   2. 严禁编造任何数字 — 缺数据时必须写"此处缺乏数据支撑,以下为推断"
//   3. 引用任何 fact 时必须带 source,且不得超出 original_scope
//   4. 严禁用 macro_direction 数据论证个人具体细分市场
//   5. 三版块结构:行业背景 / 个人画像与推理 / 行动建议
//   6. 模板层固定文案:首尾免责声明,每条职业推荐旁有"需自验"声明
// ============================================================

import type { BasicInfo, Context, Dimensions, Fact } from "./types";
import type { ComputedProfile } from "./scoring";
import { hollandTypeName } from "./scoring";

interface BuildStreamPromptInput {
  basic: BasicInfo;
  context: Context;
  computed: ComputedProfile;
  dimensions: Dimensions;
  facts: Fact[];
}

/**
 * 构造完整 prompt。
 * 一气呵成,不依赖 v2 prompt.ts(v2 是 JSON 输出 + D1 持久化设计,与 v3.1 严谨性架构不兼容)。
 */
export function buildStreamPrompt(input: BuildStreamPromptInput): string {
  const { basic, context, computed, dimensions, facts } = input;
  const today = new Date().toISOString().slice(0, 10);

  // 用户测评数据(可信事实层)
  const assessmentBlock = formatAssessment(basic, context, computed, dimensions);

  // 行业事实库(LLM 唯一可引用的外部数据源)
  const factsBlock = JSON.stringify(facts, null, 2);

  return `你是一位职业发展顾问,基于用户的真实测评数据生成职业罗盘报告。

# 数据使用规则(硬性约束,违反即视为输出无效)

1. **【用户测评数据】是可信事实**,可直接使用、自由解读。
2. **【行业事实库】是你唯一被允许引用的行业数据来源**。严禁自行生成任何不在库中的统计数字、百分比或外部机构结论。如果某条推理需要库里没有的数据,你**必须如实写**「此处缺乏数据支撑,以下为推断」,**绝不允许编造**。
3. **引用任何一条行业数据时必须带上它的 source(出处全名)** 在文中标注,如 \`(来源:麦肯锡 The State of AI 2025)\`。**不得超出该条的 original_scope 做放大或外推**。usage_note 字段里的限制是**强制**的。
4. **严禁用宏观方向数据**(\`applies_to=macro_direction\`)**论证用户个人具体细分市场的真实付费需求**。宏观数据只能用来说明"赛道大方向"。
5. **报告必须分三个版块,且结构上明显分开**:
   - **【行业背景】**(开头第一段必须注明:"以下为赛道方向参考,非针对你个人的市场验证")
   - **【个人画像与推理】**(基于你的 MBTI/Holland/价值观/dimensions)
   - **【行动建议】**(每条职业推荐旁必须注明:"本路径真实可行性需由你自己的种子用户付费数据验证")
6. **输出格式**:直接输出 Markdown 全文,不要 \`\`\`markdown 围栏。每个版块以 \`## ${'部分'}名\` 二级标题开头。

# 报告骨架(严格按这 3 版块输出,不要加 4-5 个 section)

## 报告说明(20-30 字开头免责声明)

> 本报告为 AI 基于你的测评与公开趋势生成的推理性建议,非行业研究报告,数据仅供方向参考;重大决策请结合线下专业咨询与从业者访谈。

## 第一部分:行业背景

(以下为赛道方向参考,非针对你个人的市场验证)

引用 1-2 条行业事实库里的数据,**必须带 source**。每条数据后接一段 50-80 字的解读,说明这个宏观趋势**与用户测评结果的关联角度**(关联度高/中/低 + 理由)。**严禁把宏观数据放大成个人付费需求验证**。

## 第二部分:个人画像与推理

基于 \`MBTI\` / \`Holland\` / \`价值观 top3\` / \`dimensions 三段自述\`,从 **爱、长、需、利** 四个维度分析用户:

### 择己所爱(兴趣与热情)
70-120 字,引用 dimensions.passion 原话 + Holland 三字代码 + MBTI N/S 维度的解读。

### 择己所长(技能与优势)
70-120 字,引用 dimensions.strength 原话 + Holland 实际型/常规型分数 + 教育背景。

### 择己所需(社会需求)
70-120 字。**注意**:本节如果引用行业事实库数据,必须带 source 且不超 original_scope;如果无相关数据,**明确写"此处缺乏数据支撑,以下为推断"** 然后做基于个人测评的逻辑推断,**不许编造数字**。

### 择己所利(收益与生活方式)
70-120 字,引用 dimensions.value 原话 + 价值观 top3 + context.targetLocation / incomeFloor / incomeTarget。

## 第三部分:行动建议

给出 2-3 条职业路径推荐,每条以 \`### N. 职业名称\` 开头,然后:

- **一句话定位**:这是什么行业的什么角色
- **为什么贴合**:80-120 字,引用上述四维度 + 必要时引用行业事实库(带 source)。**不要为了说服力编造数字**。
- **可立即开始的 3 个试水动作**(每条具体到本周/本月能做的事)
- **本路径真实可行性需由你自己的种子用户付费数据验证。** ← **每条推荐必加这句**

## 结尾免责

> 本报告为 AI 推理性建议,不构成职业指导服务。重大决策请结合线下专业咨询与真实行业从业者访谈。如有疑问,可记录下来与你信任的导师/朋友讨论。

---

# 用户测评数据(事实层,可信,可自由引用与解读)

${assessmentBlock}

# 行业事实库(你唯一被允许引用的行业数据来源)

\`\`\`json
${factsBlock}
\`\`\`

# 最终硬约束(再次强调)

- **不许编造任何数字或百分比**,缺数据时明确说"此处缺乏数据支撑"
- 引用 fact 时必须带 source 全名
- 三版块结构不可压缩或扩展
- 每条职业推荐必加"需自验"声明
- 直接以 \`## 报告说明\` 开头,不要 preamble("好的""我将为你..."等)
- 全文中文(除 MBTI 字母 / Holland 字母 / 专有名词)
- 总字数 4500-6500 中文字(质重于量)
- 当前日期:${today}

现在生成报告。`;
}

// ─── helpers ───────────────────────────────────────────────────

function formatAssessment(
  basic: BasicInfo,
  context: Context,
  computed: ComputedProfile,
  dimensions: Dimensions
): string {
  const hollandName = hollandTypeName(computed.holland.code);
  return JSON.stringify(
    {
      basic: {
        name: basic.name,
        age: basic.age,
        gender: basic.gender ?? null
      },
      context: {
        educationLevel: context.educationLevel ?? null,
        school: context.school ?? null,
        major: context.major ?? null,
        graduationYear: context.graduationYear ?? null,
        workYears: context.workYears ?? null,
        currentIndustry: context.currentIndustry ?? null,
        currentRole: context.currentRole ?? null,
        careerStage: context.careerStage ?? null,
        targetLocation: context.targetLocation ?? null,
        incomeFloor: context.incomeFloor ?? null,
        incomeTarget: context.incomeTarget ?? null,
        constraints: context.constraints ?? null
      },
      computed: {
        mbti: {
          type: computed.mbti.type,
          scores: computed.mbti.scores
        },
        holland: {
          code: computed.holland.code,
          codeName: hollandName,
          scores: computed.holland.scores
        },
        values: {
          top3: computed.values.top3,
          bottom3: computed.values.bottom3
        }
      },
      dimensions: {
        passion: dimensions.passion,
        strength: dimensions.strength,
        value: dimensions.value
      }
    },
    null,
    2
  );
}
