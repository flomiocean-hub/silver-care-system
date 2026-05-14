import { supabase } from '../supabaseClient'

const SELECT = '*, organizations(id, name, short_name)'

export async function findUserByCredentials(username, password) {
  try {
    const { data, error } = await supabase
      .from('user_accounts')
      .select(SELECT)
      .eq('username', username)
      .eq('password', password)
      .single()
    if (error && error.code !== 'PGRST116') console.error('findUserByCredentials:', error)
    return data ?? null
  } catch (err) {
    console.error('findUserByCredentials network error:', err)
    return null
  }
}

export async function findUserByEmail(email) {
  try {
    const { data, error } = await supabase
      .from('user_accounts')
      .select(SELECT)
      .eq('google_email', email.toLowerCase())
      .single()
    if (error && error.code !== 'PGRST116') console.error('findUserByEmail:', error)
    return data ?? null
  } catch (err) {
    console.error('findUserByEmail network error:', err)
    return null
  }
}

export async function getAllUsers() {
  const { data } = await supabase
    .from('user_accounts')
    .select(SELECT)
    .order('role')
    .order('name')
  return data ?? []
}

export async function getUsersByOrg(orgId) {
  const { data } = await supabase
    .from('user_accounts')
    .select(SELECT)
    .eq('org_id', orgId)
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

export async function updateUser(id, { name, role, org_id, username, password, google_email }) {
  const payload = { name, role, org_id }
  payload.username     = username     || null
  payload.google_email = google_email ? google_email.toLowerCase() : null
  if (password) payload.password = password
  const { error } = await supabase.from('user_accounts').update(payload).eq('id', id)
  if (error) throw error
}

export async function deleteUser(id) {
  const { error } = await supabase.from('user_accounts').delete().eq('id', id)
  if (error) throw error
}

export async function resetUserCredentials(id) {
  const { error } = await supabase
    .from('user_accounts')
    .update({ username: null, password: null })
    .eq('id', id)
  if (error) throw error
}

export async function setUserCredentials(id, username, password) {
  const { error } = await supabase
    .from('user_accounts')
    .update({ username, password })
    .eq('id', id)
  if (error) throw error
}

export async function submitAccountRequest({ org_id, org_name, name, email, phone }) {
  const { error } = await supabase
    .from('account_requests')
    .insert({ org_id: org_id || null, org_name, name, email, phone })
  if (error) throw error
}
