-- ============================================================
-- 同意書欄位 + FHIR 識別碼
-- 在 Supabase SQL Editor 執行
-- ============================================================

-- 1. members 表加同意書欄位
ALTER TABLE members ADD COLUMN IF NOT EXISTS consent_signed     BOOLEAN   DEFAULT FALSE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS consent_signed_at  TIMESTAMPTZ;

-- 2. health_records 確認欄位存在（若尚未建立）
ALTER TABLE health_records ADD COLUMN IF NOT EXISTS pulse   INT;
ALTER TABLE health_records ADD COLUMN IF NOT EXISTS weight  NUMERIC(5,1);

-- 3. 確認現有長者同意書狀態預設為 false
UPDATE members SET consent_signed = FALSE WHERE consent_signed IS NULL;
