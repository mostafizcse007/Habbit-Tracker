export function getAvatarUrl(path: string | null): string | null {
  if (!path) {
    return null
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")
  if (!supabaseUrl) {
    return null
  }
  return `${supabaseUrl}/storage/v1/object/public/avatars/${path}`
}
