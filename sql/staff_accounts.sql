-- 關懷站專員帳號表（Google 登入用）
CREATE TABLE IF NOT EXISTS staff_accounts (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  org_id        INT  NOT NULL REFERENCES organizations(id),
  google_email  TEXT UNIQUE NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE staff_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read"   ON staff_accounts FOR SELECT USING (true);
CREATE POLICY "anon_insert" ON staff_accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update" ON staff_accounts FOR UPDATE USING (true);
CREATE POLICY "anon_delete" ON staff_accounts FOR DELETE USING (true);
