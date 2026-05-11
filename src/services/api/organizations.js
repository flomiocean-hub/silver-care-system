import { supabase } from '../supabaseClient'

export async function getActiveOrganizations() {
  const { data } = await supabase
    .from('organizations')
    .select('id, name, short_name, city, district')
    .eq('status', 'active')
    .order('name')
  return data ?? []
}
