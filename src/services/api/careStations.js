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

  if (!('status' in updates)) return

  // Need the station's org_name for org sync
  const { data: station } = await supabase.from('care_stations').select('*').eq('id', id).single()
  if (!station) return

  if (updates.status === 'active') {
    const shortName = station.org_name.length > 12
      ? station.org_name.slice(0, 12)
      : station.org_name

    // Check by name (org_name is the natural key; avoids care_station_id constraint dependency)
    const { data: existing } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', station.org_name)
      .maybeSingle()

    if (existing) {
      await supabase.from('organizations')
        .update({ status: 'active', city: station.city ?? null, district: station.district ?? null })
        .eq('id', existing.id)
    } else {
      const { error: orgErr } = await supabase.from('organizations').insert({
        name:       station.org_name,
        short_name: shortName,
        status:     'active',
        city:       station.city ?? null,
        district:   station.district ?? null,
      })
      if (orgErr) throw new Error(`組織同步失敗：${orgErr.message}`)
    }
  } else {
    // Deactivate org when station leaves active
    await supabase.from('organizations')
      .update({ status: 'inactive' })
      .eq('name', station.org_name)
  }
}
