-- 統一使用者帳號資料表（取代 in-memory INITIAL_USERS + staff_accounts）
CREATE TABLE IF NOT EXISTS user_accounts (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT '關懷站專員', -- 管理者 | 關懷站專員
  org_id       INT REFERENCES organizations(id),   -- NULL = 超級管理者（不存此表）
  username     TEXT UNIQUE,                        -- 管理者帳號密碼登入用
  password     TEXT,                               -- 管理者密碼（demo 明文）
  google_email TEXT UNIQUE,                        -- Google 登入用 email
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT must_have_login CHECK (username IS NOT NULL OR google_email IS NOT NULL)
);

-- 從 staff_accounts 遷移現有資料
INSERT INTO user_accounts (name, role, org_id, google_email, created_at)
SELECT name, '關懷站專員', org_id, google_email, created_at
FROM staff_accounts
ON CONFLICT (google_email) DO NOTHING;

-- 建立 demo 管理者帳號
INSERT INTO user_accounts (name, role, org_id, username, password)
VALUES ('系統管理員', '管理者', 1, 'admin', 'admin2025')
ON CONFLICT (username) DO NOTHING;

-- RLS
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read"   ON user_accounts FOR SELECT USING (true);
CREATE POLICY "anon_insert" ON user_accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update" ON user_accounts FOR UPDATE USING (true);
CREATE POLICY "anon_delete" ON user_accounts FOR DELETE USING (true);
