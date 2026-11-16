import { supabase } from '../lib/supabase'
import { run } from '../lib/api'

export const getProfile = (id) => run(supabase.from('profiles').select('*').eq('id', id).single())

export const getMemberships = (userId) =>
  run(supabase.from('organization_members').select('*, organizations(*)').eq('user_id', userId).order('joined_at'))

// A Super Admin can open every organization, as if they were its admin.
export async function getAdminMemberships() {
  const orgs = await run(supabase.from('organizations').select('*').order('name'))
  return orgs.map((o) => ({ id: o.id, organization_id: o.id, role: 'org_admin', status: 'active', organizations: o }))
}

export const updateProfile = (id, fields) => run(supabase.from('profiles').update(fields).eq('id', id))
