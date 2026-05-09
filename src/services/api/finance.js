import { supabase } from '../supabaseClient'

export async function getFinanceRecords() {
  const { data } = await supabase.from('finance_records').select('*').order('created_at')
  return data ?? []
}

export async function updateFinanceRecord(id, updates) {
  const { error } = await supabase.from('finance_records').update(updates).eq('id', id)
  if (error) throw error
}
