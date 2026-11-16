import { supabase } from '../lib/supabase'
import { run } from '../lib/api'
import { randomSuffix, slugify } from '../lib/format'
import { ensureSkills } from './skills'

export const PAGE_SIZE = 12
const JOB_WITH_ORG = '*, organizations(name, slug, logo_path, city, country), job_categories(name), job_skills(skills(name))'

export const listCategories = () => run(supabase.from('job_categories').select('*').order('sort_order'))

// Public search. Only published jobs from verified organizations come back (the database enforces it).
export async function searchJobs(f, page = 1) {
  let q = supabase.from('jobs').select(JOB_WITH_ORG, { count: 'exact' }).eq('status', 'published')
  const words = (f.q || '').toLowerCase().match(/[a-z0-9]+/g)
  if (words) q = q.textSearch('search_vector', words.map((w) => `${w}:*`).join(' & '), { config: 'english' })
  if (f.category) q = q.eq('category_id', f.category)
  if (f.work_mode) q = q.eq('work_mode', f.work_mode)
  if (f.employment_type) q = q.eq('employment_type', f.employment_type)
  if (f.experience_level) q = q.eq('experience_level', f.experience_level)
  if (f.city) q = q.ilike('city', `%${f.city.replace(/[%,()]/g, '')}%`)
  if (f.salary) q = q.gte('salary_max', Number(f.salary))
  if (f.posted) q = q.gte('published_at', new Date(Date.now() - Number(f.posted) * 86400000).toISOString())
  if (f.org) q = q.eq('organization_id', f.org)
  if (f.sort === 'closing') q = q.order('closes_at', { ascending: true, nullsFirst: false })
  else if (f.sort === 'salary') q = q.order('salary_max', { ascending: false, nullsFirst: false })
  else q = q.order('published_at', { ascending: false })
  const from = (page - 1) * PAGE_SIZE
  const { data, error, count } = await q.range(from, from + PAGE_SIZE - 1)
  if (error) throw new Error('Could not load jobs. Please try again.')
  return { jobs: data, total: count || 0 }
}

export const getJobBySlug = (slug) => run(supabase.from('jobs').select(JOB_WITH_ORG).eq('slug', slug).maybeSingle())

export const getJob = (id) => run(supabase.from('jobs').select('*, job_skills(skills(name))').eq('id', id).single())

export const listOrgJobs = (orgId) =>
  run(supabase.from('jobs').select('*, applications(count)').eq('organization_id', orgId).order('created_at', { ascending: false }))

export async function saveJob(orgId, userId, id, values, skillNames) {
  let jobId = id
  if (id) {
    await run(supabase.from('jobs').update(values).eq('id', id))
  } else {
    const row = { ...values, organization_id: orgId, created_by: userId, slug: `${slugify(values.title)}-${randomSuffix()}` }
    jobId = (await run(supabase.from('jobs').insert(row).select('id').single())).id
  }
  const ids = await ensureSkills(skillNames)
  await run(supabase.from('job_skills').delete().eq('job_id', jobId))
  if (ids.length) await run(supabase.from('job_skills').insert(ids.map((skill_id) => ({ job_id: jobId, skill_id }))))
  return jobId
}

export const setJobStatus = (id, status) => run(supabase.from('jobs').update({ status }).eq('id', id))

export const deleteJob = (id) => run(supabase.from('jobs').delete().eq('id', id))

export async function duplicateJob(id, userId) {
  const job = await getJob(id)
  const { id: _id, slug: _s, search_vector: _v, created_at: _c, updated_at: _u, published_at: _p, job_skills, ...rest } = job
  const copy = { ...rest, title: `${job.title} (copy)`, status: 'draft', created_by: userId, slug: `${slugify(job.title)}-${randomSuffix()}` }
  const created = await run(supabase.from('jobs').insert(copy).select('id').single())
  const names = job_skills.map((j) => j.skills.name)
  const ids = await ensureSkills(names)
  if (ids.length) await run(supabase.from('job_skills').insert(ids.map((skill_id) => ({ job_id: created.id, skill_id }))))
  return created.id
}

export const listLatestJobs = (limit = 6) =>
  run(supabase.from('jobs').select(JOB_WITH_ORG).eq('status', 'published').order('published_at', { ascending: false }).limit(limit))
