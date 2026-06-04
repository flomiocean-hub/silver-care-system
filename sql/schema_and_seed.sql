-- ============================================================
-- 銀髮關懷據點智慧管理系統 — Supabase Schema & Seed Data
-- 請在 Supabase Dashboard → SQL Editor → 貼上此內容 → Run
-- ============================================================

-- 建立資料表

CREATE TABLE IF NOT EXISTS members (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  birthday         DATE,
  gender           TEXT CHECK (gender IN ('男', '女')),
  mobile           TEXT DEFAULT '',
  home_phone       TEXT DEFAULT '',
  address          TEXT DEFAULT '',
  emergency_contact TEXT DEFAULT '',
  member_type      TEXT DEFAULT '出席型',
  tags             TEXT[] DEFAULT '{}',
  notes            TEXT DEFAULT '',
  join_date        DATE DEFAULT CURRENT_DATE,
  last_seen        DATE,
  risk_score       INTEGER DEFAULT 0,
  status           TEXT DEFAULT '活躍',
  weight_baseline  NUMERIC(5,1),
  height_cm        NUMERIC(5,1),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS health_records (
  id         SERIAL PRIMARY KEY,
  member_id  TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  systolic   INTEGER,
  diastolic  INTEGER,
  pulse      INTEGER,
  weight     NUMERIC(5,1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checkins (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  member_id    TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  name         TEXT,
  checkin_date DATE DEFAULT CURRENT_DATE,
  checkin_time TEXT,
  systolic     INTEGER,
  diastolic    INTEGER,
  pulse        INTEGER,
  weight       NUMERIC(5,1),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  session          TEXT DEFAULT 'A',
  instructor       TEXT DEFAULT '',
  description      TEXT DEFAULT '',
  expected_outcome TEXT DEFAULT '',
  day              TEXT DEFAULT '',
  time             TEXT DEFAULT '',
  start_date       DATE,
  capacity         INTEGER DEFAULT 25,
  enrolled         INTEGER DEFAULT 0,
  waitlist         INTEGER DEFAULT 0,
  total_fee        INTEGER DEFAULT 0,
  total_sessions   INTEGER DEFAULT 4,
  materials_fee    INTEGER DEFAULT 0,
  materials_spent  INTEGER DEFAULT 0,
  status           TEXT DEFAULT 'active',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enrollments (
  id                 TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  member_id          TEXT,
  member_name        TEXT NOT NULL,
  course_id          TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  sessions_remaining INTEGER DEFAULT 0,
  total_paid         INTEGER DEFAULT 0,
  total_fee          INTEGER DEFAULT 0,
  is_waitlist        BOOLEAN DEFAULT FALSE,
  waitlist_no        INTEGER,
  enrolled_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_records (
  id          TEXT PRIMARY KEY,
  member_id   TEXT REFERENCES members(id) ON DELETE CASCADE,
  member_name TEXT,
  type        TEXT CHECK (type IN ('lunch', 'course')),
  course_name TEXT,
  month       TEXT,
  amount_due  INTEGER DEFAULT 0,
  amount_paid INTEGER DEFAULT 0,
  date        DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_summary (
  date           DATE PRIMARY KEY,
  actual_count   INTEGER DEFAULT 0,
  expected_count INTEGER DEFAULT 0
);

-- 關閉 RLS（內部管理工具）
ALTER TABLE members          DISABLE ROW LEVEL SECURITY;
ALTER TABLE health_records   DISABLE ROW LEVEL SECURITY;
ALTER TABLE checkins         DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses          DISABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments      DISABLE ROW LEVEL SECURITY;
ALTER TABLE finance_records  DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_summary DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 初始資料（Seed Data）
-- ============================================================

INSERT INTO members (id,name,birthday,gender,mobile,home_phone,address,emergency_contact,member_type,tags,notes,join_date,last_seen,risk_score,status,weight_baseline,height_cm) VALUES
('SC-001','陳美華','1942-03-15','女','0912-345-678','02-2345-6789','台北市中正區忠孝路1號','陳志明 0912-999-001','出席型',ARRAY['獨居','高風險'],'高血壓病史','2023-01-10','2025-04-18',72,'活躍',53.0,152.0),
('SC-002','林德正','1938-07-22','男','0923-456-789','','台北市大安區仁愛路2段5號','林小玲 0923-999-002','出席型',ARRAY[]::TEXT[],'','2023-02-15','2025-05-02',15,'活躍',69.0,163.0),
('SC-003','王淑芬','1945-11-08','女','0934-567-890','02-3456-7890','台北市信義區松仁路10號','王大明 0934-999-003','出席型',ARRAY['獨居'],'輕度失智觀察中','2023-03-20','2025-04-30',45,'活躍',55.5,153.0),
('SC-004','黃文雄','1940-05-30','男','0945-678-901','','台北市松山區南京東路3段20號','黃美珠 0945-999-004','出席型',ARRAY[]::TEXT[],'','2023-01-25','2025-05-03',20,'活躍',72.5,162.0),
('SC-005','張桂英','1947-09-12','女','0956-789-012','02-5678-9012','台北市士林區中正路50號','張小華 0956-999-005','出席型',ARRAY['獨居','高風險','電訪追蹤'],'連續缺席超過14天','2023-04-05','2025-04-10',85,'高風險',48.0,150.0),
('SC-006','李榮發','1935-12-03','男','0967-890-123','02-6789-0123','台北市北投區中央北路1段8號','李美玉 0967-999-006','出席型',ARRAY[]::TEXT[],'糖尿病','2022-11-15','2025-05-01',30,'活躍',65.0,160.0),
('SC-007','吳秀蘭','1943-06-18','女','0978-901-234','','台北市文山區木柵路2段15號','吳建志 0978-999-007','出席型',ARRAY['獨居','高風險'],'血壓不穩定','2023-05-10','2025-04-25',60,'注意',58.5,155.0),
('SC-008','劉進財','1939-02-28','男','0989-012-345','','台北市內湖區成功路4段30號','劉淑華 0989-999-008','出席型',ARRAY[]::TEXT[],'','2022-12-01','2025-05-02',10,'活躍',71.0,165.0),
('SC-009','許阿珠','1950-04-20','女','0911-111-222','02-1111-2222','台北市萬華區西園路1段60號','許建國 0911-999-009','探訪型',ARRAY['探訪','獨居'],'行動不便，需定期外訪','2024-01-05','2025-04-01',55,'注意',50.0,151.0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO health_records (member_id,date,systolic,diastolic,pulse,weight) VALUES
('SC-001','2025-04-01',138,88,78,52.3),
('SC-001','2025-04-08',145,92,82,51.8),
('SC-001','2025-04-15',152,95,85,51.5),
('SC-001','2025-04-22',148,90,80,51.9),
('SC-003','2025-04-01',128,82,72,55.0),
('SC-003','2025-04-15',135,85,74,54.5),
('SC-003','2025-04-29',142,88,76,54.2),
('SC-007','2025-04-01',155,98,90,58.0),
('SC-007','2025-04-08',132,84,75,57.8),
('SC-007','2025-04-15',158,100,92,57.5),
('SC-007','2025-04-22',130,82,72,57.9),
('SC-007','2025-04-25',162,102,95,47.6),
('SC-002','2025-04-01',125,80,68,68.5),
('SC-002','2025-04-15',128,82,70,68.2),
('SC-002','2025-05-02',122,78,66,68.5);

INSERT INTO checkins (id,member_id,name,checkin_date,checkin_time,systolic,diastolic,pulse,weight) VALUES
('A001','SC-002','林德正',CURRENT_DATE,'08:32',125,80,68,68.5),
('A002','SC-004','黃文雄',CURRENT_DATE,'08:45',132,84,72,72.1),
('A003','SC-006','李榮發',CURRENT_DATE,'09:01',118,75,65,65.3),
('A004','SC-008','劉進財',CURRENT_DATE,'09:15',128,82,70,70.8)
ON CONFLICT (id) DO NOTHING;

INSERT INTO courses (id,name,session,instructor,description,expected_outcome,day,time,start_date,capacity,enrolled,waitlist,total_fee,total_sessions,materials_fee,materials_spent,status) VALUES
('C001','養生太極拳','A','王德發老師','透過緩慢有氧的太極動作改善平衡感與關節靈活度，適合各年齡層長者。','每週規律練習，預計8週後可改善下肢肌力與跌倒風險降低30%。','週二','09:00','2025-05-06',25,23,2,200,4,0,0,'active'),
('C002','養生太極拳','B','王德發老師','透過緩慢有氧的太極動作改善平衡感與關節靈活度，適合各年齡層長者。','每週規律練習，預計8週後可改善下肢肌力與跌倒風險降低30%。','週四','14:00','2025-05-08',25,15,0,200,4,0,0,'active'),
('C003','手工藝DIY','A','林美惠老師','結合認知訓練與手部精細動作訓練的創意手工課，每期製作不同主題作品。','促進手腦協調，提升社交互動，預防認知退化。','週一','10:00','2025-05-05',15,15,3,150,4,200,120,'active'),
('C004','健康烹飪課','A','陳淑華老師','學習低鈉低糖的長者友善料理，兼顧美味與健康管理。','建立健康飲食習慣，有效控制慢性病（三高）指數。','週三','10:30','2025-05-07',12,8,0,300,6,500,200,'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO enrollments (id,member_id,member_name,course_id,sessions_remaining,total_paid,total_fee,is_waitlist,waitlist_no) VALUES
('E001','SC-001','陳美華','C001',2,100,200,false,null),
('E002','SC-002','林德正','C001',3,200,200,false,null),
('E003','SC-003','王淑芬','C001',4,0,200,false,null),
('E004','SC-004','黃文雄','C003',1,150,150,false,null),
('E005','SC-006','李榮發','C004',5,150,300,false,null),
('E006','SC-007','吳秀蘭','C001',4,0,200,true,1),
('E007','SC-008','劉進財','C001',4,0,200,true,2),
('E008','SC-003','王淑芬','C003',4,0,150,true,1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO finance_records (id,member_id,member_name,type,course_name,month,amount_due,amount_paid,date) VALUES
('F001','SC-001','陳美華','lunch',null,'2025-05',30,30,'2025-05-01'),
('F002','SC-002','林德正','course','養生太極拳A','2025-05',200,200,'2025-05-01'),
('F003','SC-003','王淑芬','course','養生太極拳A','2025-05',200,0,null),
('F004','SC-004','黃文雄','lunch',null,'2025-05',30,30,'2025-05-02'),
('F005','SC-005','張桂英','course','手工藝DIYA','2025-05',150,0,null),
('F006','SC-006','李榮發','course','健康烹飪課A','2025-05',300,150,'2025-05-02'),
('F007','SC-007','吳秀蘭','lunch',null,'2025-05',30,0,null),
('F008','SC-008','劉進財','lunch',null,'2025-05',30,30,'2025-05-01'),
('F009','SC-001','陳美華','course','養生太極拳A','2025-05',200,100,'2025-05-01')
ON CONFLICT (id) DO NOTHING;

INSERT INTO attendance_summary (date,actual_count,expected_count) VALUES
('2025-04-26',38,45),('2025-04-27',35,45),('2025-04-28',41,45),
('2025-04-29',39,45),('2025-04-30',35,45),
('2025-05-01',44,45),('2025-05-02',42,45)
ON CONFLICT (date) DO NOTHING;

-- Migration: 新增身高欄位（現有資料庫執行此段即可）
ALTER TABLE members ADD COLUMN IF NOT EXISTS height_cm NUMERIC(5,1);
