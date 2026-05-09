import { supabase } from '../supabaseClient'

export async function getAttendanceSummary() {
  const { data } = await supabase
    .from('attendance_summary')
    .select('*')
    .order('date')
    .limit(30)
  return (data ?? []).map(r => ({
    date: r.date,
    count: r.actual_count,
    expected: r.expected_count,
    rate: r.expected_count > 0 ? Math.round((r.actual_count / r.expected_count) * 100) : 0,
  }))
}

export async function upsertAttendance(date, actualCount, expectedCount) {
  const { error } = await supabase
    .from('attendance_summary')
    .upsert({ date, actual_count: actualCount, expected_count: expectedCount })
  if (error) throw error
}
