import { supabase } from '../lib/supabase'
import { run } from '../lib/api'

export const listMembers = (orgId) =>
  run(
    supabase
      .from('organization_members')
      .select('*, profiles:user_id(full_name, email, avatar_path)')
      .eq('organization_id', orgId)
      .order('joined_at'),
  )

export const updateMember = (id, fields) => run(supabase.from('organization_members').update(fields).eq('id', id))

export const removeMember = (id) => run(supabase.from('organization_members').delete().eq('id', id))

export const listInvitations = (orgId) =>
  run(
    supabase
      .from('invitations')
      .select('*')
      .eq('organization_id', orgId)
      .in('status', ['pending', 'expired'])
      .order('created_at', { ascending: false }),
  )

async function hashToken(token) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const linkFor = (token) => `${window.location.origin}/invite/${token}`

// Returns the link to send to the invited person. Only a hash of the token is stored.
export async function createInvitation(orgId, userId, email, role) {
  const token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '')
  await run(
    supabase.from('invitations').insert({
      organization_id: orgId,
      email: email.trim().toLowerCase(),
      role,
      token_hash: await hashToken(token),
      invited_by: userId,
    }),
  )
  return linkFor(token)
}

// A new link for an existing invitation (the old link stops working).
export async function renewInvitation(id) {
  const token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '')
  await run(
    supabase
      .from('invitations')
      .update({
        token_hash: await hashToken(token),
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      })
      .eq('id', id),
  )
  return linkFor(token)
}

export const revokeInvitation = (id) => run(supabase.from('invitations').update({ status: 'revoked' }).eq('id', id))

export async function getInviteInfo(token) {
  const rows = await run(supabase.rpc('invite_info', { p_token: token }))
  return rows[0] || null
}

export const acceptInvitation = (token) => run(supabase.rpc('accept_invitation', { p_token: token }))
