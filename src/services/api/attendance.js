import { supabase } from '../supabaseClient'
import { getOrgId } from '../../config/org'

export async function getAttendanceSummary() {
  const since = new Date()
  since.setDate(since.getDate() - 30)
  const { data } = await supabase
    .from('checkins')
    .select('checkin_date')
    .eq('org_id', getOrgId())
    .gte('checkin_date', since.toISOString().slice(0, 10))
    .order('checkin_date')
  if (!data || data.length === 0) return []
  const countByDate = {}
  for (const r of data) {
    countByDate[r.checkin_date] = (countByDate[r.checkin_date] ?? 0) + 1
  }
  return Object.entries(countByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))
}

export async function upsertAttendance(date, actualCount, expectedCount) {
  const { error } = await supabase
    .from('attendance_summary')
    .upsert({ org_id: getOrgId(), date, actual_count: actualCount, expected_count: expectedCount })
  if (error) throw error
}
