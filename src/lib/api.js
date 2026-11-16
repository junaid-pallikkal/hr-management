import { friendly } from './errors'

// Waits for a Supabase call. Returns the data, or throws an error with a plain-language message.
export async function run(query) {
  const { data, error } = await query
  if (error) throw new Error(friendly(error))
  return data
}
