import { supabase } from '../supabaseClient'

export async function getMembers() {
  const { data } = await supabase.from('members').select('*').order('id')
  return data ?? []
}

export async function addMember(member) {
  const { data, error } = await supabase.from('members').insert(member).select().single()
  if (error) throw error
  return data
}

export async function updateMember(id, updates) {
  const { error } = await supabase.from('members').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function deleteMember(id) {
  const { error } = await supabase.from('members').delete().eq('id', id)
  if (error) throw error
}
