import { supabase } from '../supabaseClient'

// 午餐費（手動建立的記錄）
export async function getLunchRecords() {
  const { data } = await supabase
    .from('finance_records')
    .select('*')
    .eq('type', 'lunch')
    .order('created_at')
  return data ?? []
}

export async function addLunchRecord(record) {
  const { error } = await supabase.from('finance_records').insert(record)
  if (error) throw error
}

export async function updateFinanceRecord(id, updates) {
  const { error } = await supabase.from('finance_records').update(updates).eq('id', id)
  if (error) throw error
}

// 課程費：從 enrollments + courses 合併
export async function getCourseFinanceRecords() {
  const { data } = await supabase
    .from('enrollments')
    .select('*, courses(name, session)')
    .eq('is_waitlist', false)
    .order('enrolled_at')
  return (data ?? []).map(e => ({
    id:          `enr-${e.id}`,
    member_name: e.member_name,
    type:        'course',
    course_name: e.courses?.name ?? '未知課程',
    session:     e.courses?.session,
    month:       e.enrolled_at?.slice(0, 7) ?? '',
    amount_due:  e.total_fee,
    amount_paid: e.total_paid,
    enrollment_id: e.id,
  }))
}

// 相容舊版呼叫：合併課程費 + 午餐費
export async function getFinanceRecords() {
  const [lunch, course] = await Promise.all([getLunchRecords(), getCourseFinanceRecords()])
  return [...course, ...lunch]
}

export async function updateEnrollmentPaid(enrollmentId, amountPaid) {
  const { error } = await supabase
    .from('enrollments')
    .update({ total_paid: amountPaid })
    .eq('id', enrollmentId)
  if (error) throw error
}
