// ============================================================
// Career Compass v3 · 客户端 store · localStorage 实现
//
// 与 v2 的差异:剥除 sessionId(v3 MVP 无服务端持久化,纯本地)。
// 否则结构与 v2 兼容,store.load/save/completeModule/setChapterProgress 等
// 接口语义不变,QuestionLikert / MBTI / Chapter5Form 仍可直接调用。
// ============================================================

import type { AssessmentProfile, ChapterId, ChapterProgress, ModuleId } from "./types";
import { inferChapterFromCompleted } from "./chapters";

const STORAGE_KEY = "career-compass-v3-progress";

function emptyProfile(): AssessmentProfile {
  const now = Date.now();
  return {
    createdAt: now,
    updatedAt: now,
    completed: [],
    chapterProgress: {
      currentChapter: 1,
      currentQuestionIndex: 0,
      feedbacks: {}
    }
  };
}

/**
 * 旧数据兼容:无 chapterProgress 字段时,从 completed[] 推断当前章节。
 */
function migrateLegacy(profile: AssessmentProfile): AssessmentProfile {
  if (profile.chapterProgress) return profile;
  const currentChapter = inferChapterFromCompleted(profile.completed ?? []);
  profile.chapterProgress = {
    currentChapter,
    currentQuestionIndex: 0,
    feedbacks: {}
  };
  return profile;
}

export const store = {
  /** 加载本地 profile;无则 null;有则跑 migrateLegacy 兼容旧数据 */
  load(): AssessmentProfile | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as AssessmentProfile;
      return migrateLegacy(parsed);
    } catch {
      return null;
    }
  },

  /** 保存(覆盖)整份 profile */
  save(profile: AssessmentProfile): void {
    if (typeof window === "undefined") return;
    profile.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  },

  /** 取或新建一份 profile */
  getOrCreate(): AssessmentProfile {
    const existing = this.load();
    if (existing) return existing;
    const fresh = emptyProfile();
    this.save(fresh);
    return fresh;
  },

  /** 标记某模块完成,更新 profile 字段 */
  completeModule<K extends keyof AssessmentProfile>(
    moduleId: ModuleId,
    field: K,
    value: AssessmentProfile[K]
  ): AssessmentProfile {
    const p = this.load() ?? this.getOrCreate();
    (p as any)[field] = value;
    if (!p.completed.includes(moduleId)) p.completed.push(moduleId);
    this.save(p);
    return p;
  },

  /** 章节进度更新(局部合并) */
  setChapterProgress(patch: Partial<ChapterProgress>): AssessmentProfile {
    const p = this.load() ?? this.getOrCreate();
    p.chapterProgress = {
      currentChapter: patch.currentChapter ?? p.chapterProgress?.currentChapter ?? 1,
      currentQuestionIndex: patch.currentQuestionIndex ?? p.chapterProgress?.currentQuestionIndex ?? 0,
      feedbacks: { ...(p.chapterProgress?.feedbacks ?? {}), ...(patch.feedbacks ?? {}) }
    };
    this.save(p);
    return p;
  },

  /** 章节进度读取 */
  getChapterProgress(): ChapterProgress {
    const p = this.load() ?? this.getOrCreate();
    return p.chapterProgress ?? { currentChapter: 1, currentQuestionIndex: 0, feedbacks: {} };
  },

  /** 推进到下一章(章节切换 + 题号清零) */
  advanceToChapter(nextChapter: ChapterId): AssessmentProfile {
    return this.setChapterProgress({
      currentChapter: nextChapter,
      currentQuestionIndex: 0
    });
  },

  /** 清空 */
  clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
  }
};
