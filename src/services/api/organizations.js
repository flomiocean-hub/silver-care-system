import { supabase } from '../supabaseClient'

export async function getActiveOrganizations() {
  const { data } = await supabase
    .from('organizations')
    .select('id, name, short_name')
    .eq('status', 'active')
    .order('name')
  return data ?? []
}
