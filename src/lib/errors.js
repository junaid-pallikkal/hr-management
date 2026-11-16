const KNOWN = {
  ORG_NOT_VERIFIED: 'Your organization is not approved yet, so jobs cannot be published.',
  ALREADY_APPLIED: 'You already applied to this job.',
  JOB_CLOSED: 'This job is no longer open.',
  BAD_RESUME: 'Please choose one of your resumes.',
  NOT_ALLOWED: 'You do not have permission to do that.',
  LAST_ADMIN: 'Every organization needs at least one admin.',
  INTERVIEWER_BUSY: 'One of the interviewers is busy at that time.',
  INVITE_INVALID: 'This invitation is not valid or has expired.',
  INVITE_WRONG_EMAIL: 'This invitation was sent to a different email address.',
  INVITE_WRONG_ACCOUNT: 'This email belongs to a job seeker account. Please use another email.',
  NOT_FOUND: 'We could not find that.',
  'Invalid login credentials': 'Wrong email or password.',
  'Email not confirmed': 'Please confirm your email first. Check your inbox.',
  'User already registered': 'This email already has an account. Try logging in.',
  'duplicate key': 'That already exists.',
  'Failed to fetch': 'No connection. Please check your internet and try again.',
  'Password should be at least': 'Password must be at least 6 characters.',
}

const BY_CODE = {
  over_email_send_rate_limit: 'Too many emails were sent. Please wait a few minutes and try again.',
  over_request_rate_limit: 'Too many tries. Please wait a minute and try again.',
  email_address_invalid: 'Please use a real email address.',
  email_not_confirmed: 'Please confirm your email first. Check your inbox.',
  invalid_credentials: 'Wrong email or password.',
  user_already_exists: 'This email already has an account. Try logging in.',
  signup_disabled: 'Sign up is switched off right now.',
  weak_password: 'Choose a stronger password.',
  unexpected_failure: 'We could not send the confirmation email. Please try again later.',
}

export function friendly(error) {
  if (BY_CODE[error?.code]) return BY_CODE[error.code]
  const text = `${error?.message || ''} ${error?.details || ''}`
  if (/load failed|networkerror|network request failed|fetch/i.test(text)) return KNOWN['Failed to fetch']
  if (/rate limit/i.test(text)) return BY_CODE.over_email_send_rate_limit
  if (/sending (confirmation|recovery|magic)? ?email/i.test(text)) return BY_CODE.unexpected_failure
  for (const key of Object.keys(KNOWN)) {
    if (text.includes(key)) return KNOWN[key]
  }
  return 'Something went wrong. Please try again.'
}
