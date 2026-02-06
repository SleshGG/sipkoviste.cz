import { createClient } from './client'

export async function uploadProductImage(file: File): Promise<{ url?: string; error?: string }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Musite byt prihlaseni' }
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('[v0] Error uploading image:', error)
    return { error: `Nepodarilo se nahrat obrazek: ${error.message}` }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(data.path)

  console.log('[v0] Image uploaded:', publicUrl)
  return { url: publicUrl }
}
