import { supabase } from '../lib/supabase'
import { friendly } from '../lib/errors'

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(friendly(error))
}

// Returns true when the person must confirm their email before logging in.
export async function signUp({ email, password, fullName, accountType }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, account_type: accountType } },
  })
  if (error) throw new Error(friendly(error))
  if (data.user && data.user.identities?.length === 0) throw new Error('This email already has an account. Try logging in.')
  return !data.session
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

// Calls back with the session, and with 'PASSWORD_RECOVERY' when a reset link is opened.
export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => callback(session, event))
  return () => data.subscription.unsubscribe()
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function sendResetEmail(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
  if (error) throw new Error(friendly(error))
}

export async function setNewPassword(password) {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw new Error(friendly(error))
}
