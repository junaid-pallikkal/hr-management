import { supabase } from '../lib/supabase'
import { run } from '../lib/api'
import { slugify } from '../lib/format'

export function listOrganizations({ status, q } = {}) {
  let query = supabase.from('organizations').select('*').order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  if (q) query = query.ilike('name', `%${q.replace(/[%,()]/g, '')}%`)
  return run(query)
}

export async function getOrganizationForReview(id) {
  const [org, documents, members, jobs] = await Promise.all([
    run(supabase.from('organizations').select('*').eq('id', id).single()),
    run(supabase.from('verification_documents').select('*').eq('organization_id', id).order('created_at')),
    run(supabase.from('organization_members').select('*, profiles:user_id(full_name, email)').eq('organization_id', id)),
    run(supabase.from('jobs').select('id, title, status').eq('organization_id', id).order('created_at', { ascending: false }).limit(10)),
  ])
  return { org, documents, members, jobs }
}

export const reviewOrganization = (id, status, reason) =>
  run(supabase.rpc('review_organization', { p_org: id, p_status: status, p_reason: reason || null }))

export function listUsers({ q, role } = {}) {
  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(200)
  if (role) query = query.eq('platform_role', role)
  if (q) {
    const safe = q.replace(/[%,()]/g, '')
    query = query.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%`)
  }
  return run(query)
}

export const setUserActive = (id, isActive) => run(supabase.from('profiles').update({ is_active: isActive }).eq('id', id))

export const saveCategory = (id, name, sortOrder) =>
  id
    ? run(supabase.from('job_categories').update({ name, slug: slugify(name), sort_order: sortOrder }).eq('id', id))
    : run(supabase.from('job_categories').insert({ name, slug: slugify(name), sort_order: sortOrder }))

export const deleteCategory = (id) => run(supabase.from('job_categories').delete().eq('id', id))

export const getPlatformStats = () => run(supabase.rpc('platform_stats'))

export const listPlatformActivity = () =>
  run(
    supabase
      .from('activity_logs')
      .select('*, profiles:actor_id(full_name), organizations(name)')
      .order('created_at', { ascending: false })
      .limit(100),
  )
