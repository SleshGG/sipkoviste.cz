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

/** Ověří heslo a změní ho (volá se z klienta po ověření). */
export async function updatePasswordAction(currentPassword: string, newPassword: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: 'Nejste přihlášeni.' }
  const p = newPassword?.trim()
  if (!p || p.length < 8) return { error: 'Nové heslo musí mít alespoň 8 znaků.' }
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword.trim(),
  })
  if (signInError) return { error: 'Aktuální heslo není správné.' }
  const { error: updateError } = await supabase.auth.updateUser({ password: p })
  if (updateError) return { error: updateError.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

/** Deaktivuje účet (nastaví metadata a odhlásí). */
export async function deactivateAccountAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nejste přihlášeni.' }
  const { error } = await supabase.auth.updateUser({
    data: { ...user.user_metadata, disabled: true },
  })
  if (error) return { error: error.message }
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  return { success: true }
}

/** Smaže účet a všechna data. Pro smazání z Auth je potřeba SUPABASE_SERVICE_ROLE_KEY. */
export async function deleteAccountAction(password: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nejste přihlášeni.' }
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: password.trim(),
  })
  if (signInError) return { error: 'Heslo není správné.' }
  const uid = user.id
  await supabase.from('favorites').delete().eq('user_id', uid)
  await supabase.from('confirmed_sales').delete().or(`buyer_id.eq.${uid},seller_id.eq.${uid}`)
  await supabase.from('reviews').delete().or(`author_id.eq.${uid},profile_id.eq.${uid}`)
  await supabase.from('messages').delete().or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
  await supabase.from('products').delete().eq('seller_id', uid)
  const { error: profileError } = await supabase.from('profiles').delete().eq('id', uid)
  if (profileError) return { error: 'Nepodařilo se smazat profil. ' + profileError.message }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (key) {
    const { createClient: createAdmin } = await import('@supabase/supabase-js')
    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      key,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    await admin.auth.admin.deleteUser(uid)
  }
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  return { success: true }
}

// ============ PRODUCT ACTIONS ============

const VALID_CATEGORIES = ['steel-darts', 'soft-darts', 'dartboards', 'accessories'] as const
const VALID_CONDITIONS = ['Nové', 'Jako nové', 'Dobré', 'Uspokojivé'] as const

export async function createProductAction(product: Omit<ProductInsert, 'seller_id'>) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Musíte být přihlášeni' }
  }

  const name = product.name?.trim()
  if (!name || name.length < 2) return { error: 'Název inzerátu musí mít alespoň 2 znaky.' }
  if (name.length > 200) return { error: 'Název je příliš dlouhý.' }
  const price = Number(product.price)
  if (Number.isNaN(price) || price < 0) return { error: 'Cena musí být nezáporné číslo.' }
  if (price > 99_999_999) return { error: 'Cena je příliš vysoká.' }
  if (!VALID_CATEGORIES.includes(product.category as (typeof VALID_CATEGORIES)[number])) {
    return { error: 'Neplatná kategorie.' }
  }
  if (!VALID_CONDITIONS.includes(product.condition as (typeof VALID_CONDITIONS)[number])) {
    return { error: 'Neplatný stav.' }
  }
  const brand = product.brand?.trim()
  if (!brand || brand.length < 1) return { error: 'Zadejte značku.' }
  if (brand.length > 100) return { error: 'Značka je příliš dlouhá.' }
  if (product.description && product.description.length > 5000) {
    return { error: 'Popis je příliš dlouhý.' }
  }

  const safeProduct = {
    ...product,
    name,
    price,
    brand,
    description: product.description?.trim().slice(0, 5000) ?? null,
  }

  const { data, error } = await supabase
    .from('products')
    .insert({ ...safeProduct, seller_id: user.id })
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
  if (safeUpdates.category !== undefined && !VALID_CATEGORIES.includes(safeUpdates.category as (typeof VALID_CATEGORIES)[number])) {
    return { error: 'Neplatná kategorie.' }
  }
  if (safeUpdates.condition !== undefined && !VALID_CONDITIONS.includes(safeUpdates.condition as (typeof VALID_CONDITIONS)[number])) {
    return { error: 'Neplatný stav.' }
  }
  if (safeUpdates.brand !== undefined) {
    const b = safeUpdates.brand.trim()
    if (b.length < 1) return { error: 'Značka nesmí být prázdná.' }
    if (b.length > 100) return { error: 'Značka je příliš dlouhá.' }
    safeUpdates.brand = b
  }
  if (safeUpdates.description !== undefined && safeUpdates.description !== null && safeUpdates.description.length > 5000) {
    return { error: 'Popis je příliš dlouhý.' }
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

/** Zvýší počet zobrazení inzerátu (volá se při zobrazení detailu). */
export async function incrementProductViewAction(productId: string) {
  if (!UUID_REGEX.test(productId)) return
  const supabase = await createClient()
  const { error } = await supabase.rpc('increment_product_view_count', { pid: productId })
  if (error) console.error('incrementProductViewAction:', error)
}

export async function deleteProductAction(id: string) {
  if (!UUID_REGEX.test(id)) return { error: 'Neplatné ID inzerátu.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Musíte být přihlášeni' }

  const [messagesRes, salesRes] = await Promise.all([
    supabase.from('messages').select('id').eq('product_id', id).limit(1),
    supabase.from('confirmed_sales').select('id').eq('product_id', id).limit(1),
  ])
  if ((messagesRes.data?.length ?? 0) > 0 || (salesRes.data?.length ?? 0) > 0) {
    return { error: 'Inzerát nelze smazat – má zprávy nebo byl prodán. Můžete ho skrýt z tržiště.' }
  }

  const { data: deleted, error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('seller_id', user.id)
    .select('id')
    .maybeSingle()

  if (error) {
    const code = (error as { code?: string }).code
    if (code === '23503') {
      return { error: 'Inzerát nelze smazat – má vazby (zprávy nebo recenze). V Supabase SQL Editor spusť jednou skript 009_cascade_product_delete.sql, poté bude mazání fungovat.' }
    }
    return { error: error.message || 'Nepodařilo se smazat inzerát.' }
  }

  if (!deleted) {
    return { error: 'Inzerát nebyl nalezen nebo k němu nemáte oprávnění.' }
  }

  revalidatePath('/marketplace')
  revalidatePath('/dashboard')
  revalidatePath('/profile/me')
  revalidatePath('/profile')
  return { success: true }
}

// ============ MESSAGE ACTIONS ============

export async function sendMessageAction(message: Omit<MessageInsert, 'sender_id'> & { product_id?: string | null }) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Musíte být přihlášeni' }
  }

  const text = message.text?.trim()
  if (!text || text.length < 1) return { error: 'Zpráva nesmí být prázdná.' }
  if (text.length > 5000) return { error: 'Zpráva je příliš dlouhá.' }
  if (!UUID_REGEX.test(message.receiver_id)) return { error: 'Neplatný příjemce.' }
  const productId = message.product_id ?? null
  if (productId !== null && !UUID_REGEX.test(productId)) return { error: 'Neplatný produkt.' }

  const insertData = {
    receiver_id: message.receiver_id,
    product_id: productId,
    text,
    sender_id: user.id,
  }

  const { data, error } = await supabase
    .from('messages')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('Error sending message:', error)
    return { error: 'Nepodařilo se odeslat zprávu' }
  }

  revalidatePath('/messages')
  return { data }
}

export async function markMessagesAsReadAction(senderId: string, productId: string | null) {
  if (!UUID_REGEX.test(senderId)) return { error: 'Neplatné ID.' }
  if (productId !== null && !UUID_REGEX.test(productId)) return { error: 'Neplatné ID.' }
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Musíte být přihlášeni' }
  }

  let query = supabase
    .from('messages')
    .update({ is_read: true })
    .eq('receiver_id', user.id)
    .eq('sender_id', senderId)
  if (productId === null) {
    query = query.is('product_id', null)
  } else {
    query = query.eq('product_id', productId)
  }
  const { error } = await query

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
  if (!UUID_REGEX.test(product_id) || !UUID_REGEX.test(profile_id)) {
    return { error: 'Neplatné ID produktu nebo profilu.' }
  }
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
  if (!UUID_REGEX.test(productId) || !UUID_REGEX.test(otherUserId) || !UUID_REGEX.test(productSellerId)) {
    return { error: 'Neplatné ID.' }
  }
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

  const { data: existingSale } = await supabase
    .from('confirmed_sales')
    .select('id')
    .eq('product_id', productId)
    .limit(1)
    .maybeSingle()

  if (existingSale) {
    return { error: 'Inzerát byl již prodán jinému kupujícímu.' }
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

/** Stav prodeje a hodnocení: confirmed = je potvrzený prodej, canReview = může aktuální uživatel ohodnotit druhého, alreadyReviewed = už ho ohodnotil, productSoldToOther = inzerát byl prodán jinému kupujícímu. */
export async function getSaleStatusAction(
  productId: string,
  otherUserId: string,
  productSellerId: string
): Promise<{ confirmed: boolean; canReview: boolean; alreadyReviewed: boolean; productSoldToOther?: boolean; error?: string }> {
  if (!UUID_REGEX.test(productId) || !UUID_REGEX.test(otherUserId) || !UUID_REGEX.test(productSellerId)) {
    return { confirmed: false, canReview: false, alreadyReviewed: false }
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { confirmed: false, canReview: false, alreadyReviewed: false }
  }

  const buyerId = productSellerId === user.id ? otherUserId : user.id
  const sellerId = productSellerId
  const sale = await getConfirmedSale(productId, buyerId, sellerId)
  const confirmed = !!sale

  const { data: anySale } = await supabase
    .from('confirmed_sales')
    .select('buyer_id')
    .eq('product_id', productId)
    .limit(1)
    .maybeSingle()

  const productSoldToOther = !!anySale && anySale.buyer_id !== otherUserId

  const existing = await getExistingReview(user.id, otherUserId, productId)
  const alreadyReviewed = !!existing
  const canResult = await canUserRateProfile(productId, user.id, otherUserId)
  const canReview = canResult.ok && !alreadyReviewed

  return { confirmed, canReview, alreadyReviewed, productSoldToOther }
}

/** Pro seznam koupených položek: vrací pro každý product_id, zda už aktuální uživatel (kupující) ohodnotil prodejce. */
export async function getBulkAlreadyReviewedAction(
  items: { product_id: string; seller_id: string }[]
): Promise<Record<string, boolean>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || items.length === 0) return {}

  const validItems = items.filter(
    (item) => UUID_REGEX.test(item.product_id) && UUID_REGEX.test(item.seller_id)
  )

  const result: Record<string, boolean> = {}
  await Promise.all(
    validItems.map(async (item) => {
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
  if (!UUID_REGEX.test(productId)) return { isFavorite: false, error: 'Neplatné ID inzerátu.' }
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

export async function updateProfileAction(updates: { name?: string; avatar_url?: string; show_online_status?: boolean }) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Musíte být přihlášeni' }
  }

  const toUpdate: { name?: string; avatar_url?: string; show_online_status?: boolean } = { ...updates }
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

/** Aktualizuje čas poslední aktivity (volá se z klienta při prohlížení stránek). */
export async function updateLastSeenAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nejste přihlášeni.' }
  await supabase
    .from('profiles')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', user.id)
  return { success: true }
}

// ============ IMAGE UPLOAD ============

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

    const validateErr = validateImageFile(file)
    if (validateErr) return { error: validateErr }

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
