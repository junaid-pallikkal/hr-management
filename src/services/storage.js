import { supabase } from '../lib/supabase'

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const RESUME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
export const DOC_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

// Returns a plain-language problem, or '' when the file is fine.
export function checkFile(file, types, maxMb) {
  if (!types.includes(file.type)) return 'This file type is not allowed.'
  if (file.size > maxMb * 1024 * 1024) return `The file is too big. Maximum is ${maxMb} MB.`
  return ''
}

export async function uploadFile(bucket, folder, file) {
  const clean = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${folder}/${Date.now()}-${clean}`
  const { error } = await supabase.storage.from(bucket).upload(path, file)
  if (error) throw new Error('Could not upload the file. Please try again.')
  return path
}

export async function removeFile(bucket, path) {
  await supabase.storage.from(bucket).remove([path])
}

export function publicUrl(bucket, path) {
  if (!path) return ''
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

export async function signedUrl(bucket, path) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 300)
  if (error) throw new Error('Could not open the file. Please try again.')
  return data.signedUrl
}

export async function openPrivateFile(bucket, path) {
  window.open(await signedUrl(bucket, path), '_blank', 'noopener')
}
