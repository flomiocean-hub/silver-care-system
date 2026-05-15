import { supabase } from '../supabaseClient'
import { getOrgId } from '../../config/org'

export async function getMembers() {
  const { data } = await supabase.from('members').select('*').eq('org_id', getOrgId()).order('id')
  return data ?? []
}

export async function addMember(member) {
  const { data, error } = await supabase.from('members').insert({ ...member, org_id: getOrgId() }).select().single()
  if (error) throw error
  return data
}

export async function updateMember(id, updates) {
  const { error } = await supabase.from('members').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).eq('org_id', getOrgId())
  if (error) throw error
}

export async function deleteMember(id) {
  const { error } = await supabase.from('members').delete().eq('id', id).eq('org_id', getOrgId())
  if (error) throw error
}

export async function getMembersByIds(ids) {
  if (!ids || ids.length === 0) return []
  const { data } = await supabase
    .from('members')
    .select('id, name, mobile, home_phone, emergency_contact')
    .in('id', ids)
  return data ?? []
}

export async function findMembersByName(name, orgId) {
  const { data, error } = await supabase
    .from('members')
    .select('id, name, mobile, home_phone, org_id')
    .eq('org_id', orgId)
    .eq('name', name.trim())
  if (error) console.error('[findMembersByName] Supabase error:', error)
  return data ?? []
}

export async function updateMemberPhone(id, orgId, mobile) {
  const { error } = await supabase
    .from('members')
    .update({ mobile, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('org_id', orgId)
  if (error) throw error
}
