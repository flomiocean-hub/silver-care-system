import { supabase } from '../supabaseClient'
import { getOrgId } from '../../config/org'

export async function getHealthRecords() {
  const { data } = await supabase
    .from('checkins')
    .select('*, members(gender)')
    .eq('org_id', getOrgId())
    .not('systolic', 'is', null)
    .order('checkin_date')
  return (data ?? []).map(r => ({
    ...r,
    date:   r.checkin_date,
    gender: r.members?.gender ?? '女',
  }))
}

export async function addHealthRecord(record) {
  const { error } = await supabase.from('health_records').insert({ ...record, org_id: getOrgId() })
  if (error) throw error
}
