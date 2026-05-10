import { supabase } from '../supabaseClient'

const SELECT = '*, organizations(id, name, short_name)'

export async function findUserByCredentials(username, password) {
  const { data } = await supabase
    .from('user_accounts')
    .select(SELECT)
    .eq('username', username)
    .eq('password', password)
    .single()
  return data ?? null
}

export async function findUserByEmail(email) {
  const { data } = await supabase
    .from('user_accounts')
    .select(SELECT)
    .eq('google_email', email.toLowerCase())
    .single()
  return data ?? null
}

export async function getAllUsers() {
  const { data } = await supabase
    .from('user_accounts')
    .select(SELECT)
    .order('role')
    .order('name')
  return data ?? []
}

export async function createUser({ name, role, org_id, username, password, google_email }) {
  const payload = { name, role, org_id }
  if (google_email) payload.google_email = google_email.toLowerCase()
  if (username)     payload.username     = username
  if (password)     payload.password     = password
  const { error } = await supabase.from('user_accounts').insert(payload)
  if (error) throw error
}

export async function deleteUser(id) {
  const { error } = await supabase.from('user_accounts').delete().eq('id', id)
  if (error) throw error
}
