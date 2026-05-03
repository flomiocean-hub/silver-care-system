export const mockMembers = [
  { id: 'M001', name: '陳美華', birthday: '1942-03-15', gender: '女', is_alone: true,
    emergency_contact: '陳志明 0912-345-678', join_date: '2023-01-10',
    last_seen: '2025-04-18', risk_score: 72, status: '活躍', notes: '有高血壓病史' },
  { id: 'M002', name: '林德正', birthday: '1938-07-22', gender: '男', is_alone: false,
    emergency_contact: '林小玲 0923-456-789', join_date: '2023-02-15',
    last_seen: '2025-05-02', risk_score: 15, status: '活躍', notes: '' },
  { id: 'M003', name: '王淑芬', birthday: '1945-11-08', gender: '女', is_alone: true,
    emergency_contact: '王大明 0934-567-890', join_date: '2023-03-20',
    last_seen: '2025-04-30', risk_score: 45, status: '活躍', notes: '輕度失智觀察中' },
  { id: 'M004', name: '黃文雄', birthday: '1940-05-30', gender: '男', is_alone: false,
    emergency_contact: '黃美珠 0945-678-901', join_date: '2023-01-25',
    last_seen: '2025-05-03', risk_score: 20, status: '活躍', notes: '' },
  { id: 'M005', name: '張桂英', birthday: '1947-09-12', gender: '女', is_alone: true,
    emergency_contact: '張小華 0956-789-012', join_date: '2023-04-05',
    last_seen: '2025-04-10', risk_score: 85, status: '高風險', notes: '連續缺席超過14天' },
  { id: 'M006', name: '李榮發', birthday: '1935-12-03', gender: '男', is_alone: false,
    emergency_contact: '李美玉 0967-890-123', join_date: '2022-11-15',
    last_seen: '2025-05-01', risk_score: 30, status: '活躍', notes: '糖尿病' },
  { id: 'M007', name: '吳秀蘭', birthday: '1943-06-18', gender: '女', is_alone: true,
    emergency_contact: '吳建志 0978-901-234', join_date: '2023-05-10',
    last_seen: '2025-04-25', risk_score: 60, status: '注意', notes: '血壓不穩定' },
  { id: 'M008', name: '劉進財', birthday: '1939-02-28', gender: '男', is_alone: false,
    emergency_contact: '劉淑華 0989-012-345', join_date: '2022-12-01',
    last_seen: '2025-05-02', risk_score: 10, status: '活躍', notes: '' },
]

export const mockHealthData = [
  { date: '2025-04-01', member_id: 'M001', name: '陳美華', systolic: 138, diastolic: 88, weight: 52.3 },
  { date: '2025-04-08', member_id: 'M001', name: '陳美華', systolic: 145, diastolic: 92, weight: 51.8 },
  { date: '2025-04-15', member_id: 'M001', name: '陳美華', systolic: 152, diastolic: 95, weight: 51.5 },
  { date: '2025-04-22', member_id: 'M001', name: '陳美華', systolic: 148, diastolic: 90, weight: 51.9 },
  { date: '2025-04-01', member_id: 'M003', name: '王淑芬', systolic: 128, diastolic: 82, weight: 55.0 },
  { date: '2025-04-15', member_id: 'M003', name: '王淑芬', systolic: 135, diastolic: 85, weight: 54.5 },
  { date: '2025-04-29', member_id: 'M003', name: '王淑芬', systolic: 142, diastolic: 88, weight: 54.2 },
  { date: '2025-04-01', member_id: 'M007', name: '吳秀蘭', systolic: 155, diastolic: 98, weight: 58.0 },
  { date: '2025-04-08', member_id: 'M007', name: '吳秀蘭', systolic: 132, diastolic: 84, weight: 57.8 },
  { date: '2025-04-15', member_id: 'M007', name: '吳秀蘭', systolic: 158, diastolic: 100, weight: 57.5 },
  { date: '2025-04-22', member_id: 'M007', name: '吳秀蘭', systolic: 130, diastolic: 82, weight: 57.9 },
  { date: '2025-04-25', member_id: 'M007', name: '吳秀蘭', systolic: 162, diastolic: 102, weight: 57.6 },
]

export const mockAttendance = [
  { date: '2025-04-26', count: 38, rate: 79 },
  { date: '2025-04-27', count: 35, rate: 73 },
  { date: '2025-04-28', count: 41, rate: 85 },
  { date: '2025-04-29', count: 39, rate: 81 },
  { date: '2025-04-30', count: 35, rate: 73 },
  { date: '2025-05-01', count: 44, rate: 92 },
  { date: '2025-05-02', count: 42, rate: 88 },
]

export const mockCourses = [
  { id: 'C001', name: '養生太極拳', session: 'A', instructor: '王老師', day: '週二', time: '09:00',
    capacity: 20, enrolled: 18, total_fee: 200, total_sessions: 4, start_date: '2025-05-06' },
  { id: 'C002', name: '養生太極拳', session: 'B', instructor: '王老師', day: '週四', time: '14:00',
    capacity: 20, enrolled: 15, total_fee: 200, total_sessions: 4, start_date: '2025-05-08' },
  { id: 'C003', name: '手工藝DIY', session: 'A', instructor: '林老師', day: '週一', time: '10:00',
    capacity: 15, enrolled: 15, total_fee: 150, total_sessions: 4, start_date: '2025-05-05' },
  { id: 'C004', name: '健康烹飪課', session: 'A', instructor: '陳老師', day: '週三', time: '10:30',
    capacity: 12, enrolled: 8, total_fee: 300, total_sessions: 6, start_date: '2025-05-07' },
  { id: 'C005', name: '音樂律動', session: 'A', instructor: '張老師', day: '週五', time: '09:30',
    capacity: 25, enrolled: 20, total_fee: 100, total_sessions: 4, start_date: '2025-05-09' },
]

export const mockEnrollments = [
  { id: 'E001', member_id: 'M001', member_name: '陳美華', course_id: 'C001', sessions_remaining: 2, paid: true },
  { id: 'E002', member_id: 'M002', member_name: '林德正', course_id: 'C001', sessions_remaining: 3, paid: true },
  { id: 'E003', member_id: 'M003', member_name: '王淑芬', course_id: 'C002', sessions_remaining: 4, paid: false },
  { id: 'E004', member_id: 'M004', member_name: '黃文雄', course_id: 'C003', sessions_remaining: 1, paid: true },
  { id: 'E005', member_id: 'M006', member_name: '李榮發', course_id: 'C004', sessions_remaining: 5, paid: true },
]

export const mockFinance = [
  { id: 'F001', member_id: 'M001', member_name: '陳美華', type: 'meal', month: '2025-05', amount: 30, paid: true, date: '2025-05-01' },
  { id: 'F002', member_id: 'M002', member_name: '林德正', type: 'monthly', month: '2025-05', amount: 350, paid: true, date: '2025-05-01' },
  { id: 'F003', member_id: 'M003', member_name: '王淑芬', type: 'monthly', month: '2025-05', amount: 350, paid: false, date: null },
  { id: 'F004', member_id: 'M004', member_name: '黃文雄', type: 'meal', month: '2025-05', amount: 30, paid: true, date: '2025-05-02' },
  { id: 'F005', member_id: 'M005', member_name: '張桂英', type: 'monthly', month: '2025-05', amount: 350, paid: false, date: null },
  { id: 'F006', member_id: 'M006', member_name: '李榮發', type: 'monthly', month: '2025-04', amount: 350, paid: true, date: '2025-04-03' },
  { id: 'F007', member_id: 'M007', member_name: '吳秀蘭', type: 'meal', month: '2025-05', amount: 30, paid: false, date: null },
  { id: 'F008', member_id: 'M008', member_name: '劉進財', type: 'monthly', month: '2025-05', amount: 350, paid: true, date: '2025-05-01' },
]

export const mockTodayCheckins = [
  { id: 'A001', member_id: 'M002', name: '林德正', time: '08:32', systolic: 125, diastolic: 80, weight: 68.5 },
  { id: 'A002', member_id: 'M004', name: '黃文雄', time: '08:45', systolic: 132, diastolic: 84, weight: 72.1 },
  { id: 'A003', member_id: 'M006', name: '李榮發', time: '09:01', systolic: 118, diastolic: 75, weight: 65.3 },
  { id: 'A004', member_id: 'M008', name: '劉進財', time: '09:15', systolic: 128, diastolic: 82, weight: 70.8 },
]
