// ============================================================
// Career Compass v3 · 全局类型契约
//
// 与 v2 的差异:剥离邮件链路类型(PreviewReport / EmailSubscriberRow /
// SubscribeEmailRequest / ReportStatus 等),MVP 完全无服务端持久化。
// MVP 不要求 sessionId,但保留 ModuleId / ChapterId 兼容 scoring/prompts。
// ============================================================

// ─── 章节化测评 (5 章) ─────────────────────────────────────────────

export type ModuleId = "basic" | "context" | "mbti" | "holland" | "values" | "dimensions";

export type ChapterId = 1 | 2 | 3 | 4 | 5;

export interface ChapterMeta {
  id: ChapterId;
  title: string;
  subtitle: string;
  questionsCount: number;       // Ch5 = 0(纯表单)
  estimatedMinutes: number;
  frameworks: ("mbti" | "holland" | "values" | "form")[];
}

export interface ChapterFeedbackRecord {
  text: string;
  source: "llm" | "fallback";
  receivedAt: number;
}

export interface ChapterProgress {
  currentChapter: ChapterId;
  currentQuestionIndex: number;
  feedbacks: Partial<Record<ChapterId, ChapterFeedbackRecord>>;
}

export interface ChapterFeedback {
  chapterId: ChapterId;
  text: string;
  source: "llm" | "fallback";
}

// ─── 用户画像 ──────────────────────────────────────────────────────

export interface BasicInfo {
  name: string;
  age: number;
  gender?: "男" | "女" | "其他";
}

export type EducationLevel =
  | "高中在读" | "高中毕业"
  | "大学在读" | "大学毕业"
  | "硕士在读" | "硕士毕业"
  | "博士在读" | "博士毕业";

export type CareerStage =
  | "在校探索" | "应届求职" | "在职稳定"
  | "考虑转型" | "主动创业" | "自由职业"
  | "待业" | "退休返聘";

export type TargetLocation =
  | "一线（北上广深）" | "新一线（杭州/成都/武汉等）"
  | "二线" | "三四线" | "海外" | "远程" | "不限";

export interface Context {
  educationLevel?: EducationLevel;
  school?: string;
  major?: string;
  graduationYear?: number;
  workYears?: number;
  currentIndustry?: string;
  currentRole?: string;
  careerStage?: CareerStage;
  targetLocation?: TargetLocation;
  incomeFloor?: number;
  incomeTarget?: number;
  constraints?: string;
}

// 量表答题
export type QuizAnswers = Record<string, number>;

/**
 * 章 5 自由文本反思题(stoneyang 拍板:3 题全保留,每题字数下限 50)
 */
export interface Dimensions {
  passion: string;     // 择己所爱(兴趣与热情)
  strength: string;    // 择己所长(技能与优势)
  value: string;       // 择己所利(个人与财务目标)
}

// 完整用户输入(前端 localStorage + 后端 stream API 共用)
// v3 区别:无 sessionId(MVP 无服务端持久化);completed 数组仍保留兼容
export interface AssessmentProfile {
  createdAt: number;
  updatedAt: number;
  basic?: BasicInfo;
  context?: Context;
  mbtiAnswers?: QuizAnswers;
  hollandAnswers?: QuizAnswers;
  valuesAnswers?: QuizAnswers;
  dimensions?: Dimensions;
  completed: ModuleId[];
  chapterProgress?: ChapterProgress;
}

// ─── 题目类型 ──────────────────────────────────────────────────────

export type LikertScale = 1 | 2 | 3 | 4 | 5;

export interface QuizQuestion {
  id: string;
  text: string;
  meta: Record<string, string>;
  chapter?: ChapterId;
  order?: number;
  framework?: "mbti" | "holland" | "values";
}

export interface ModuleMeta {
  id: ModuleId;
  title: string;
  subtitle: string;
  questionsCount: number;
  estimatedMinutes: number;
  route: string;
  order: number;
}

// ─── 行业事实库类型(v3.1 新增 · 严谨性规范) ─────────────────────

/**
 * 单条行业事实条目。与 src/data/industry_facts.json 字段一一对应。
 *
 * 设计哲学:
 *   1. 这是产品里**唯一允许被引用的行业数据来源**,LLM 不得自行生成。
 *   2. 字段不可省略 — 维护者要核实并填全才能入库。
 *   3. applies_to=macro_direction 表示宏观方向,严禁用来论证个人具体细分市场需求。
 */
export interface Fact {
  /** 唯一 id,用于报告里引用与 fact_checker 反查 */
  id: string;
  /** 事实声明本身(必须保留原始口径,不要"软化") */
  claim: string;
  /** 一手出处全名(报告标题 + 机构) */
  source: string;
  /** 原始报告发布日期 ISO 8601 */
  published: string;
  /** 原始报告链接(必须能追到一手 PDF/页面) */
  source_url: string;
  /** 调研方法学摘要 */
  methodology: string;
  /** 原始口径与适用范围(防"放大") */
  original_scope: string;
  /** 是宏观方向还是具体市场 */
  applies_to: "macro_direction" | "specific_market";
  /** 核实置信度 */
  confidence: "high" | "medium" | "low";
  /** 本地核实日期 */
  verified_at: string;
  /** 失效日期,到期自动剔除并告警复核 */
  expires_at: string;
  /** 使用禁区(高风险数据必填) */
  usage_note: string;
}

export interface FactsLibrary {
  _meta: {
    说明: string;
    维护责任: string;
    复核机制: string;
    last_reviewed: string;
  };
  facts: Fact[];
}

/** 报告中对某条 fact 的引用 */
export interface FactReference {
  factId: string;
  citedAs: string;
}

// ─── 报告 streaming 契约 (v3 新增) ─────────────────────────────────

/**
 * Pages Function /api/generate 的 SSE 事件
 */
export type ReportStreamEvent =
  | { event: "meta"; model: string; scores: { hollandCode: string; mbtiType: string; valuesTop3: string[] } }
  | { event: "token"; text: string }
  | { event: "done"; totalTokens: number; durationMs: number }
  | { event: "error"; reason: string; fallback?: string };
