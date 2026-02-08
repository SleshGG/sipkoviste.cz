'use server'

import { createClient } from './server'
import { revalidatePath } from 'next/cache'
import {
  canUserRateProfile,
  getExistingReview,
  getFavoriteProductIds,
  getConfirmedSale,
} from './database'
import type { ProductInsert, MessageInsert } from './types'

// ============ AUTH ACTIONS ============

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function validateAuthInput(email: string, password: string): string | null {
  const e = email?.trim()
  const p = password?.trim()
  if (!e || !p) return 'Vyplňte e-mail a heslo.'
  if (!EMAIL_REGEX.test(e)) return 'Zadejte platnou e-mailovou adresu.'
  if (p.length < 8) return 'Heslo musí mít alespoň 8 znaků.'
  return null
}

export async function signUp(email: string, password: string, name: string) {
  const err = validateAuthInput(email, password)
  if (err) return { error: err }
  const trimmedName = name?.trim()
  if (!trimmedName || trimmedName.length < 2) return { error: 'Jméno musí mít alespoň 2 znaky.' }

  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password: password.trim(),
    email,
    password,
    options: {
      emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || 
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/`,
      data: {
        name: trimmedName,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function signIn(email: string, password: string) {
  const err = validateAuthInput(email, password)
  if (err) return { error: err }

  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password.trim(),
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  return { data }
}

export async function signOut() {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

// ============ PRODUCT ACTIONS ============

export async function createProductAction(product: Omit<ProductInsert, 'seller_id'>) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Musíte být přihlášeni' }
  }

  const name = product.name?.trim()
  if (!name || name.length < 2) return { error: 'Název inzerátu musí mít alespoň 2 znaky.' }
  const price = Number(product.price)
  if (Number.isNaN(price) || price < 0) return { error: 'Cena musí být nezáporné číslo.' }
  if (price > 99_999_999) return { error: 'Cena je příliš vysoká.' }

  const { data, error } = await supabase
    .from('products')
    .insert({ ...product, name, price, seller_id: user.id })
    .select()
    .single()

  if (error) {
    console.error('Error creating product:', error)
    const message = error.message || 'Nepodařilo se vytvořit inzerát'
    return { error: message }
  }

  revalidatePath('/marketplace')
  revalidatePath('/dashboard')
  return { data }
}

export async function updateProductAction(id: string, updates: Partial<ProductInsert>) {
  if (!UUID_REGEX.test(id)) return { error: 'Neplatné ID inzerátu.' }
  const { seller_id: _omit, ...safeUpdates } = updates as Partial<ProductInsert> & { seller_id?: string }
  if (safeUpdates.name !== undefined) {
    const t = safeUpdates.name.trim()
    if (t.length < 2) return { error: 'Název musí mít alespoň 2 znaky.' }
    if (t.length > 200) return { error: 'Název je příliš dlouhý.' }
    safeUpdates.name = t
  }
  if (safeUpdates.price !== undefined) {
    const p = Number(safeUpdates.price)
    if (Number.isNaN(p) || p < 0 || p > 99_999_999) return { error: 'Neplatná cena.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Musíte být přihlášeni' }

  const { data, error } = await supabase
    .from('products')
    .update(safeUpdates)
    .eq('id', id)
    .eq('seller_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating product:', error)
    return { error: 'Nepodařilo se aktualizovat inzerát' }
  }

  revalidatePath('/marketplace')
  revalidatePath('/dashboard')
  revalidatePath(`/product/${id}`)
  return { data }
}

export async function deleteProductAction(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Musíte být přihlášeni' }
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('seller_id', user.id) // Ensure user owns the product

  if (error) {
    console.error('Error deleting product:', error)
    return { error: 'Nepodařilo se smazat inzerát' }
  }

  revalidatePath('/marketplace')
  revalidatePath('/dashboard')
  return { success: true }
}

// ============ MESSAGE ACTIONS ============

export async function sendMessageAction(message: Omit<MessageInsert, 'sender_id'>) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Musíte být přihlášeni' }
  }

  const text = message.text?.trim()
  if (!text || text.length < 1) return { error: 'Zpráva nesmí být prázdná.' }
  if (text.length > 5000) return { error: 'Zpráva je příliš dlouhá.' }
  if (!UUID_REGEX.test(message.receiver_id) || !UUID_REGEX.test(message.product_id)) {
    return { error: 'Neplatný příjemce nebo produkt.' }
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({ ...message, text, sender_id: user.id })
    .select()
    .single()

  if (error) {
    console.error('Error sending message:', error)
    return { error: 'Nepodařilo se odeslat zprávu' }
  }

  revalidatePath('/messages')
  return { data }
}

export async function markMessagesAsReadAction(senderId: string, productId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Musíte být přihlášeni' }
  }

  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('receiver_id', user.id)
    .eq('sender_id', senderId)
    .eq('product_id', productId)

  if (error) {
    console.error('Error marking messages as read:', error)
    return { error: 'Nepodařilo se označit zprávy jako přečtené' }
  }

  revalidatePath('/messages')
  return { success: true }
}

// ============ REVIEWS ============

/** Odešle recenzi. Hodnotit může jen uživatel, který s prodejcem vedl konverzaci o daném inzerátu. */
export async function submitReviewAction(params: {
  product_id: string
  profile_id: string
  rating: number
  comment?: string | null
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Musíte být přihlášeni' }
  }

  const { product_id, profile_id, rating, comment } = params
  if (rating < 1 || rating > 5) {
    return { error: 'Hodnocení musí být 1–5' }
  }

  const can = await canUserRateProfile(product_id, user.id, profile_id)
  if (!can.ok) {
    return { error: can.error }
  }

  const existing = await getExistingReview(user.id, profile_id, product_id)
  if (existing) {
    return { error: 'Toho prodejce jste za tento inzerát již ohodnotili.' }
  }

  const { error } = await supabase.from('reviews').insert({
    author_id: user.id,
    profile_id,
    product_id,
    rating,
    comment: comment ?? null,
  })

  if (error) {
    console.error('Error submitting review:', error)
    return { error: error.message }
  }

  revalidatePath('/marketplace')
  revalidatePath('/dashboard')
  revalidatePath(`/product/${product_id}`)
  return {}
}

// ============ CONFIRMED SALES ============

/** Prodej potvrdí jen prodejce. otherUserId = kupující (druhý účastník), productSellerId = seller_id produktu. */
export async function confirmSaleAction(
  productId: string,
  otherUserId: string,
  productSellerId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Musíte být přihlášeni' }
  }

  if (user.id !== productSellerId) {
    return { error: 'Prodej může potvrdit pouze prodejce.' }
  }

  const buyerId = otherUserId
  const sellerId = productSellerId
  if (buyerId === sellerId) {
    return { error: 'Kupující a prodejce musí být různé osoby.' }
  }

  const { error } = await supabase.from('confirmed_sales').insert({
    product_id: productId,
    buyer_id: buyerId,
    seller_id: sellerId,
    confirmed_by: user.id,
  })

  if (error) {
    if (error.code === '23505') return {} // už potvrzeno (duplicate)
    console.error('Error confirming sale:', error)
    if (error.code === '42501' || error.message?.includes('row-level security')) {
      return { error: 'Nemáte oprávnění potvrdit prodej. Ověřte, že jste přihlášeni jako prodejce.' }
    }
    if (error.code === '23503') {
      return { error: 'Prodej nelze potvrdit (chybí údaje o uživateli nebo produktu).' }
    }
    if (error.message?.includes('does not exist') || error.code === '42P01') {
      return { error: 'Tabulka potvrzených prodejů neexistuje. Spusťte v Supabase skript scripts/005_confirmed_sales.sql' }
    }
    return { error: error.message || 'Nepodařilo se potvrdit prodej' }
  }

  await supabase
    .from('products')
    .update({ sold_at: new Date().toISOString() })
    .eq('id', productId)
    .eq('seller_id', user.id)

  revalidatePath('/messages')
  revalidatePath('/marketplace')
  revalidatePath('/')
  revalidatePath(`/product/${productId}`)
  return {}
}

/** Stav prodeje a hodnocení: confirmed = je potvrzený prodej, canReview = může aktuální uživatel ohodnotit druhého, alreadyReviewed = už ho ohodnotil. */
export async function getSaleStatusAction(
  productId: string,
  otherUserId: string,
  productSellerId: string
): Promise<{ confirmed: boolean; canReview: boolean; alreadyReviewed: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { confirmed: false, canReview: false, alreadyReviewed: false }
  }

  const buyerId = productSellerId === user.id ? otherUserId : user.id
  const sellerId = productSellerId
  const sale = await getConfirmedSale(productId, buyerId, sellerId)
  const confirmed = !!sale

  const existing = await getExistingReview(user.id, otherUserId, productId)
  const alreadyReviewed = !!existing
  const canResult = await canUserRateProfile(productId, user.id, otherUserId)
  const canReview = canResult.ok && !alreadyReviewed

  return { confirmed, canReview, alreadyReviewed }
}

/** Pro seznam koupených položek: vrací pro každý product_id, zda už aktuální uživatel (kupující) ohodnotil prodejce. */
export async function getBulkAlreadyReviewedAction(
  items: { product_id: string; seller_id: string }[]
): Promise<Record<string, boolean>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || items.length === 0) return {}

  const result: Record<string, boolean> = {}
  await Promise.all(
    items.map(async (item) => {
      const existing = await getExistingReview(user.id, item.seller_id, item.product_id)
      result[item.product_id] = !!existing
    })
  )
  return result
}

// ============ FAVORITES ============

export async function getFavoriteProductIdsAction(): Promise<{ ids: string[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ids: [] }
  const ids = await getFavoriteProductIds(user.id)
  return { ids }
}

export async function toggleFavoriteAction(productId: string): Promise<{ isFavorite: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { isFavorite: false, error: 'Musíte být přihlášeni' }
  }

  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId)
    if (error) {
      console.error('Error removing favorite:', error)
      return { isFavorite: true, error: error.message }
    }
    revalidatePath('/marketplace')
    revalidatePath(`/product/${productId}`)
    return { isFavorite: false }
  }

  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: user.id, product_id: productId })
  if (error) {
    console.error('Error adding favorite:', error)
    return { isFavorite: false, error: error.message }
  }
  revalidatePath('/marketplace')
  revalidatePath(`/product/${productId}`)
  return { isFavorite: true }
}

// ============ PROFILE ACTIONS ============

export async function updateProfileAction(updates: { name?: string; avatar_url?: string }) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Musíte být přihlášeni' }
  }

  const toUpdate: { name?: string; avatar_url?: string } = { ...updates }
  if (updates.name !== undefined) {
    const name = updates.name.trim()
    if (name.length === 1) return { error: 'Jméno musí mít alespoň 2 znaky.' }
    if (name.length > 100) return { error: 'Jméno je příliš dlouhé.' }
    toUpdate.name = name
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(toUpdate)
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    return { error: 'Nepodařilo se aktualizovat profil' }
  }

  revalidatePath('/dashboard')
  return { data }
}

// ============ IMAGE UPLOAD ============

/** Server action: nahraje více obrázků z FormData a vrátí jejich public URL. */
export async function uploadProductImagesAction(formData: FormData): Promise<{ urls?: string[]; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Musíte být přihlášeni' }
  }

  const files = formData.getAll('images') as File[]
  if (!files?.length) {
    return { error: 'Nebyl vybrán žádný obrázek' }
  }

  const urls: string[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (!file?.size) continue

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${user.id}/${Date.now()}-${i}.${fileExt}`

    const buffer = Buffer.from(await file.arrayBuffer())

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, buffer, {
        contentType: file.type || `image/${fileExt}`,
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Error uploading image:', error)
      return { error: `Nepodařilo se nahrát obrázek: ${error.message}` }
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path)

    urls.push(publicUrl)
  }

  if (urls.length === 0) {
    return { error: 'Žádný obrázek se nepodařilo nahrát' }
  }

  return { urls }
}

export async function uploadProductImage(formData: FormData) {
  const result = await uploadProductImagesAction(formData)
  if (result.error) return { error: result.error }
  return { url: result.urls![0] }
}
