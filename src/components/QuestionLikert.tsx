// ============================================================
// Career Compass v3.1 · 7 圆点 gradient Likert(16personalities 风)
//
// 视觉:Agree 绿大 → 中间灰小 → Disagree 紫大,选中实心填色 + ✓
// 计分映射:7 选项映射为 1-5 分(中性=3,两侧加权),scoring.ts 不变。
//
// 与 v3.0 的 5 选项方块版差异:
//   - 视觉传达"连续 gradient",不是离散数字
//   - 沿用同一份 store / 同一份 scoring,不动 lib 层
// ============================================================

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { store } from "../lib/store";
import type { ChapterId, QuizQuestion, QuizAnswers } from "../lib/types";

interface Props {
  questions: QuizQuestion[];
  chapterId: ChapterId;
  framework: "mbti" | "holland" | "values";
}

const FIELD_KEY_MAP: Record<Props["framework"], "mbtiAnswers" | "hollandAnswers" | "valuesAnswers"> = {
  mbti: "mbtiAnswers",
  holland: "hollandAnswers",
  values: "valuesAnswers"
};

// 7 圆点:索引 0-6,映射到 scoring.ts 用的 1-5 分(0→1, 1→1, 2→2, 3→3, 4→4, 5→5, 6→5)
// 也就是两端各 2 个圆点都映射为强同意/强不同意。这是 16p 的设计。
const DOT_TO_SCORE: number[] = [1, 1, 2, 3, 4, 5, 5];

// 7 圆点视觉规格:size(直径)+ color(填充色)
const DOT_VISUAL: { size: number; color: string }[] = [
  { size: 44, color: "var(--color-agree-strong)" },
  { size: 36, color: "var(--color-agree-mid)" },
  { size: 28, color: "var(--color-agree-soft)" },
  { size: 22, color: "var(--color-likert-neutral)" },
  { size: 28, color: "var(--color-disagree-soft)" },
  { size: 36, color: "var(--color-disagree-mid)" },
  { size: 44, color: "var(--color-disagree-strong)" }
];

export default function QuestionLikert({ questions, chapterId, framework }: Props) {
  const [answers, setAnswers] = useState<QuizAnswers>({});
  // 单独存"用户实际点的 7 圆点索引"用于 UI 渲染选中态(scoring 拿的是 1-5 分,但 UI 要还原成 0-6 索引)
  const [dotIndex, setDotIndex] = useState<Record<string, number>>({});
  const [hydrated, setHydrated] = useState(false);

  const fieldKey = FIELD_KEY_MAP[framework];

  useEffect(() => {
    const profile = store.load();
    if (profile) {
      const existing = profile[fieldKey] ?? {};
      const chapterAnswers: QuizAnswers = {};
      const restoredDots: Record<string, number> = {};
      for (const q of questions) {
        const score = existing[q.id];
        if (score != null) {
          chapterAnswers[q.id] = score;
          // 反推 7 圆点索引(取 DOT_TO_SCORE 第一个 match,即 score=1→0、2→2、3→3、4→4、5→5)
          const idx = DOT_TO_SCORE.indexOf(score);
          if (idx >= 0) restoredDots[q.id] = idx;
        }
      }
      setAnswers(chapterAnswers);
      setDotIndex(restoredDots);
    }
    setHydrated(true);
  }, [framework, questions, fieldKey]);

  function handleSelect(questionId: string, idx: number) {
    const score = DOT_TO_SCORE[idx];
    const next = { ...answers, [questionId]: score };
    setAnswers(next);
    setDotIndex({ ...dotIndex, [questionId]: idx });

    const profile = store.load() ?? store.getOrCreate();
    const existing = profile[fieldKey] ?? {};
    profile[fieldKey] = { ...existing, [questionId]: score };
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
    <div className="space-y-6" data-chapter={chapterId} data-framework={framework}>
      {/* 章内进度提示 */}
      <div
        className="text-sm py-2 px-3 rounded-md inline-flex items-center gap-2"
        style={{
          background: allDone ? "var(--color-brand-light)" : "var(--color-surface-warm)",
          color: allDone ? "var(--color-brand)" : "var(--color-text-muted)"
        }}
      >
        本章已答 {answered} / {total} {allDone && "✓"}
      </div>

      {/* 题目列表 */}
      {questions.map((q, qIdx) => {
        const currentDot = dotIndex[q.id];
        return (
          <div
            key={q.id}
            className="rounded-xl py-6 px-2 md:px-4 transition"
            style={{
              background: "var(--color-surface)",
              boxShadow: currentDot != null ? "var(--shadow-md)" : "var(--shadow-sm)",
              border: `1px solid ${currentDot != null ? "var(--color-brand-light)" : "var(--color-border-light)"}`
            }}
          >
            <p
              className="text-base md:text-lg font-medium mb-5 text-center px-4"
              style={{ color: "var(--color-text-primary)", lineHeight: 1.5 }}
            >
              <span style={{ color: "var(--color-text-muted)", marginRight: "0.5rem", fontSize: "0.85em" }}>
                {qIdx + 1}.
              </span>
              {q.text}
            </p>

            {/* 7 圆点 gradient */}
            <div
              className="flex items-center justify-center gap-2 md:gap-4 select-none"
              role="radiogroup"
              aria-label={q.text}
            >
              <span
                className="text-sm font-medium hidden sm:inline"
                style={{ color: "var(--color-agree-strong)", minWidth: "60px", textAlign: "right" }}
              >
                同意
              </span>

              {DOT_VISUAL.map((v, idx) => {
                const isSelected = currentDot === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelect(q.id, idx)}
                    className="rounded-full transition-all cursor-pointer flex items-center justify-center"
                    style={{
                      width: `${v.size}px`,
                      height: `${v.size}px`,
                      background: isSelected ? v.color : "transparent",
                      border: `2px solid ${v.color}`,
                      transform: isSelected ? "scale(1.08)" : "scale(1)",
                      boxShadow: isSelected ? `0 4px 12px ${v.color}66` : "none",
                      flexShrink: 0
                    }}
                    aria-checked={isSelected}
                    role="radio"
                    aria-label={`选项 ${idx + 1}`}
                  >
                    {isSelected && <Check size={Math.max(12, v.size * 0.4)} color="white" strokeWidth={3} />}
                  </button>
                );
              })}

              <span
                className="text-sm font-medium hidden sm:inline"
                style={{ color: "var(--color-disagree-strong)", minWidth: "60px", textAlign: "left" }}
              >
                不同意
              </span>
            </div>

            {/* 移动端窄屏底部 Agree/Disagree 标签 */}
            <div className="flex justify-between mt-3 px-2 sm:hidden">
              <span className="text-xs font-medium" style={{ color: "var(--color-agree-strong)" }}>
                同意
              </span>
              <span className="text-xs font-medium" style={{ color: "var(--color-disagree-strong)" }}>
                不同意
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
