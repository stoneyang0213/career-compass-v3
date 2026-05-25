-- Career Compass v3 · 初始 schema
-- 一张大表,内测期足够,后续高并发可拆 profiles/reports。

CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,

  -- 知情同意 + 可选联系
  email TEXT,
  consent INTEGER NOT NULL,           -- 0 / 1,必为 1 才能 INSERT

  -- 用户基本信息
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT,
  identity_role TEXT,                  -- student / professional

  -- 情境(整体 JSON 化省字段)
  context_json TEXT,

  -- 测评 answers(原始 Likert)
  mbti_answers_json TEXT,
  holland_answers_json TEXT,
  values_answers_json TEXT,

  -- 计算结果
  mbti_type TEXT,
  holland_code TEXT,
  values_top3_json TEXT,
  values_bottom3_json TEXT,

  -- dimensions 三段自述
  dim_passion TEXT,
  dim_strength TEXT,
  dim_value TEXT,

  -- 报告
  report_text TEXT,
  report_model TEXT,
  report_chars INTEGER,
  report_duration_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_assessments_created ON assessments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_email ON assessments(email);
CREATE INDEX IF NOT EXISTS idx_assessments_identity ON assessments(identity_role);
