// ============================================================
// 章节化测评配置 · change 1 (2026-05-12)
// 5 章映射,基于 career-compass-v2-context.md 第三节
// Ch5 是纯表单(basic + context + dimensions),不走 getChapterQuestions
// ============================================================

import mbti from "../data/questions/mbti.json";
import holland from "../data/questions/holland.json";
import values from "../data/questions/values.json";
import type { ChapterId, ChapterMeta, QuizQuestion } from "./types";

export const CHAPTERS: readonly ChapterMeta[] = [
  { id: 1, title: "性格倾向", subtitle: "你如何与世界互动",     questionsCount: 12, estimatedMinutes: 6, frameworks: ["mbti"] },
  { id: 2, title: "兴趣偏好", subtitle: "什么让你眼睛发亮",     questionsCount: 6,  estimatedMinutes: 4, frameworks: ["holland"] },
  { id: 3, title: "能力锚点", subtitle: "你的优势区在哪里",     questionsCount: 6,  estimatedMinutes: 4, frameworks: ["holland"] },
  { id: 4, title: "价值排序", subtitle: "工作中你最看重什么",   questionsCount: 15, estimatedMinutes: 8, frameworks: ["values"] },
  { id: 5, title: "深度反思", subtitle: "基本信息和长板自述",   questionsCount: 0,  estimatedMinutes: 6, frameworks: ["form"] }
] as const;

const ALL_QUESTIONS: QuizQuestion[] = [
  ...(mbti as QuizQuestion[]),
  ...(holland as QuizQuestion[]),
  ...(values as QuizQuestion[])
];

export function getChapterById(id: ChapterId): ChapterMeta {
  const chapter = CHAPTERS.find(c => c.id === id);
  if (!chapter) throw new Error(`Unknown chapterId: ${id}`);
  return chapter;
}

/**
 * 取某章的所有题目,按 order 排序。
 * Ch5 没有题目(纯表单),调用会返回空数组。
 */
export function getChapterQuestions(chapterId: 1 | 2 | 3 | 4): QuizQuestion[] {
  return ALL_QUESTIONS
    .filter(q => q.chapter === chapterId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/**
 * 把 ModuleId(旧 6 模块概念)推断回章节进度。
 * 用于 store.load() 兼容旧 localStorage 数据。
 */
export function inferChapterFromCompleted(completed: readonly string[]): ChapterId {
  const has = (m: string) => completed.includes(m);
  // 推断逻辑(保守):任一模块未完成,回到该模块对应章节
  // 旧 mbti = Ch1,旧 holland = Ch2+Ch3 共用,旧 values = Ch4,
  // 旧 basic/context/dimensions 都属于 Ch5
  if (!has("mbti")) return 1;
  if (!has("holland")) return 2;
  if (!has("values")) return 4;
  if (!has("basic") || !has("context") || !has("dimensions")) return 5;
  return 5;  // 全完成的旧用户也停在 Ch5(允许去 finish)
}
