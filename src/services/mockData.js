// ── 長者資料 ─────────────────────────────────────────────────────────────────
export const mockMembers = [
  {
    id: 'SC-001', name: '陳美華', birthday: '1942-03-15', gender: '女',
    mobile: '0912-345-678', home_phone: '02-2345-6789', address: '台北市中正區忠孝路1號',
    emergency_contact: '陳志明 0912-999-001',
    tags: ['獨居', '高風險'],
    member_type: '出席型',
    join_date: '2023-01-10', last_seen: '2025-04-18',
    risk_score: 72, status: '活躍',
    weight_baseline: 53.0, notes: '高血壓病史',
  },
  {
    id: 'SC-002', name: '林德正', birthday: '1938-07-22', gender: '男',
    mobile: '0923-456-789', home_phone: '', address: '台北市大安區仁愛路2段5號',
    emergency_contact: '林小玲 0923-999-002',
    tags: [],
    member_type: '出席型',
    join_date: '2023-02-15', last_seen: '2025-05-02',
    risk_score: 15, status: '活躍',
    weight_baseline: 69.0, notes: '',
  },
  {
    id: 'SC-003', name: '王淑芬', birthday: '1945-11-08', gender: '女',
    mobile: '0934-567-890', home_phone: '02-3456-7890', address: '台北市信義區松仁路10號',
    emergency_contact: '王大明 0934-999-003',
    tags: ['獨居'],
    member_type: '出席型',
    join_date: '2023-03-20', last_seen: '2025-04-30',
    risk_score: 45, status: '活躍',
    weight_baseline: 55.5, notes: '輕度失智觀察中',
  },
  {
    id: 'SC-004', name: '黃文雄', birthday: '1940-05-30', gender: '男',
    mobile: '0945-678-901', home_phone: '', address: '台北市松山區南京東路3段20號',
    emergency_contact: '黃美珠 0945-999-004',
    tags: [],
    member_type: '出席型',
    join_date: '2023-01-25', last_seen: '2025-05-03',
    risk_score: 20, status: '活躍',
    weight_baseline: 72.5, notes: '',
  },
  {
    id: 'SC-005', name: '張桂英', birthday: '1947-09-12', gender: '女',
    mobile: '0956-789-012', home_phone: '02-5678-9012', address: '台北市士林區中正路50號',
    emergency_contact: '張小華 0956-999-005',
    tags: ['獨居', '高風險', '電訪追蹤'],
    member_type: '出席型',
    join_date: '2023-04-05', last_seen: '2025-04-10',
    risk_score: 85, status: '高風險',
    weight_baseline: 48.0, notes: '連續缺席超過14天',
  },
  {
    id: 'SC-006', name: '李榮發', birthday: '1935-12-03', gender: '男',
    mobile: '0967-890-123', home_phone: '02-6789-0123', address: '台北市北投區中央北路1段8號',
    emergency_contact: '李美玉 0967-999-006',
    tags: [],
    member_type: '出席型',
    join_date: '2022-11-15', last_seen: '2025-05-01',
    risk_score: 30, status: '活躍',
    weight_baseline: 65.0, notes: '糖尿病',
  },
  {
    id: 'SC-007', name: '吳秀蘭', birthday: '1943-06-18', gender: '女',
    mobile: '0978-901-234', home_phone: '', address: '台北市文山區木柵路2段15號',
    emergency_contact: '吳建志 0978-999-007',
    tags: ['獨居', '高風險'],
    member_type: '出席型',
    join_date: '2023-05-10', last_seen: '2025-04-25',
    risk_score: 60, status: '注意',
    weight_baseline: 58.5, notes: '血壓不穩定',
  },
  {
    id: 'SC-008', name: '劉進財', birthday: '1939-02-28', gender: '男',
    mobile: '0989-012-345', home_phone: '', address: '台北市內湖區成功路4段30號',
    emergency_contact: '劉淑華 0989-999-008',
    tags: [],
    member_type: '出席型',
    join_date: '2022-12-01', last_seen: '2025-05-02',
    risk_score: 10, status: '活躍',
    weight_baseline: 71.0, notes: '',
  },
  {
    id: 'SC-009', name: '許阿珠', birthday: '1950-04-20', gender: '女',
    mobile: '0911-111-222', home_phone: '02-1111-2222', address: '台北市萬華區西園路1段60號',
    emergency_contact: '許建國 0911-999-009',
    tags: ['探訪', '獨居'],
    member_type: '探訪型',
    join_date: '2024-01-05', last_seen: '2025-04-01',
    risk_score: 55, status: '注意',
    weight_baseline: 50.0, notes: '行動不便，需定期外訪',
  },
]

// ── 健康數據（加入脈搏欄位）────────────────────────────────────────────────
export const mockHealthData = [
  { date: '2025-04-01', member_id: 'SC-001', name: '陳美華', gender: '女', systolic: 138, diastolic: 88, pulse: 78, weight: 52.3 },
  { date: '2025-04-08', member_id: 'SC-001', name: '陳美華', gender: '女', systolic: 145, diastolic: 92, pulse: 82, weight: 51.8 },
  { date: '2025-04-15', member_id: 'SC-001', name: '陳美華', gender: '女', systolic: 152, diastolic: 95, pulse: 85, weight: 51.5 },
  { date: '2025-04-22', member_id: 'SC-001', name: '陳美華', gender: '女', systolic: 148, diastolic: 90, pulse: 80, weight: 51.9 },
  { date: '2025-04-01', member_id: 'SC-003', name: '王淑芬', gender: '女', systolic: 128, diastolic: 82, pulse: 72, weight: 55.0 },
  { date: '2025-04-15', member_id: 'SC-003', name: '王淑芬', gender: '女', systolic: 135, diastolic: 85, pulse: 74, weight: 54.5 },
  { date: '2025-04-29', member_id: 'SC-003', name: '王淑芬', gender: '女', systolic: 142, diastolic: 88, pulse: 76, weight: 54.2 },
  { date: '2025-04-01', member_id: 'SC-007', name: '吳秀蘭', gender: '女', systolic: 155, diastolic: 98, pulse: 90, weight: 58.0 },
  { date: '2025-04-08', member_id: 'SC-007', name: '吳秀蘭', gender: '女', systolic: 132, diastolic: 84, pulse: 75, weight: 57.8 },
  { date: '2025-04-15', member_id: 'SC-007', name: '吳秀蘭', gender: '女', systolic: 158, diastolic: 100, pulse: 92, weight: 57.5 },
  { date: '2025-04-22', member_id: 'SC-007', name: '吳秀蘭', gender: '女', systolic: 130, diastolic: 82, pulse: 72, weight: 57.9 },
  { date: '2025-04-25', member_id: 'SC-007', name: '吳秀蘭', gender: '女', systolic: 162, diastolic: 102, pulse: 95, weight: 47.6 },
  { date: '2025-04-01', member_id: 'SC-002', name: '林德正', gender: '男', systolic: 125, diastolic: 80, pulse: 68, weight: 68.5 },
  { date: '2025-04-15', member_id: 'SC-002', name: '林德正', gender: '男', systolic: 128, diastolic: 82, pulse: 70, weight: 68.2 },
  { date: '2025-05-02', member_id: 'SC-002', name: '林德正', gender: '男', systolic: 122, diastolic: 78, pulse: 66, weight: 68.5 },
]

// ── 出席（加入預計人數）─────────────────────────────────────────────────────
export const mockAttendance = [
  { date: '2025-04-26', count: 38, expected: 45, rate: 84 },
  { date: '2025-04-27', count: 35, expected: 45, rate: 78 },
  { date: '2025-04-28', count: 41, expected: 45, rate: 91 },
  { date: '2025-04-29', count: 39, expected: 45, rate: 87 },
  { date: '2025-04-30', count: 35, expected: 45, rate: 78 },
  { date: '2025-05-01', count: 44, expected: 45, rate: 98 },
  { date: '2025-05-02', count: 42, expected: 45, rate: 93 },
]

// ── 課程（加入材料費子帳、詳細欄位）────────────────────────────────────────
export const mockCourses = [
  {
    id: 'C001', name: '養生太極拳', session: 'A', instructor: '王德發老師',
    description: '透過緩慢有氧的太極動作改善平衡感與關節靈活度，適合各年齡層長者。',
    expected_outcome: '每週規律練習，預計8週後可改善下肢肌力與跌倒風險降低30%。',
    day: '週二', time: '09:00', start_date: '2025-05-06',
    capacity: 25, enrolled: 23, waitlist: 2,
    total_fee: 200, total_sessions: 4,
    materials_fee: 0, materials_spent: 0,
    status: 'active',
  },
  {
    id: 'C002', name: '養生太極拳', session: 'B', instructor: '王德發老師',
    description: '透過緩慢有氧的太極動作改善平衡感與關節靈活度，適合各年齡層長者。',
    expected_outcome: '每週規律練習，預計8週後可改善下肢肌力與跌倒風險降低30%。',
    day: '週四', time: '14:00', start_date: '2025-05-08',
    capacity: 25, enrolled: 15, waitlist: 0,
    total_fee: 200, total_sessions: 4,
    materials_fee: 0, materials_spent: 0,
    status: 'active',
  },
  {
    id: 'C003', name: '手工藝DIY', session: 'A', instructor: '林美惠老師',
    description: '結合認知訓練與手部精細動作訓練的創意手工課，每期製作不同主題作品。',
    expected_outcome: '促進手腦協調，提升社交互動，預防認知退化。',
    day: '週一', time: '10:00', start_date: '2025-05-05',
    capacity: 15, enrolled: 15, waitlist: 3,
    total_fee: 150, total_sessions: 4,
    materials_fee: 200, materials_spent: 120,
    status: 'active',
  },
  {
    id: 'C004', name: '健康烹飪課', session: 'A', instructor: '陳淑華老師',
    description: '學習低鈉低糖的長者友善料理，兼顧美味與健康管理。',
    expected_outcome: '建立健康飲食習慣，有效控制慢性病（三高）指數。',
    day: '週三', time: '10:30', start_date: '2025-05-07',
    capacity: 12, enrolled: 8, waitlist: 0,
    total_fee: 300, total_sessions: 6,
    materials_fee: 500, materials_spent: 200,
    status: 'active',
  },
]

// ── 報名（加入部分繳費）─────────────────────────────────────────────────────
export const mockEnrollments = [
  { id: 'E001', member_id: 'SC-001', member_name: '陳美華', course_id: 'C001', sessions_remaining: 2, total_paid: 100, total_fee: 200, is_waitlist: false },
  { id: 'E002', member_id: 'SC-002', member_name: '林德正', course_id: 'C001', sessions_remaining: 3, total_paid: 200, total_fee: 200, is_waitlist: false },
  { id: 'E003', member_id: 'SC-003', member_name: '王淑芬', course_id: 'C001', sessions_remaining: 4, total_paid: 0,   total_fee: 200, is_waitlist: false },
  { id: 'E004', member_id: 'SC-004', member_name: '黃文雄', course_id: 'C003', sessions_remaining: 1, total_paid: 150, total_fee: 150, is_waitlist: false },
  { id: 'E005', member_id: 'SC-006', member_name: '李榮發', course_id: 'C004', sessions_remaining: 5, total_paid: 150, total_fee: 300, is_waitlist: false },
  { id: 'E006', member_id: 'SC-007', member_name: '吳秀蘭', course_id: 'C001', sessions_remaining: 4, total_paid: 0,   total_fee: 200, is_waitlist: true,  waitlist_no: 1 },
  { id: 'E007', member_id: 'SC-008', member_name: '劉進財', course_id: 'C001', sessions_remaining: 4, total_paid: 0,   total_fee: 200, is_waitlist: true,  waitlist_no: 2 },
  { id: 'E008', member_id: 'SC-003', member_name: '王淑芬', course_id: 'C003', sessions_remaining: 4, total_paid: 0,   total_fee: 150, is_waitlist: true,  waitlist_no: 1 },
]

// ── 財務（加入部分繳費與午餐費）────────────────────────────────────────────
export const mockFinance = [
  { id: 'F001', member_id: 'SC-001', member_name: '陳美華', type: 'lunch', month: '2025-05', amount_due: 30,  amount_paid: 30,  date: '2025-05-01' },
  { id: 'F002', member_id: 'SC-002', member_name: '林德正', type: 'course', course_name: '養生太極拳A', month: '2025-05', amount_due: 200, amount_paid: 200, date: '2025-05-01' },
  { id: 'F003', member_id: 'SC-003', member_name: '王淑芬', type: 'course', course_name: '養生太極拳A', month: '2025-05', amount_due: 200, amount_paid: 0,   date: null },
  { id: 'F004', member_id: 'SC-004', member_name: '黃文雄', type: 'lunch', month: '2025-05', amount_due: 30,  amount_paid: 30,  date: '2025-05-02' },
  { id: 'F005', member_id: 'SC-005', member_name: '張桂英', type: 'course', course_name: '手工藝DIYA', month: '2025-05', amount_due: 150, amount_paid: 0,   date: null },
  { id: 'F006', member_id: 'SC-006', member_name: '李榮發', type: 'course', course_name: '健康烹飪課A', month: '2025-05', amount_due: 300, amount_paid: 150, date: '2025-05-02' },
  { id: 'F007', member_id: 'SC-007', member_name: '吳秀蘭', type: 'lunch', month: '2025-05', amount_due: 30,  amount_paid: 0,   date: null },
  { id: 'F008', member_id: 'SC-008', member_name: '劉進財', type: 'lunch', month: '2025-05', amount_due: 30,  amount_paid: 30,  date: '2025-05-01' },
  { id: 'F009', member_id: 'SC-001', member_name: '陳美華', type: 'course', course_name: '養生太極拳A', month: '2025-05', amount_due: 200, amount_paid: 100, date: '2025-05-01' },
]

// ── 今日簽到 ─────────────────────────────────────────────────────────────────
export const mockTodayCheckins = [
  { id: 'A001', member_id: 'SC-002', name: '林德正', time: '08:32', systolic: 125, diastolic: 80, pulse: 68, weight: 68.5 },
  { id: 'A002', member_id: 'SC-004', name: '黃文雄', time: '08:45', systolic: 132, diastolic: 84, pulse: 72, weight: 72.1 },
  { id: 'A003', member_id: 'SC-006', name: '李榮發', time: '09:01', systolic: 118, diastolic: 75, pulse: 65, weight: 65.3 },
  { id: 'A004', member_id: 'SC-008', name: '劉進財', time: '09:15', systolic: 128, diastolic: 82, pulse: 70, weight: 70.8 },
]

// ── 台灣中高齡健康基準（60歲以上）──────────────────────────────────────────
export const HEALTH_NORMS = {
  female: {
    bp_normal:   { systolic: [90, 130], diastolic: [60, 85] },
    bp_warning:  { systolic: [130, 140], diastolic: [85, 90] },
    bp_high:     { systolic: 140, diastolic: 90 },
    pulse_range: [55, 90],
    weight_drop_alert_kg: 3,
  },
  male: {
    bp_normal:   { systolic: [90, 135], diastolic: [60, 85] },
    bp_warning:  { systolic: [135, 145], diastolic: [85, 90] },
    bp_high:     { systolic: 145, diastolic: 90 },
    pulse_range: [55, 90],
    weight_drop_alert_kg: 4,
  },
}

export const ADMIN_PASSWORD = 'admin2025'
