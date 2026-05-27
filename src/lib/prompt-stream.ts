// ============================================================
// Career Compass v3.2 · 严谨性 prompt + 11 段丰满骨架
//
// 在 v3.1 基础上(严谨性机制保留),把报告结构从 3 版块扩到 v2 kimi 风格 11 段:
//   1. 执行摘要(开篇钩子)
//   2-4. 个人画像 3 节(择己所爱 / 所长 / 价值观与生活方式偏好)
//   5. 推荐职业路径(3 条 × 6 段标准化:行业分类 / 爱-长-需-利 / 核心职责 / 入行门槛 / 薪资范围 / AI 时代视角)
//   6-10. 首选路径深度剖析(职业轨迹 / 挑战 / 机会 / 试水 / 必备技能 / 资源)
//   11. 行动计划(30 天 / 90 天 / 1 年)
//   12. 写在最后(替换"导师寄语")
//
// 严谨性约束(v3.1 保留,嵌进每一段相关位置):
//   - 事实与解读分离 — 用户测评分数 = 事实可用,行业数据 = 只能引用 industry_facts.json
//   - 严禁编造任何数字 — 缺数据时写"此处缺乏数据支撑,以下为推断"
//   - 引用 fact 时必须带 source,不得超出 original_scope
//   - 严禁用 macro_direction 数据论证个人具体细分市场
//   - 每条职业推荐结尾必加"本路径真实可行性需由你自己的种子用户付费数据验证"
//   - 字数目标 6000-7500 中文字(2026-05-27 从 7500-9000 下调:SiliconFlow streaming 实测 ~12500 字封顶,CF Worker 转发再损耗,留 buffer 保证收尾"行动计划"完整)
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
  const isStudent = context.identityRole === "student";

  // 用户测评数据(可信事实层)
  const assessmentBlock = formatAssessment(basic, context, computed, dimensions);

  // 行业事实库(LLM 唯一可引用的外部数据源)
  const factsBlock = JSON.stringify(facts, null, 2);

  // 身份语境调整块 — 插在 prompt 中段,让 LLM 在每个相关章节内做学生/职场措辞切换
  const identityBlock = isStudent
    ? `\n# 用户身份:学生(${context.educationLevel ?? "未明"}${context.grade ? " · " + context.grade : ""})

**报告整体语境必须按学生处理,不许默认成职场叙事**:

1. **执行摘要**:开篇必须明确指出用户是学生(年级 + 学校 + 专业方向),核心议题是"在 AI 时代如何选定专业方向 / 升学路径 / 兴趣发展",而不是"职业转型"或"创业"。
2. **个人画像 · 价值观与生活方式偏好**:不要谈"收入底线 vs 目标"(学生没有);讨论"想读什么样的研究生 / 想去什么样的城市 / 不愿意接受的人生轨迹"。
3. **推荐职业路径**:把"路径"换成"建议的方向 / 适合走的赛道";"薪资范围"一段改写为"该方向的升学路径 / 大学专业建议 / 起步岗位类型",并明确写"以下为基于公开就业市场的常识参考,无独立薪酬数据支撑"。
4. **行动计划三梯度**:把"30 天 / 90 天 / 1 年"改成"**本学期 / 这个寒暑假 / 下一学年**",任务硬约束改为"加入 X 社团 / 报 X MOOC 课 / 读 X 书 / 做 X 个实习信息访谈"等学生场景可执行动作。**禁止出现**"招募种子用户""做付费转化""上线 MVP""B2B 提案"这类创业行话。
5. **试水步骤**:硬约束改为"具体到课程名 / 学生社团 / 实习信息访谈 / 公开作品集 / 学科竞赛"。
6. **"写在最后"**:语气克制,**不要装人生导师**,像一位读过书的朋友给学生的一句话提醒。
`
    : `\n# 用户身份:职场(${context.careerStage ?? "未明"} · 工作 ${context.workYears ?? "?"} 年)

报告按职场叙事:推荐路径关注"职业转型/深耕/创业方向",薪资范围按一线城市职场区间给区间,行动计划 30 天 / 90 天 / 1 年。
`;

  return `你是一位资深职业发展顾问,基于用户的真实测评数据生成一份**结构完整、丰满可读、可执行**的职业罗盘报告。

${identityBlock}

# 数据使用规则(硬性约束,违反即视为输出无效)

1. **【用户测评数据】是可信事实**,可直接使用、自由解读。
2. **【行业事实库】是你唯一被允许引用的行业数据来源**。严禁自行生成任何不在库中的统计数字、百分比或外部机构结论。某条推理需要库里没有的数据时,**必须如实写**「此处缺乏数据支撑,以下为推断」,**绝不允许编造**。
3. **引用任何一条行业数据时必须带上它的 source(出处全名)** 在文中标注,如 \`(来源:麦肯锡 The State of AI 2025)\`。**不得超出该条的 original_scope 做放大或外推**。usage_note 字段里的限制是**强制**的。
4. **严禁用宏观方向数据**(\`applies_to=macro_direction\`)**论证用户个人具体细分市场的真实付费需求**。宏观数据只能用来说明"赛道大方向"。
5. **每条推荐职业路径必须以这句话结尾**(原文不可改写):「本路径真实可行性需由你自己的种子用户付费数据验证。」
6. **输出格式**:直接输出 Markdown 全文,不要 \`\`\`markdown 围栏。每个一级章节用 \`## 章节名\`,子节用 \`### 子节名\`。

# 报告骨架(严格按 11 段输出,不可压缩或合并)

## 报告说明

> 本报告为 AI 基于你的测评与公开趋势生成的推理性建议,非行业研究报告,数据仅供方向参考;重大决策请结合线下专业咨询与从业者访谈。

## 执行摘要

**500-700 字**。这是开篇钩子,要让用户读完第一段就觉得"被看见了"。结构:
- 第 1 段:用户基本画像凝练(姓名、年龄、教育、工作经验、当前阶段),引用 \`computed.mbti.type\` + \`computed.holland.code\` + \`computed.values.top3\`,点出**核心矛盾或核心特质**。
- 第 2 段:基于上述画像 + \`context.targetLocation\` / \`incomeFloor\` / \`incomeTarget\`,**预告**首选职业路径和次要路径(名字 + 一句话理由)。可以引 1 条最贴合的 fact 做赛道背书(必须带 source)。

## 个人画像

(以下三节,每节 200-300 字)

### 择己所爱
引用 \`dimensions.passion\` 原话作锚点,叠加 MBTI 的 N/S/F/T 维度解读 + Holland 的研究型/艺术型/社会型分数解读。说清楚"用户的心流地带在哪、为什么是这里"。

### 择己所长
引用 \`dimensions.strength\` 原话作锚点,叠加 Holland 的实际型/常规型分数 + \`context.educationLevel\` / \`school\` / \`major\` / \`workYears\` / \`currentIndustry\`。说清楚"用户的硬护城河 + 软优势,以及它们如何叠加成差异化能力"。

### 价值观与生活方式偏好
引用 \`dimensions.value\` 原话作锚点,叠加 \`computed.values.top3\` 与 \`computed.values.bottom3\` 的对比(top vs bottom 的张力往往揭示真实优先级)+ \`context.targetLocation\` / \`incomeFloor\` / \`incomeTarget\` / \`constraints\`。说清楚"用户愿意拿什么换什么,以及由此衍生的工作环境画像"。**结尾点出 1-2 个潜在价值观张力**(如理想主义 vs 现金流)。

## 推荐职业路径

给出 **3 条** 职业路径,按贴合度从高到低排序。每条用 \`### N. 路径名 (matchScore: NN)\` 开头(matchScore 取 70-99 之间整数),然后**严格按以下 6 个子段顺序输出**,每段必须有内容:

**行业分类**:用一行点明这条路径所在的行业大类与细分赛道。

**爱-长-需-利 贴合度论证**:用列表给出 4 个要点,每点 30-60 字:
- **爱**:对应 \`dimensions.passion\` 与 MBTI/Holland 兴趣维度
- **长**:对应 \`dimensions.strength\` 与硬技能、教育、过往经历
- **需**:对应行业事实库的相关 fact —— **必须带 source**;如果该条路径在库里无对应 fact,**写「此处缺乏直接数据支撑,以下为推断」**,然后基于宏观趋势做谨慎推断
- **利**:对应 \`dimensions.value\` 与 \`incomeFloor\` / \`incomeTarget\` / \`targetLocation\`

**核心职责**:用 4-5 个 bullet 描述这条路径的典型日常工作内容,要具体到动作(设计 X / 主导 Y / 对接 Z),不要空泛。

**入行门槛**:用 3-4 个 bullet 列出进入这个路径需要的关键能力或资源,**指出用户当前已具备的部分**与**需要补足的部分**。

**薪资范围**:基于 \`context.targetLocation\` 给出一线城市该路径的合理年薪区间。**如果库里没有具体薪酬数据,明确写"以下为基于公开招聘市场的常识性估算,无独立数据源支撑"** 然后给区间。

**AI 时代视角**:引用与 AI 相关的 fact(带 source) + 该路径在 AI 浪潮中的暴露度(低 / 中 / 高,自行判断,讲清理由) + 用户的差异化定位建议。

**结尾句**(每条路径必加,原文不变):「本路径真实可行性需由你自己的种子用户付费数据验证。」

## 首选路径深度剖析

针对上面 matchScore 最高的那条路径,展开 5 个子节:

### 职业发展轨迹
**400-500 字**。基于 \`context.careerStage\`,给出未来 3-5 年的路径地图,分 **3 个阶段**(每阶段含时间窗口 + 核心任务 + 收入预期),每阶段 100-150 字。例如"阶段一:MVP 验证期(0-12 个月)/ 阶段二:产品化与品牌锚定期(12-30 个月)/ 阶段三:规模化或深耕期(30-60 个月)"。**收入预期与 \`incomeFloor\`/\`incomeTarget\` 对照**。

### 3 个核心挑战 + 对策
**每条 80-120 字**。挑战要具体到用户的 MBTI/价值观特质可能踩的坑(如完美主义、独立性偏好与团队协作的张力等),对策要可操作。

### 3 个机会窗口
**每条 60-100 字**。每条机会必须引一条 fact 做底(带 source)或明确标"以下为推断"。可以谈宏观趋势 + 工具红利 + 细分市场窗口。

### 可立即开始的 3 个试水步骤
**每条 60-100 字**,分 30 天 / 60 天 / 90 天三个时间点。**硬约束:必须具体到工具名、平台名、产品名、书名或人物名**(如 Coze / Dify / 即刻 / 公众号 / Cursor / Pieter Levels 等),不许"找相关工具"这种空泛说法。

### 必备技能清单
用 5-7 个 bullet 列出在这条首选路径上需要持续提升的技能,每个 bullet 一句话说明用途。

### 推荐认证 / 课程 / 资源
分三类各给 2-3 条:
- **书籍(真实可验证)**:必须是真实存在、可在国内主流书店或正版电子书平台买到的书,作者名要对
- **方向性学习**:得到 App / 混沌学园 / Coursera / 极客时间等主流平台上的某类系统课程(只说类别和平台,**不要编造具体课程名**)
- **工具实践**:1-2 个真实存在的工具或方法论(Claude / Cursor / Notion / Obsidian 等)

## 行动计划

分三个时间梯度,每段 200-300 字,以 4-6 个 bullet 给出可执行任务。

### 第一个 30 天(奠基与验证)
要求每条 bullet 都是"动词开头 + 可验证的产出"(发布 X / 完成 Y / 招募 N 名)。

### 90 天内(付费验证与品牌启动)
重点是**付费转化的第一次验证** + **内容节奏建立** + **用户访谈数量**。

### 1 年内(闭环与深耕)
重点是**商业模式闭环** + **领域认知锚点** + **产品矩阵成型**。给出收入预期或客户规模目标。

## 写在最后

**200-300 字**。这是报告的收尾,**不要叫"导师寄语",不要装权威口吻**。调性参考:
- 真诚、克制、像朋友给的话,不像导师训话
- 可以点出用户身上**一个具体的张力或可能性**(从测评数据反推,不空泛抒情)
- 可以引一句真实存在的话或观察(不强求,引用必须真实)
- **结尾给一个具体的行动锚点**(如"先发布那个还不够完美的 MVP"),不喊口号

## 结尾免责

> 本报告为 AI 推理性建议,不构成职业指导服务。重大决策请结合线下专业咨询与真实行业从业者访谈。如有疑问,可记录下来与你信任的朋友讨论。

---

# 用户测评数据(事实层,可信,可自由引用与解读)

${assessmentBlock}

# 行业事实库(你唯一被允许引用的行业数据来源)

\`\`\`json
${factsBlock}
\`\`\`

# 最终硬约束(再次强调)

- **不许编造任何数字或百分比**,缺数据时明确写"此处缺乏数据支撑,以下为推断"
- 引用 fact 时必须带 source 全名 + 不超 original_scope
- **11 段骨架完整**:报告说明 / 执行摘要 / 个人画像(3 节)/ 推荐职业路径(3 条 × 6 段)/ 首选路径深度剖析(5 节)/ 行动计划(3 段)/ 写在最后 / 结尾免责
- 每条职业推荐路径必加"本路径真实可行性需由你自己的种子用户付费数据验证"
- 收尾章节叫"写在最后",**不要叫"导师寄语"**,不要装权威口吻
- 直接以 \`## 报告说明\` 开头,不要 preamble("好的""我将为你..."等)
- 全文中文(除 MBTI 字母 / Holland 字母 / 专有名词 / 真实英文工具名书名)
- **总字数硬上限 7500 中文字 — 超过会被流式截断,导致行动计划写不完**
- **字数分配建议**:报告说明 100 / 执行摘要 400 / 个人画像 3 节合计 1200 / 推荐路径 3 条合计 1800 / 深度剖析 5 节合计 2200 / 行动计划 3 段合计 1500 / 写在最后 + 免责 300 = 7500
- **行动计划必须完整写完三梯度(30 天 / 90 天 / 1 年)**,若前面段落已写多,自动压缩前段而非省略行动计划
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
