import { supabase } from '../supabaseClient'

export async function getHealthRecords() {
  const { data } = await supabase.from('health_records').select('*, members(gender)').order('date')
  return (data ?? []).map(r => ({
    ...r,
    member_id: r.member_id,
    gender: r.members?.gender ?? '女',
  }))
}

export async function addHealthRecord(record) {
  const { error } = await supabase.from('health_records').insert(record)
  if (error) throw error
}
