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

// ─── 报告 streaming 契约 (v3 新增) ─────────────────────────────────

/**
 * Pages Function /api/generate 的 SSE 事件
 */
export type ReportStreamEvent =
  | { event: "meta"; model: string; scores: { hollandCode: string; mbtiType: string; valuesTop3: string[] } }
  | { event: "token"; text: string }
  | { event: "done"; totalTokens: number; durationMs: number }
  | { event: "error"; reason: string; fallback?: string };
