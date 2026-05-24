// ============================================================
// 提示词构造 · 输入完整 profile → 输出给 LLM 的 prompt 字符串
// 移植自 v3 思路（career compass v1 的 prompt-v3.js）
// 关键改进：
// 1. 不要求用户填「择世所需」，由 industry_trends 数据库 + 其他维度推断
// 2. 注入真实测评结果（已计分的 MBTI/Holland/Values，不是机械推断）
// 3. 严格 careerStage 自适应行动计划
// ============================================================

import type { AssessmentProfile, BasicInfo, Context, Dimensions } from "./types";
import type { ComputedProfile } from "./scoring";
import { hollandTypeName } from "./scoring";
import trendsData from "../data/industry_trends.json";

interface BuildPromptInput {
  basic: BasicInfo;
  context: Context;
  computed: ComputedProfile;
  dimensions: Dimensions;
}

export function buildPrompt(input: BuildPromptInput): string {
  const { basic, context, computed, dimensions } = input;
  const today = new Date().toISOString().slice(0, 10);
  return `You are a highly experienced Senior Career and Vocational Planning Mentor. Generate a comprehensive, professional, and actionable career planning report in **Simplified Chinese (中文)** based on the assessment data below.

**当前时间: ${today}** — 涉及具体工具/产品版本时用「最新版」描述,不要绑死过期版本号(LLM 训练数据可能滞后)

⚠️ 重要要求:
1. 必须用中文输出
2. 必须基于真实测评数据 + 情境信息深度解读，不要泛泛而谈
3. 报告深度不少于 4500 中文字符，参照专业职业测评机构水准
4. 每个推荐职业要有具体趋势/数据支撑（引用下方 industry_trends 数据），不要空话
5. 必须严格关联用户真实测评结果（每段分析点名引用 MBTI/霍兰德/舒伯具体数据）
6. 必须充分利用情境信息（教育/工作/地域/约束）做推荐
7. **「择世所需」用户未填**，请基于 industry_trends 库 + 用户的 mbti/holland/values 维度组合推断；推荐职业时**必须引用 industry_trends 中的 ai_exposure（高/中/低）字段做 AI 时代视角解读**
8. 行动计划必须匹配用户当前职业阶段（在校 / 应届 / 在职 / 转型 等）
9. **抗幻觉硬约束**: 学习资源类（课程 / 书 / 工具 / 认证 / 平台 / KOL）**必须真实存在**。如果你不能 100% 确定具体名字真实存在,**改用方向描述代替**,不要编造:

   ❌ 不要编造具体课程名:
   - "《跟李睿睿学 AI》" / "得到 App《某某学 AI 实战课》"(LLM 容易拼装看似真实的中文课程名)
   - "极客时间《AI 大模型实战专栏》"(具体专栏名要核实)

   ❌ 不要引用过时工具版本:
   - "用 ChatGPT Plus 或 Claude 3"(Claude 已迭代到 4.x,见上方当前时间)
   - "GPT-4 Turbo"(可能已被新版替代)

   ✅ 用方向描述代替:
   - "得到 / 极客时间 / 知乎知学堂上 AI 实战类系统课程(自行筛选最新评分高的)"
   - "最新版 Claude / 当前主流闭源大模型"
   - "AI Coding 工具(如 Cursor / Claude Code 等当下主流)"

   ✅ 真实可验证的资源可以保留:
   - 具体出版的书籍 + 作者:《纳瓦尔宝典》Naval Ravikant、《精益创业》Eric Ries
   - 知名公开人物 / 公司:Pieter Levels (levels.io)、Karpathy 公开教程

---

## 用户档案

### 基本信息
${fmtBasic(basic)}

### 情境（教育 / 工作 / 约束）
${fmtContext(context)}

### MBTI 性格类型（基于 12 题快速版测评）
- 类型: **${computed.mbti.type}**
- 4 维度得分: E=${computed.mbti.scores.E} / I=${computed.mbti.scores.I} / S=${computed.mbti.scores.S} / N=${computed.mbti.scores.N} / T=${computed.mbti.scores.T} / F=${computed.mbti.scores.F} / J=${computed.mbti.scores.J} / P=${computed.mbti.scores.P}

### 霍兰德职业兴趣（基于 12 题快速版测评）
- 三字代码: **${computed.holland.code}** (${computed.holland.code.split("").map(hollandTypeName).join(" / ")})
- 6 类型完整得分:
${Object.entries(computed.holland.scores).map(([k, v]) => `  - ${k} ${hollandTypeName(k)}: ${v}`).join("\n")}

### 舒伯职业价值观（基于 15 题快速版测评）
- 最看重的 3 项: **${computed.values.top3.join(" / ")}**
- 最不在意的 3 项: ${computed.values.bottom3.join(" / ")}
- 完整得分（高到低）:
${computed.values.scores.map((s) => `  - ${s.dim}: ${s.score}`).join("\n")}

### 用户深度自述（爱 / 长 / 利 三段）
**💖 择己所爱（兴趣与热情）:**
${dimensions.passion}

**💪 择己所长（技能与优势）:**
${dimensions.strength}

**💰 择己所利（个人与财务目标）:**
${dimensions.value}

---

## 行业趋势数据库（用于「择世所需」判读）

${formatTrends(computed)}

请根据用户的 MBTI/霍兰德/舒伯/教育/工作背景，从上述行业列表中选出 **2-3 个最匹配的赛道**，作为「择世所需」分析与职业推荐的客观依据。**不要凭空编造行业前景数据**，必须引用上面提供的 growth / drivers / risks 字段内容。

---

## 报告结构要求

### I. 执行摘要（300-400 字）
高度概括用户的复合画像、核心矛盾或独特优势、首要职业方向推荐。必须明确引用情境字段。

### II. 个人画像深度分析

**A. 择己所爱**
- 基于 MBTI 类型的内驱机制
- 基于霍兰德高分维度的兴趣锚点
- 综合推断核心兴趣主题（3-5 关键词）

**B. 择己所长**
- 基于 MBTI 认知偏好转化的能力优势
- 基于霍兰德代码的天然天赋
- 充分利用教育/专业背景论证差异化优势
- 给出 3-5 项核心能力 + 真实场景应用例子

**C. 价值观与生活方式偏好**
- 基于舒伯 top3/bottom3 详细解读
- 推断理想工作环境画像
- 标记任何价值观间冲突或张力

### III. 推荐职业路径（2-3 条）
每条必须包含：
1. 职业定义 + 所属行业
2. 四维框架贴合度（爱/长/需/利 各 2-3 句，「需」必须引用上面 industry_trends 数据 + AI 暴露度判断）
3. 典型职责（5-7 条）
4. 能力门槛
5. 行业前景（**直接引用 industry_trends 中的 growth/drivers/risks**）
6. **AI 时代视角**：引用该行业的 ai_exposure（高/中/低），具体说明 AI 对该职业的影响 + 用户应当如何在 AI 替代曲线上找到差异化定位（哪些任务会被替代、哪些任务因 AI 增值、应当向哪类技能 / 角色上移）
7. 薪资范围（结合 targetLocation 给地域对应区间）
8. 匹配度评分（0-100）

### IV. 首选路径深度剖析
- 职业发展轨迹（初级→中级→高级 + 专家/管理双通道）
- 潜在挑战与对策
- 探索路径（试水步骤）
- 必备技能 + 推荐学习资源（具体名）

### V. 行动计划
**必须匹配 careerStage = "${context.careerStage}"**:
- 在校 → 短期：本学期 + 暑假 / 中期：大三大四 / 长期：毕业后 1-3 年
- 在职转型 → 短期：8-12 周 / 中期：6-12 月 / 长期：1-3 年
- 自由职业 → 短期：客户开发 / 中期：定位深化 / 长期：品牌建立

每条时间锚点明确、可观察可衡量、具体到行为。

### VI. 导师寄语（200-300 字）
基于用户特质给鼓励，引用一句相关名言或框架。

---

## 输出格式

**严格返回纯 JSON**（不要 markdown code block 包裹，不要任何额外说明文字）:

\`\`\`
{
  "executiveSummary": {
    "overview": "300-400 字执行摘要（必须引用情境字段）",
    "topRecommendation": "首要推荐职业路径名称"
  },
  "personalProfile": {
    "passions": {
      "description": "400-500 字深度分析",
      "keyThemes": ["主题1", "主题2", "主题3"],
      "alignmentWithMBTI": "MBTI 契合度详细分析",
      "alignmentWithHolland": "霍兰德契合度详细分析"
    },
    "skills": {
      "description": "400-500 字深度分析（含教育背景差异化优势）",
      "coreCompetencies": ["能力1", "能力2", "能力3"],
      "personalitySupport": "性格支撑分析",
      "naturalAptitudes": "天赋领域分析"
    },
    "values": {
      "description": "400-500 字深度分析（解读舒伯 top3/bottom3）",
      "coreValues": ["价值观1", "价值观2", "价值观3"],
      "workEnvironment": "理想工作环境画像",
      "lifestyleGoals": "生活方式与财务目标"
    }
  },
  "careerPaths": [
    {
      "title": "职业名称",
      "description": "一句话描述 + 所属行业",
      "frameworkAlignment": {
        "passion": "爱的贴合度论证",
        "strength": "长的贴合度论证（含教育/专业背景）",
        "demand": "需的贴合度（必须引用 industry_trends 数据 + AI 暴露度高/中/低）",
        "benefit": "利的贴合度（结合 targetLocation 给薪资）"
      },
      "responsibilities": ["职责1", "职责2", "职责3", "职责4", "职责5"],
      "qualifications": ["门槛1", "门槛2", "门槛3"],
      "demand": "行业前景（引用 industry_trends growth/drivers）",
      "aiTimeContext": "AI 时代视角：引用 ai_exposure 高/中/低 + 该职业哪些任务被 AI 替代 / 哪些因 AI 增值 + 差异化定位建议",
      "earningPotential": "薪资范围（按 targetLocation 给）",
      "matchScore": 88
    }
  ],
  "deepDive": {
    "recommendedPath": "首选路径名称",
    "careerTrajectory": "300-400 字职业发展轨迹",
    "challenges": ["挑战1（含对策）", "挑战2（含对策）", "挑战3（含对策）"],
    "opportunities": ["机会1", "机会2", "机会3"],
    "explorationSteps": ["试水步骤1", "试水步骤2", "试水步骤3"],
    "requiredSkills": ["必备技能1", "必备技能2", "必备技能3"],
    "certifications": ["推荐认证/课程1", "推荐认证/课程2"]
  },
  "actionPlan": {
    "shortTerm": {
      "timeline": "根据 careerStage 自适应",
      "steps": ["行动1", "行动2", "行动3", "行动4", "行动5"],
      "skills": ["技能1", "技能2"],
      "networking": ["社交动作1", "社交动作2"],
      "resources": ["资源1（具体名）", "资源2", "资源3"]
    },
    "midTerm": {
      "timeline": "自适应",
      "milestones": ["里程碑1", "里程碑2", "里程碑3"],
      "resumeEnhancement": ["简历强化1", "简历强化2"],
      "jobSearchPrep": ["求职准备1", "求职准备2"]
    },
    "longTerm": {
      "timeline": "1-3 年",
      "careerGoals": ["职业目标1", "职业目标2"],
      "professionalDevelopment": ["专业发展1", "专业发展2"],
      "targets": ["收入目标", "生活方式目标"]
    }
  },
  "concludingRemarks": "200-300 字导师寄语，引用一句相关名言"
}
\`\`\`

再次强调：纯 JSON 输出，不含任何 markdown 包裹。中文。深度不少于 4500 字符。每段分析必须引用真实测评数据 + industry_trends 数据。`;
}

// ─── helpers ─────────────────────────────────────────────────

function fmtBasic(b: BasicInfo): string {
  return [
    `- 姓名: ${b.name}`,
    `- 年龄: ${b.age}`,
    b.gender ? `- 性别: ${b.gender}` : null
  ].filter(Boolean).join("\n");
}

function fmtContext(c: Context): string {
  const lines = [
    c.educationLevel ? `- 教育阶段: ${c.educationLevel}` : null,
    c.school ? `- 学校: ${c.school}` : null,
    c.major ? `- 专业: ${c.major}` : null,
    c.graduationYear ? `- 毕业年份: ${c.graduationYear}` : null,
    c.workYears != null ? `- 工作年限: ${c.workYears} 年` : null,
    c.currentIndustry ? `- 当前行业: ${c.currentIndustry}` : null,
    c.currentRole ? `- 当前角色: ${c.currentRole}` : null,
    c.careerStage ? `- **当前职业阶段: ${c.careerStage}**` : null,
    c.targetLocation ? `- 目标工作地: ${c.targetLocation}` : null,
    c.incomeFloor != null ? `- 可接受最低年薪: ${c.incomeFloor} 万` : null,
    c.incomeTarget != null ? `- 理想年薪: ${c.incomeTarget} 万` : null,
    c.constraints ? `- 其他约束: ${c.constraints}` : null
  ].filter(Boolean);
  return lines.length ? lines.join("\n") : "（情境信息为空）";
}

function formatTrends(computed: ComputedProfile): string {
  const trends = (trendsData as { trends: TrendItem[] }).trends;

  // 基于用户 Holland code + MBTI type 的字母集预筛 top 8 行业
  // 防止 35 行业全 dump 让 prompt 18k+ chars 拖慢 LLM(实测 12min+ 不出报告)
  const userLetters = new Set([
    ...computed.holland.code.split(""),
    ...computed.mbti.type.split("")
  ]);
  const TOP_N = 8;
  const filtered = trends
    .map((t) => ({ t, score: t.tags.filter((tag) => userLetters.has(tag)).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_N)
    .map((x) => x.t);

  return filtered
    .map(
      (t, i) => `**${i + 1}. ${t.industry}**
- 主要贴合的霍兰德/MBTI 维度: ${t.tags.join(" / ")}
- AI 暴露度: ${t.ai_exposure}（高=>50% 任务可被 AI 替代 / 中=30-50% / 低=<30%）
- 增长前景: ${t.growth}
- 增长驱动: ${t.drivers}
- 风险: ${t.risks}`
    )
    .join("\n\n");
}

interface TrendItem {
  industry: string;
  tags: string[];
  ai_exposure: string;
  growth: string;
  drivers: string;
  risks: string;
}

/** 验证 profile 是否完整可用于生成（确保所有必填字段有） */
export function validateProfileForGeneration(p: AssessmentProfile): { ok: boolean; missing?: string[] } {
  const missing: string[] = [];
  if (!p.basic) missing.push("basic");
  if (!p.context?.careerStage) missing.push("context.careerStage");
  if (!p.mbtiAnswers || Object.keys(p.mbtiAnswers).length === 0) missing.push("mbtiAnswers");
  if (!p.hollandAnswers || Object.keys(p.hollandAnswers).length === 0) missing.push("hollandAnswers");
  if (!p.valuesAnswers || Object.keys(p.valuesAnswers).length === 0) missing.push("valuesAnswers");
  if (!p.dimensions?.passion || !p.dimensions?.strength || !p.dimensions?.value) missing.push("dimensions");
  return missing.length === 0 ? { ok: true } : { ok: false, missing };
}
