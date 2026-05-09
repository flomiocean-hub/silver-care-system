import { supabase } from '../supabaseClient'
import { ORG_ID } from '../../config/org'

// 手動建立的記錄（午餐費 + 材料費）
export async function getLunchRecords() {
  const { data } = await supabase
    .from('finance_records')
    .select('*')
    .eq('org_id', ORG_ID)
    .in('type', ['lunch', 'material'])
    .order('created_at')
  return data ?? []
}

export async function addLunchRecord(record) {
  const { error } = await supabase.from('finance_records').insert({ ...record, org_id: ORG_ID })
  if (error) throw error
}

export async function updateFinanceRecord(id, updates) {
  const { error } = await supabase.from('finance_records').update(updates).eq('id', id).eq('org_id', ORG_ID)
  if (error) throw error
}

export async function deleteLunchRecord(id) {
  const { error } = await supabase.from('finance_records').delete().eq('id', id).eq('org_id', ORG_ID)
  if (error) throw error
}

// 課程費 + 每人材料費：從 enrollments + courses 合併
export async function getCourseFinanceRecords() {
  const { data } = await supabase
    .from('enrollments')
    .select('*, courses(name, session, materials_fee)')
    .eq('org_id', ORG_ID)
    .eq('is_waitlist', false)
    .order('enrolled_at')

  const records = []
  for (const e of (data ?? [])) {
    if ((e.total_fee ?? 0) > 0) {
      records.push({
        id:            `enr-${e.id}`,
        member_name:   e.member_name,
        type:          'course',
        course_name:   e.courses?.name ?? '未知課程',
        session:       e.courses?.session,
        month:         e.enrolled_at?.slice(0, 7) ?? '',
        amount_due:    e.total_fee,
        amount_paid:   e.total_paid,
        enrollment_id: e.id,
      })
    }
    const matFee = e.courses?.materials_fee ?? 0
    if (matFee > 0) {
      records.push({
        id:            `mat-${e.id}`,
        member_name:   e.member_name,
        type:          'course',
        is_material:   true,
        course_name:   e.courses?.name ?? '未知課程',
        session:       e.courses?.session,
        month:         e.enrolled_at?.slice(0, 7) ?? '',
        amount_due:    matFee,
        amount_paid:   e.material_paid ?? 0,
        enrollment_id: e.id,
      })
    }
  }
  return records
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

export async function updateEnrollmentMaterialPaid(enrollmentId, materialPaid) {
  const { error } = await supabase
    .from('enrollments')
    .update({ material_paid: materialPaid })
    .eq('id', enrollmentId)
  if (error) throw error
}
