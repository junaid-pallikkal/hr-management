import { supabase } from '../lib/supabase'
import { run } from '../lib/api'
import { randomSuffix, slugify } from '../lib/format'
import { removeFile, uploadFile } from './storage'

export function createOrganization({ name, industry, city, country, email }) {
  const slug = `${slugify(name) || 'company'}-${randomSuffix()}`
  return run(
    supabase.rpc('create_organization', { p_name: name, p_slug: slug, p_industry: industry, p_city: city, p_country: country, p_email: email }),
  )
}

export const getOrganization = (id) => run(supabase.from('organizations').select('*').eq('id', id).single())

export const getOrganizationBySlug = (slug) => run(supabase.from('organizations').select('*').eq('slug', slug).maybeSingle())

export const updateOrganization = (id, fields) => run(supabase.from('organizations').update(fields).eq('id', id))

export const resubmitOrganization = (id) => run(supabase.from('organizations').update({ status: 'pending' }).eq('id', id))

export async function uploadOrgImage(orgId, kind, file) {
  return uploadFile('org-assets', orgId, file).then((path) => ({ [`${kind}_path`]: path }))
}

export const listDocuments = (orgId) =>
  run(supabase.from('verification_documents').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }))

export async function addDocument(orgId, userId, docType, file) {
  const path = await uploadFile('verification-docs', orgId, file)
  return run(
    supabase.from('verification_documents').insert({
      organization_id: orgId,
      doc_type: docType,
      file_path: path,
      file_name: file.name,
      uploaded_by: userId,
    }),
  )
}

export async function removeDocument(doc) {
  await run(supabase.from('verification_documents').delete().eq('id', doc.id))
  await removeFile('verification-docs', doc.file_path)
}

export const getDashboardStats = (orgId) => run(supabase.rpc('org_dashboard_stats', { p_org: orgId }))

export const getAnalytics = (orgId) => run(supabase.rpc('org_analytics', { p_org: orgId }))

export const listOrgActivity = (orgId) =>
  run(
    supabase
      .from('activity_logs')
      .select('*, profiles:actor_id(full_name)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(100),
  )
