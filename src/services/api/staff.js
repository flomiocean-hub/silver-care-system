import { supabase } from '../supabaseClient'

export async function getStaffAccounts() {
  const { data } = await supabase
    .from('staff_accounts')
    .select('*, organizations(id, name, short_name)')
    .order('name')
  return data ?? []
}

export async function addStaffAccount({ name, org_id, google_email }) {
  const { error } = await supabase
    .from('staff_accounts')
    .insert({ name, org_id, google_email })
  if (error) throw error
}

export async function removeStaffAccount(id) {
  const { error } = await supabase
    .from('staff_accounts')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function findStaffByEmail(email) {
  const { data } = await supabase
    .from('staff_accounts')
    .select('*, organizations(id, name, short_name)')
    .eq('google_email', email)
    .single()
  return data ?? null
}
