import { supabase } from '../lib/supabase'
import { run } from '../lib/api'
import { ensureSkills } from './skills'
import { removeFile, uploadFile } from './storage'

// Candidate profile with experience, education and skills. The hiring team can read it for applicants.
export async function getCandidate(userId) {
  const [profile, base, experiences, educations, skills] = await Promise.all([
    run(supabase.from('profiles').select('full_name, email, phone, avatar_path').eq('id', userId).single()),
    run(supabase.from('candidate_profiles').select('*').eq('user_id', userId).maybeSingle()),
    run(supabase.from('candidate_experiences').select('*').eq('user_id', userId).order('start_date', { ascending: false })),
    run(supabase.from('candidate_educations').select('*').eq('user_id', userId).order('end_year', { ascending: false })),
    run(supabase.from('candidate_skills').select('skills(name)').eq('user_id', userId)),
  ])
  return { profile, base: base || {}, experiences, educations, skills: skills.map((s) => s.skills.name) }
}

export async function saveCandidate(userId, profileFields, candidateFields) {
  await run(supabase.from('profiles').update(profileFields).eq('id', userId))
  await run(supabase.from('candidate_profiles').upsert({ ...candidateFields, user_id: userId }))
}

export async function saveCandidateSkills(userId, names) {
  const ids = await ensureSkills(names)
  await run(supabase.from('candidate_skills').delete().eq('user_id', userId))
  if (ids.length) await run(supabase.from('candidate_skills').insert(ids.map((skill_id) => ({ user_id: userId, skill_id }))))
}

export const saveExperience = (userId, id, values) =>
  id
    ? run(supabase.from('candidate_experiences').update(values).eq('id', id))
    : run(supabase.from('candidate_experiences').insert({ ...values, user_id: userId }))

export const deleteExperience = (id) => run(supabase.from('candidate_experiences').delete().eq('id', id))

export const saveEducation = (userId, id, values) =>
  id
    ? run(supabase.from('candidate_educations').update(values).eq('id', id))
    : run(supabase.from('candidate_educations').insert({ ...values, user_id: userId }))

export const deleteEducation = (id) => run(supabase.from('candidate_educations').delete().eq('id', id))

export async function uploadAvatar(userId, file) {
  const path = await uploadFile('avatars', userId, file)
  await run(supabase.from('profiles').update({ avatar_path: path }).eq('id', userId))
}

// ---- Resumes ----
export const listResumes = (userId) =>
  run(supabase.from('resumes').select('*').eq('user_id', userId).eq('is_removed', false).order('created_at', { ascending: false }))

export async function addResume(userId, label, file, makeDefault) {
  const path = await uploadFile('resumes', userId, file)
  if (makeDefault) await run(supabase.from('resumes').update({ is_default: false }).eq('user_id', userId))
  return run(
    supabase.from('resumes').insert({
      user_id: userId,
      label,
      file_path: path,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      is_default: makeDefault,
    }),
  )
}

export async function setDefaultResume(userId, id) {
  await run(supabase.from('resumes').update({ is_default: false }).eq('user_id', userId))
  await run(supabase.from('resumes').update({ is_default: true }).eq('id', id))
}

// A resume that was used in an application is hidden but kept. An unused one is deleted.
export async function deleteResume(resume) {
  const { count } = await supabase.from('applications').select('id', { count: 'exact', head: true }).eq('resume_id', resume.id)
  if (count) return run(supabase.from('resumes').update({ is_removed: true, is_default: false }).eq('id', resume.id))
  await run(supabase.from('resumes').delete().eq('id', resume.id))
  await removeFile('resumes', resume.file_path)
}

// ---- Saved jobs ----
export const listSavedJobs = (userId) =>
  run(
    supabase
      .from('saved_jobs')
      .select('job_id, jobs(*, organizations(name, slug, logo_path, city, country), job_categories(name))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  )

export async function getSavedIds(userId) {
  const rows = await run(supabase.from('saved_jobs').select('job_id').eq('user_id', userId))
  return rows.map((r) => r.job_id)
}

export const saveJobForLater = (userId, jobId) => run(supabase.from('saved_jobs').insert({ user_id: userId, job_id: jobId }))

export const unsaveJob = (userId, jobId) => run(supabase.from('saved_jobs').delete().eq('user_id', userId).eq('job_id', jobId))
