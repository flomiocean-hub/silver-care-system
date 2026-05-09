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

  // Auto-sync to organizations when status becomes active
  if (updates.status === 'active') {
    const { data: station } = await supabase.from('care_stations').select('*').eq('id', id).single()
    if (station) {
      await supabase.from('organizations').upsert({
        name:             station.org_name,
        short_name:       station.org_name.length > 12 ? station.org_name.slice(0, 12) : station.org_name,
        status:           'active',
        care_station_id:  station.id,
      }, { onConflict: 'care_station_id' })
    }
  } else if ('status' in updates && updates.status !== 'active') {
    // Mark org inactive if care_station leaves active state
    await supabase.from('organizations')
      .update({ status: 'inactive' })
      .eq('care_station_id', id)
  }
}
