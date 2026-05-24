// ============================================================
// 章节微反馈 prompt 模板 · change 1 (2026-05-12)
// 80-120 字 / 三段式 / 无感叹号 emoji 夸奖词
// 复用 scoring.ts 计算章节摘要,喂给 LLM 生成微反馈
// ============================================================

import { computeMBTI, computeHolland, computeValues } from "./scoring";
import { getChapterQuestions } from "./chapters";
import type { ChapterId, QuizAnswers } from "./types";

interface ChapterSummary {
  chapterId: ChapterId;
  // 章节相关的计分结果(选择性出现)
  mbtiType?: string;
  mbtiScores?: Record<string, number>;
  hollandTopTypes?: { type: string; name: string; score: number }[];
  valuesTop3?: { dim: string; score: number }[];
}

const SYSTEM_PROMPT = `你是一个职业测评中的过场解说者,任务是在用户完成一章测评后,给一段 80-120 字的中文反馈。

硬约束:
- 总字数 80-120 个中文字符(不含标点);超出范围视为失败
- 三段结构(各段约 30 字):
  第一段「具体观察」:基于用户答题的某个具体倾向,引用具体维度名或得分
  第二段「稀缺对比」:这种倾向在哪些场景下罕见或有价值
  第三段「下章钩子」:接下来这章会问什么,为什么对 ta 重要
- 不用感叹号
- 不用 emoji
- 不用「很棒」「非常」「了不起」「厉害」「太好了」等夸奖词
- 不用「建议」「应该」「可以」「需要」等指令性词
- 不重复用户答题的原文
- 输出纯文本,无标题、无分段符、无 markdown
- 不要任何引言("以下是...""根据你的答题...")
`;

export function buildInterludePrompt(summary: ChapterSummary): { system: string; user: string } {
  const user = buildUserPrompt(summary);
  return { system: SYSTEM_PROMPT, user };
}

function buildUserPrompt(s: ChapterSummary): string {
  switch (s.chapterId) {
    case 1:
      return [
        `用户刚完成第 1 章「性格倾向」(MBTI),计分结果:`,
        `- 类型:${s.mbtiType ?? "未知"}`,
        `- 各维度倾向得分:${JSON.stringify(s.mbtiScores ?? {})}`,
        ``,
        `接下来第 2 章「兴趣偏好」会问 6 道 Holland 题目,聚焦动手 / 研究 / 艺术三个维度。`,
        ``,
        `请基于他的 MBTI 倾向写一段 80-120 字微反馈,严格按三段式:具体观察(引用类型字母或最强维度)+ 稀缺对比 + 下章钩子(为什么兴趣测评对 ta 重要)。`
      ].join("\n");

    case 2:
      return [
        `用户刚完成第 2 章「兴趣偏好」(Holland 前 3 维 R/I/A),得分排序:`,
        ...(s.hollandTopTypes ?? []).map(t => `- ${t.type}(${t.name}):${t.score}`),
        ``,
        `接下来第 3 章「能力锚点」会问 Holland 后 3 维 S/E/C(服务 / 影响 / 秩序)。`,
        ``,
        `请基于他的兴趣前 3 维表现写一段 80-120 字微反馈,严格三段式:具体观察(最高的那个维度)+ 稀缺对比 + 下章钩子(为什么能力维度对 ta 重要)。`
      ].join("\n");

    case 3:
      return [
        `用户刚完成第 3 章「能力锚点」(Holland 后 3 维 S/E/C),得分排序:`,
        ...(s.hollandTopTypes ?? []).map(t => `- ${t.type}(${t.name}):${t.score}`),
        ``,
        `接下来第 4 章「价值排序」会问 15 道舒伯价值观题目(利他 / 创造 / 自主 / 稳定 / 报酬等)。`,
        ``,
        `请基于他的能力维度表现写一段 80-120 字微反馈,严格三段式:具体观察(最高维度)+ 稀缺对比 + 下章钩子(为什么价值排序对 ta 重要)。`
      ].join("\n");

    case 4:
      return [
        `用户刚完成第 4 章「价值排序」(舒伯 14 维),前 3 优先价值:`,
        ...(s.valuesTop3 ?? []).map(v => `- ${v.dim}:${v.score}`),
        ``,
        `接下来第 5 章「深度反思」会请用户填基本信息 + 三段自述(择己所爱 / 所长 / 所利)。`,
        ``,
        `请基于他的 top 3 价值写一段 80-120 字微反馈,严格三段式:具体观察(前 1-2 个价值的组合)+ 稀缺对比 + 下章钩子(为什么自述部分对 ta 重要)。`
      ].join("\n");

    case 5:
      // Ch5 不调 LLM,这里只是 type 完备
      return "";
  }
}

/**
 * 从 raw answers 算出章节摘要,供前端构造 fetch body 用。
 * 前端先算好喂给 API,而不是让后端再 query D1 — 减少 D1 调用 + 后端 prompt 拼接更简单
 */
export function computeChapterSummary(chapterId: ChapterId, profile: {
  mbtiAnswers?: QuizAnswers;
  hollandAnswers?: QuizAnswers;
  valuesAnswers?: QuizAnswers;
}): ChapterSummary {
  switch (chapterId) {
    case 1: {
      const qs = getChapterQuestions(1);
      const r = computeMBTI(profile.mbtiAnswers ?? {}, qs);
      return { chapterId: 1, mbtiType: r.type, mbtiScores: r.scores };
    }
    case 2:
    case 3: {
      // Ch2/Ch3 都用整个 hollandAnswers 算,但取对应 3 维的 top
      const qs = [...getChapterQuestions(2), ...getChapterQuestions(3)];
      const r = computeHolland(profile.hollandAnswers ?? {}, qs);
      const HOLLAND_NAMES: Record<string, string> = {
        R: "实际型", I: "研究型", A: "艺术型", S: "社会型", E: "企业型", C: "常规型"
      };
      const focusTypes = chapterId === 2 ? ["R","I","A"] : ["S","E","C"];
      const top = focusTypes
        .map(t => ({ type: t, name: HOLLAND_NAMES[t], score: r.scores[t as keyof typeof r.scores] }))
        .sort((a, b) => b.score - a.score);
      return { chapterId, hollandTopTypes: top };
    }
    case 4: {
      const qs = getChapterQuestions(4);
      const r = computeValues(profile.valuesAnswers ?? {}, qs);
      const top3 = r.scores.slice(0, 3).map(t => ({ dim: t.dim, score: t.score }));
      return { chapterId: 4, valuesTop3: top3 };
    }
    case 5:
      return { chapterId: 5 };
  }
}

export type { ChapterSummary };
