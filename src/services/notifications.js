import { supabase } from '../lib/supabase'
import { run } from '../lib/api'

export const listNotifications = (limit = 50) =>
  run(supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(limit))

export async function unreadCount() {
  const { count, error } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('is_read', false)
  if (error) return 0
  return count || 0
}

export const markRead = (id) => run(supabase.from('notifications').update({ is_read: true }).eq('id', id))

export const markAllRead = () => run(supabase.from('notifications').update({ is_read: true }).eq('is_read', false))

export const removeNotification = (id) => run(supabase.from('notifications').delete().eq('id', id))

export const getPreferences = (userId) => run(supabase.from('notification_preferences').select('*').eq('user_id', userId))

export const savePreference = (userId, type, values) =>
  run(supabase.from('notification_preferences').upsert({ user_id: userId, type, ...values }, { onConflict: 'user_id,type' }))

// Live updates. Returns a function that stops listening.
export function subscribeToNotifications(userId, onChange) {
  const channel = supabase
    .channel(`notifications-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, onChange)
    .subscribe()
  return () => supabase.removeChannel(channel)
}
