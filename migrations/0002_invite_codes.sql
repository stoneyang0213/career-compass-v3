-- Career Compass v3 · 邀请码门槛 + 暴力防御(2026-05-27)
-- 1) 主码表: 4 位数字字符串 PK
-- 2) 批次码 IP 去重表(只对 max_uses>0 的码生效)
-- 3) 暴力防御表: 同 IP 错误尝试统计
-- 4) assessments 表追加 invite_code 列,记录走哪个码进来

CREATE TABLE IF NOT EXISTS invite_codes (
  code TEXT PRIMARY KEY,
  max_uses INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER
);

CREATE TABLE IF NOT EXISTS invite_code_uses (
  code TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  used_at INTEGER NOT NULL,
  PRIMARY KEY (code, ip_hash)
);

CREATE TABLE IF NOT EXISTS code_attempts (
  ip_hash TEXT PRIMARY KEY,
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_failure_at INTEGER NOT NULL,
  blocked_until INTEGER
);

ALTER TABLE assessments ADD COLUMN invite_code TEXT;
