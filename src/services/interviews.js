import { supabase } from '../lib/supabase'
import { run } from '../lib/api'

export const scheduleInterview = (v) =>
  run(
    supabase.rpc('schedule_interview', {
      p_app: v.application_id,
      p_title: v.title,
      p_mode: v.mode,
      p_starts: v.starts_at,
      p_ends: v.ends_at,
      p_place: v.place,
      p_instructions: v.instructions,
      p_participants: v.participants,
    }),
  )

const WITH_DETAILS =
  '*, interview_participants(user_id, profiles:user_id(full_name)), applications(id, jobs(title), profiles:candidate_id(full_name))'

export const listOrgInterviews = (orgId) =>
  run(supabase.from('interviews').select(WITH_DETAILS).eq('organization_id', orgId).order('starts_at', { ascending: false }).limit(100))

export const listApplicationInterviews = (appId) =>
  run(
    supabase
      .from('interviews')
      .select('*, interview_participants(user_id, profiles:user_id(full_name)), interview_feedback(*, profiles:author_id(full_name))')
      .eq('application_id', appId)
      .order('starts_at', { ascending: false }),
  )

export const listMyInterviews = () =>
  run(
    supabase
      .from('interviews')
      .select('*, interview_participants(profiles:user_id(full_name)), applications(jobs(title, organizations(name)))')
      .order('starts_at'),
  )

export const updateInterview = (id, fields) => run(supabase.from('interviews').update(fields).eq('id', id))

export const saveFeedback = (interviewId, userId, values) =>
  run(
    supabase
      .from('interview_feedback')
      .upsert({ interview_id: interviewId, author_id: userId, ...values }, { onConflict: 'interview_id,author_id' }),
  )
