import { supabase } from '../lib/supabase'
import { run } from '../lib/api'

export const parseSkills = (text) =>
  [...new Set(text.split(',').map((s) => s.trim()).filter(Boolean))]

// Finds the skills by name and adds the ones that do not exist yet. Returns their ids.
export async function ensureSkills(names) {
  if (!names.length) return []
  const all = await run(supabase.from('skills').select('id, name'))
  const byName = new Map(all.map((s) => [s.name.toLowerCase(), s.id]))
  const missing = names.filter((n) => !byName.has(n.toLowerCase()))
  if (missing.length) {
    const added = await run(supabase.from('skills').insert(missing.map((name) => ({ name }))).select('id, name'))
    added.forEach((s) => byName.set(s.name.toLowerCase(), s.id))
  }
  return names.map((n) => byName.get(n.toLowerCase()))
}
