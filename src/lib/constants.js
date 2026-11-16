export const EMPLOYMENT_TYPES = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  temporary: 'Temporary',
}
export const WORK_MODES = { onsite: 'On-site', hybrid: 'Hybrid', remote: 'Remote' }
export const EXPERIENCE_LEVELS = {
  entry: 'Entry',
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
  lead: 'Lead',
  executive: 'Executive',
}
export const JOB_STATUSES = {
  draft: 'Draft',
  published: 'Published',
  paused: 'Paused',
  closed: 'Closed',
  archived: 'Archived',
}
export const APPLICATION_STATUSES = {
  applied: 'Applied',
  screening: 'Screening',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  offered: 'Offered',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}
export const PIPELINE_COLUMNS = ['applied', 'screening', 'shortlisted', 'interview', 'offered', 'hired', 'rejected']
export const ORG_STATUSES = { pending: 'Pending', verified: 'Verified', rejected: 'Rejected', suspended: 'Suspended' }
export const MEMBER_ROLES = { org_admin: 'Admin', hr_manager: 'HR Manager', recruiter: 'Recruiter' }
export const INTERVIEW_MODES = { in_person: 'In person', phone: 'Phone', video: 'Video' }
export const INTERVIEW_STATUSES = {
  scheduled: 'Scheduled',
  completed: 'Done',
  cancelled: 'Cancelled',
  no_show: 'No show',
}
export const RECOMMENDATIONS = {
  strong_yes: 'Strong yes',
  yes: 'Yes',
  neutral: 'Not sure',
  no: 'No',
  strong_no: 'Strong no',
}
export const ORG_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AED', 'CAD', 'AUD']
export const SALARY_PERIODS = { year: 'per year', month: 'per month', hour: 'per hour' }
export const DOC_TYPES = ['Registration certificate', 'Tax number', 'Address proof', 'Other']
export const NOTIFICATION_TYPES = {
  application_received: 'New application',
  application_status_changed: 'Application updates',
  interview_scheduled: 'Interview scheduled',
  interview_updated: 'Interview changed',
  interview_cancelled: 'Interview cancelled',
  message_received: 'New message',
  team_member_joined: 'New team member',
  organization_verified: 'Organization approved',
  organization_rejected: 'Organization not approved',
  organization_submitted: 'New organization to review',
}

export const TONES = {
  applied: 'muted',
  screening: 'primary',
  shortlisted: 'primary',
  interview: 'warning',
  offered: 'success',
  hired: 'success',
  rejected: 'danger',
  withdrawn: 'muted',
  draft: 'muted',
  published: 'success',
  paused: 'warning',
  closed: 'danger',
  archived: 'muted',
  pending: 'warning',
  verified: 'success',
  suspended: 'danger',
  scheduled: 'primary',
  completed: 'success',
  cancelled: 'danger',
  no_show: 'danger',
}

export const toOptions = (map) => Object.entries(map).map(([value, label]) => ({ value, label }))
