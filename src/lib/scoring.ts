// ============================================================
// 计分逻辑 · MBTI / 霍兰德 / 舒伯
// 前后端共用：QuizShell.tsx 用前端预览版，prompt.ts 调后端复用同一份
// ============================================================

import type { QuizAnswers, QuizQuestion } from "./types";

// ─── MBTI ────────────────────────────────────────────────────

const MBTI_OPPOSITE: Record<string, string> = {
  E: "I", I: "E", S: "N", N: "S", T: "F", F: "T", J: "P", P: "J"
};

export interface MBTIResult {
  type: string; // "INTP" 等
  scores: { E: number; I: number; S: number; N: number; T: number; F: number; J: number; P: number };
}

export function computeMBTI(answers: QuizAnswers, qs: QuizQuestion[]): MBTIResult {
  const scores: MBTIResult["scores"] = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  for (const q of qs) {
    const score = answers[q.id];
    if (!score) continue;
    const side = q.meta.side as keyof MBTIResult["scores"];
    const opp = MBTI_OPPOSITE[side] as keyof MBTIResult["scores"];
    if (score >= 4) scores[side] += score - 3; // 4→1, 5→2
    else if (score <= 2) scores[opp] += 3 - score; // 1→2, 2→1
  }
  const type =
    (scores.E >= scores.I ? "E" : "I") +
    (scores.S >= scores.N ? "S" : "N") +
    (scores.T >= scores.F ? "T" : "F") +
    (scores.J >= scores.P ? "J" : "P");
  return { type, scores };
}

// ─── Holland ────────────────────────────────────────────────

export interface HollandResult {
  code: string; // "ASI"
  scores: { R: number; I: number; A: number; S: number; E: number; C: number };
}

const HOLLAND_NAMES: Record<string, string> = {
  R: "实际型", I: "研究型", A: "艺术型", S: "社会型", E: "企业型", C: "常规型"
};

export function computeHolland(answers: QuizAnswers, qs: QuizQuestion[]): HollandResult {
  const scores: HollandResult["scores"] = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  for (const q of qs) {
    const s = answers[q.id];
    if (!s) continue;
    scores[q.meta.type as keyof HollandResult["scores"]] += s;
  }
  const code = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k)
    .join("");
  return { code, scores };
}

export function hollandTypeName(code: string): string {
  return HOLLAND_NAMES[code] ?? code;
}

// ─── Super Values ────────────────────────────────────────────

export interface ValuesResult {
  top3: string[];
  bottom3: string[];
  scores: { dim: string; score: number }[];
}

export function computeValues(answers: QuizAnswers, qs: QuizQuestion[]): ValuesResult {
  const map: Record<string, number> = {};
  for (const q of qs) {
    const s = answers[q.id];
    if (!s) continue;
    map[q.meta.dim] = (map[q.meta.dim] ?? 0) + s;
  }
  const sorted = Object.entries(map)
    .map(([dim, score]) => ({ dim, score }))
    .sort((a, b) => b.score - a.score);
  return {
    scores: sorted,
    top3: sorted.slice(0, 3).map((x) => x.dim),
    bottom3: sorted.slice(-3).reverse().map((x) => x.dim)
  };
}

// ─── 综合 profile（喂给 prompt） ───────────────────────────────

export interface ComputedProfile {
  mbti: MBTIResult;
  holland: HollandResult;
  values: ValuesResult;
}

export function computeAllScores(
  mbtiAnswers: QuizAnswers,
  mbtiQs: QuizQuestion[],
  hollandAnswers: QuizAnswers,
  hollandQs: QuizQuestion[],
  valuesAnswers: QuizAnswers,
  valuesQs: QuizQuestion[]
): ComputedProfile {
  return {
    mbti: computeMBTI(mbtiAnswers, mbtiQs),
    holland: computeHolland(hollandAnswers, hollandQs),
    values: computeValues(valuesAnswers, valuesQs)
  };
}
