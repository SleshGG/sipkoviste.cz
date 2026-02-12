import { createClient } from './client'

const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

function validateImageFile(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ext || !ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    return 'Povolené formáty: JPG, PNG, WebP.'
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Neplatný typ souboru. Povolené: JPG, PNG, WebP.'
  }
  if (file.size > MAX_FILE_SIZE) {
    return `Soubor je příliš velký. Max velikost: ${MAX_FILE_SIZE / 1024 / 1024} MB.`
  }
  if (file.size === 0) return 'Soubor je prázdný.'
  return null
}

export async function uploadProductImage(file: File): Promise<{ url?: string; error?: string }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Musíte být přihlášeni' }
  }

  const validateErr = validateImageFile(file)
  if (validateErr) return { error: validateErr }

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

  return { url: publicUrl }
}
