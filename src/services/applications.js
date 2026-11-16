import { supabase } from '../lib/supabase'
import { run } from '../lib/api'

export const applyToJob = (jobId, resumeId, cover) =>
  run(supabase.rpc('apply_to_job', { p_job: jobId, p_resume: resumeId, p_cover: cover || null }))

export const withdrawApplication = (id) => run(supabase.rpc('withdraw_application', { p_app: id }))

export const listMyApplications = (userId) =>
  run(
    supabase
      .from('applications')
      .select('*, jobs(title, slug, city, country, work_mode, organizations(name, slug))')
      .eq('candidate_id', userId)
      .order('applied_at', { ascending: false }),
  )

export const getMyApplicationForJob = (userId, jobId) =>
  run(supabase.from('applications').select('id, status').eq('candidate_id', userId).eq('job_id', jobId).maybeSingle())

export const getTimeline = (id) => run(supabase.rpc('my_application_timeline', { p_app: id }))

// ---- Hiring team ----
export const listJobApplications = (jobId) =>
  run(
    supabase
      .from('applications')
      .select('id, status, rating, is_shortlisted, applied_at, status_changed_at, candidate_id, profiles:candidate_id(full_name, avatar_path)')
      .eq('job_id', jobId)
      .order('status_changed_at', { ascending: false }),
  )

export const listRecentApplications = (orgId, limit = 6) =>
  run(
    supabase
      .from('applications')
      .select('id, status, applied_at, jobs(id, title), profiles:candidate_id(full_name, avatar_path)')
      .eq('organization_id', orgId)
      .order('applied_at', { ascending: false })
      .limit(limit),
  )

export const getApplication = (id) =>
  run(
    supabase
      .from('applications')
      .select('*, jobs(id, title, slug), resumes(label, file_name, file_path), profiles:candidate_id(id, full_name, email, phone, avatar_path)')
      .eq('id', id)
      .single(),
  )

export const changeStatus = (id, status, note) =>
  run(supabase.rpc('change_application_status', { p_app: id, p_status: status, p_note: note || null }))

export const rateApplication = (id, rating) => run(supabase.rpc('rate_application', { p_app: id, p_rating: rating }))

export const listHistory = (id) =>
  run(
    supabase
      .from('application_status_history')
      .select('*, profiles:changed_by(full_name)')
      .eq('application_id', id)
      .order('created_at', { ascending: false }),
  )

// ---- Notes and scorecards (internal) ----
export const listNotes = (id) =>
  run(
    supabase
      .from('application_notes')
      .select('*, profiles:author_id(full_name)')
      .eq('application_id', id)
      .order('created_at', { ascending: false }),
  )

export const addNote = (appId, userId, body) =>
  run(supabase.from('application_notes').insert({ application_id: appId, author_id: userId, body }))

export const deleteNote = (id) => run(supabase.from('application_notes').delete().eq('id', id))

export const listEvaluations = (id) =>
  run(
    supabase
      .from('application_evaluations')
      .select('*, profiles:evaluator_id(full_name)')
      .eq('application_id', id)
      .order('created_at', { ascending: false }),
  )

export const saveEvaluation = (appId, userId, values) =>
  run(
    supabase
      .from('application_evaluations')
      .upsert({ application_id: appId, evaluator_id: userId, ...values }, { onConflict: 'application_id,evaluator_id' }),
  )

// ---- Messages ----
export const listMessages = (id) =>
  run(
    supabase
      .from('application_messages')
      .select('*, profiles:sender_id(full_name)')
      .eq('application_id', id)
      .order('created_at'),
  )

export const sendMessage = (appId, userId, body) =>
  run(supabase.from('application_messages').insert({ application_id: appId, sender_id: userId, body }))
