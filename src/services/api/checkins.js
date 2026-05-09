import { supabase } from '../supabaseClient'

export async function getTodayCheckins() {
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from('checkins')
    .select('*')
    .eq('checkin_date', today)
    .order('created_at')
  return data ?? []
}

export async function addCheckin(checkin) {
  const today = new Date().toISOString().slice(0, 10)
  const now   = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })
  const { data, error } = await supabase
    .from('checkins')
    .insert({ ...checkin, checkin_date: today, checkin_time: now })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getCheckinDates(memberId) {
  const { data } = await supabase
    .from('checkins')
    .select('checkin_date')
    .eq('member_id', memberId)
  return (data ?? []).map(r => r.checkin_date)
}
