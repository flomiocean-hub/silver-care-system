import { supabase } from '../supabaseClient'

export async function getCareStations() {
  const { data } = await supabase
    .from('care_stations')
    .select('*')
    .order('district')
    .order('seq_no')
  return data ?? []
}

export async function updateCareStation(id, updates) {
  const { error } = await supabase.from('care_stations').update(updates).eq('id', id)
  if (error) throw error
}
