// ============================================================
// Career Compass v3 · Likert 5 选项题目组件
//
// 用于 Holland(章 2/3)和 Values(章 4)
// MVP 简化版:不分页、单页滚动答题、答完自动写 localStorage
// ============================================================

import { useEffect, useState } from "react";
import { store } from "../lib/store";
import type { ChapterId, QuizQuestion, QuizAnswers } from "../lib/types";

interface Props {
  questions: QuizQuestion[];
  chapterId: ChapterId;
  framework: "mbti" | "holland" | "values";
}

const LIKERT_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "完全不同意" },
  { value: 2, label: "较不同意" },
  { value: 3, label: "中立" },
  { value: 4, label: "较同意" },
  { value: 5, label: "非常同意" }
];

const FIELD_KEY_MAP: Record<Props["framework"], "mbtiAnswers" | "hollandAnswers" | "valuesAnswers"> = {
  mbti: "mbtiAnswers",
  holland: "hollandAnswers",
  values: "valuesAnswers"
};

export default function QuestionLikert({ questions, chapterId, framework }: Props) {
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [hydrated, setHydrated] = useState(false);

  const fieldKey = FIELD_KEY_MAP[framework];

  // hydrate from localStorage on mount
  useEffect(() => {
    const profile = store.load();
    if (profile) {
      const existing = profile[fieldKey] ?? {};
      // 只取当前章节的题目答案
      const chapterAnswers: QuizAnswers = {};
      for (const q of questions) {
        if (existing[q.id] != null) chapterAnswers[q.id] = existing[q.id];
      }
      setAnswers(chapterAnswers);
    }
    setHydrated(true);
  }, [framework, questions, fieldKey]);

  function handleSelect(questionId: string, value: number) {
    const next = { ...answers, [questionId]: value };
    setAnswers(next);

    // 合并保存到 localStorage(merge,不覆盖其它章节答案)
    const profile = store.load() ?? store.getOrCreate();
    const existing = profile[fieldKey] ?? {};
    profile[fieldKey] = { ...existing, [questionId]: value };
    store.save(profile);
  }

  const answered = Object.keys(answers).filter((k) => questions.some((q) => q.id === k)).length;
  const total = questions.length;
  const allDone = answered === total;

  if (!hydrated) {
    return (
      <div className="text-sm py-8" style={{ color: "var(--color-text-muted)" }}>
        正在加载题目...
      </div>
    );
  }

  return (
    <div className="space-y-4" data-chapter={chapterId} data-framework={framework}>
      {/* 章内进度提示 */}
      <div
        className="text-sm py-2 px-3 rounded-md inline-flex items-center gap-2"
        style={{
          background: allDone ? "var(--color-brand-light)" : "var(--color-surface-warm)",
          color: allDone ? "var(--color-brand)" : "var(--color-text-muted)"
        }}
      >
        本章已答 {answered} / {total} {allDone && "  ✓"}
      </div>

      {/* 题目列表 */}
      {questions.map((q, idx) => {
        const selected = answers[q.id];
        return (
          <div
            key={q.id}
            className="rounded-lg p-5 transition"
            style={{
              background: "var(--color-surface)",
              boxShadow: "var(--shadow-sm)",
              border: `1px solid ${selected ? "var(--color-brand-light)" : "var(--color-border-light)"}`
            }}
          >
            <p
              className="text-base font-medium mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              <span style={{ color: "var(--color-text-muted)", marginRight: "0.5rem" }}>
                {idx + 1}.
              </span>
              {q.text}
            </p>

            {/* Likert 5 选项 */}
            <div className="grid grid-cols-5 gap-2">
              {LIKERT_OPTIONS.map((opt) => {
                const isSelected = selected === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(q.id, opt.value)}
                    className="rounded-md transition py-2.5 px-1 text-xs flex flex-col items-center gap-1 cursor-pointer"
                    style={{
                      background: isSelected ? "var(--color-brand)" : "var(--color-surface-warm)",
                      color: isSelected ? "white" : "var(--color-text-secondary)",
                      border: `1.5px solid ${isSelected ? "var(--color-brand)" : "transparent"}`
                    }}
                    aria-pressed={isSelected}
                    aria-label={`${q.text} - ${opt.label}`}
                  >
                    <span className="font-semibold">{opt.value}</span>
                    <span className="leading-tight text-center" style={{ fontSize: "0.7rem" }}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
