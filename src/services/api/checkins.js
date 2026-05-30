import { supabase } from '../supabaseClient'
import { getOrgId } from '../../config/org'

export async function getTodayCheckins() {
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from('checkins')
    .select('*')
    .eq('org_id', getOrgId())
    .eq('checkin_date', today)
    .order('created_at')
  return data ?? []
}

export async function addCheckin(checkin) {
  const today = new Date().toISOString().slice(0, 10)
  const now   = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })
  const { data, error } = await supabase
    .from('checkins')
    .insert({ ...checkin, org_id: getOrgId(), checkin_date: today, checkin_time: now })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getCheckinDates(memberId) {
  const { data } = await supabase
    .from('checkins')
    .select('checkin_date')
    .eq('org_id', getOrgId())
    .eq('member_id', memberId)
  return (data ?? []).map(r => r.checkin_date)
}

export async function updateCheckin(id, vitals) {
  const { error } = await supabase
    .from('checkins')
    .update({
      systolic:  vitals.systolic  ? Number(vitals.systolic)  : null,
      diastolic: vitals.diastolic ? Number(vitals.diastolic) : null,
      pulse:     vitals.pulse     ? Number(vitals.pulse)     : null,
      weight:    vitals.weight    ? Number(vitals.weight)    : null,
      height:    vitals.height    ? Number(vitals.height)    : null,
      waist:     vitals.waist     ? Number(vitals.waist)     : null,
    })
    .eq('id', id)
    .eq('org_id', getOrgId())
  if (error) throw error
}

export async function getMemberCheckins(memberId) {
  const since = new Date()
  since.setMonth(since.getMonth() - 6)
  const { data } = await supabase
    .from('checkins')
    .select('checkin_date, systolic, diastolic')
    .eq('org_id', getOrgId())
    .eq('member_id', memberId)
    .gte('checkin_date', since.toISOString().slice(0, 10))
    .order('checkin_date')
  return data ?? []
}
