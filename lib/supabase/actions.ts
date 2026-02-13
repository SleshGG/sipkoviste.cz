'use server'

import { createClient } from './server'
import { revalidatePath } from 'next/cache'
import {
  canUserRateProfile,
  getExistingReview,
  getFavoriteProductIds,
  getConfirmedSale,
  getProductById,
} from './database'
import type { ProductInsert, MessageInsert } from './types'
import { sendEmail, getUserEmail } from '@/lib/email'
import { getBuyIntentEmailHtml, getOfferEmailHtml, getOfferAcceptedEmailHtml, getCounterOfferEmailHtml } from '@/lib/email-templates'

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

/** Zkontroluje, zda byl v posledních 24h odeslán e-mail (buy/offer) od kupujícího prodejci pro daný produkt. */
async function hasRecentBuyOrOfferEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  senderId: string,
  receiverId: string,
  productId: string
): Promise<boolean> {
  // V dev režimu jen 1 minuta (pro snadnější testování), v produkci 24h
  const hours = process.env.NODE_ENV === 'development' ? 1 / 60 : 24
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('messages')
    .select('id')
    .eq('sender_id', senderId)
    .eq('receiver_id', receiverId)
    .eq('product_id', productId)
    .in('message_type', ['buy', 'offer'])
    .gte('created_at', since)
    .limit(1)
  return (data?.length ?? 0) > 0
}

/** Koupit – vytvoří zprávu, označí inzerát jako prodaný, pošle e-mail prodejci, přesměruje do chatu. */
export async function sendBuyIntentAction(
  productId: string,
  receiverId: string,
  productName: string,
  sellerName: string
): Promise<{ error?: string; data?: { id: string } }> {
  if (!UUID_REGEX.test(productId) || !UUID_REGEX.test(receiverId)) {
    return { error: 'Neplatné ID.' }
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Musíte být přihlášeni.' }
  if (user.id === receiverId) return { error: 'Nemůžete koupit vlastní inzerát.' }

  const { data: product } = await supabase
    .from('products')
    .select('id, sold_at')
    .eq('id', productId)
    .single()
  if (!product) return { error: 'Inzerát nenalezen.' }
  if (product.sold_at) return { error: 'Tento inzerát byl již prodán.' }

  const { data: existingSale } = await supabase
    .from('confirmed_sales')
    .select('id')
    .eq('product_id', productId)
    .limit(1)
    .maybeSingle()
  if (existingSale) return { error: 'Tento inzerát byl již prodán.' }

  const alreadySent = await hasRecentBuyOrOfferEmail(supabase, user.id, receiverId, productId)
  const { data: buyerProfile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
  const buyerName = buyerProfile?.name?.trim() || 'Kupující'
  const insertData = {
    receiver_id: receiverId,
    product_id: productId,
    text: `${buyerName} koupil tento produkt. Domluvte si prosím podrobnosti. Šipkobot`,
    sender_id: user.id,
    message_type: 'buy' as const,
  }
  const { data: msg, error } = await supabase
    .from('messages')
    .insert(insertData)
    .select('id')
    .single()

  if (error) {
    console.error('Error sending buy intent:', error)
    return { error: 'Nepodařilo se odeslat.' }
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Email] Koupit: alreadySent=', alreadySent, 'receiverId=', receiverId)
  }
  if (!alreadySent) {
    const sellerEmail = await getUserEmail(receiverId)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Email] Koupit: sellerEmail=', sellerEmail ?? 'NULL')
    }
    if (sellerEmail) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const chatUrl = `${siteUrl}/messages?to=${user.id}&product=${productId}`
      const html = getBuyIntentEmailHtml(sellerName, productName, chatUrl)
      if (process.env.NODE_ENV === 'development') {
        console.log('[Email] Koupit: volám sendEmail ->', sellerEmail)
      }
      await sendEmail(sellerEmail, `Někdo koupil: ${productName}`, html)
    } else if (process.env.NODE_ENV === 'development') {
      console.warn('[Email] Koupit: e-mail prodejce nenalezen – zkontroluj SUPABASE_SERVICE_ROLE_KEY')
    }
  } else if (process.env.NODE_ENV === 'development') {
    console.log('[Email] Koupit: e-mail přeskočen (alreadySent – v posledních 24h již byl odeslán buy/offer pro tento produkt)')
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!key || !url) {
    console.error('[Email] Koupit: chybí SUPABASE_SERVICE_ROLE_KEY – nelze označit inzerát jako prodaný')
    revalidatePath('/messages')
    return { error: 'Nepodařilo se označit inzerát jako prodaný. Zkontrolujte nastavení serveru (SUPABASE_SERVICE_ROLE_KEY).' }
  }
  const { createClient: createAdminClient } = await import('@supabase/supabase-js')
  const admin = createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error: updateErr } = await admin
    .from('products')
    .update({ sold_at: new Date().toISOString() })
    .eq('id', productId)
    .eq('seller_id', receiverId)
  if (updateErr) {
    console.error('[Email] Koupit: chyba při označení jako prodaný:', updateErr)
    revalidatePath('/messages')
    return { error: 'Zpráva odeslána, ale nepodařilo se označit inzerát jako prodaný. Zkuste to znovu nebo kontaktujte podporu.' }
  }
  const productForSale = await getProductById(productId)
  const { error: insertErr } = await admin.from('confirmed_sales').insert({
    product_id: productId,
    buyer_id: user.id,
    seller_id: receiverId,
    confirmed_by: user.id,
    sale_price: productForSale?.price ?? null,
  })
  if (insertErr) {
    console.error('[Email] Koupit: chyba při vytváření confirmed_sales:', insertErr)
  }

  revalidatePath('/messages')
  revalidatePath('/marketplace')
  revalidatePath('/')
  revalidatePath(`/product/${productId}`)
  revalidatePath(`/profile/${receiverId}`)
  return { data: msg }
}

/** Nabídnout cenu – vytvoří zprávu s nabídkou, pošle e-mail prodejci. */
export async function sendOfferAction(
  productId: string,
  receiverId: string,
  productName: string,
  sellerName: string,
  amount: number
): Promise<{ error?: string; data?: { id: string } }> {
  if (!UUID_REGEX.test(productId) || !UUID_REGEX.test(receiverId)) {
    return { error: 'Neplatné ID.' }
  }
  if (amount < 1 || amount > 999_999_999) return { error: 'Neplatná částka.' }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Musíte být přihlášeni.' }
  if (user.id === receiverId) return { error: 'Nemůžete nabídnout na vlastní inzerát.' }

  const alreadySent = await hasRecentBuyOrOfferEmail(supabase, user.id, receiverId, productId)
  const { data: buyerProfile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
  const buyerName = buyerProfile?.name?.trim() || 'Uživatel'
  const formatted = amount.toLocaleString('cs-CZ')
  const insertData = {
    receiver_id: receiverId,
    product_id: productId,
    text: `${buyerName} nabídl ${formatted} Kč. Šipkobot`,
    sender_id: user.id,
    message_type: 'offer' as const,
    offer_amount: amount,
    offer_status: 'pending' as const,
  }
  const { data: msg, error } = await supabase
    .from('messages')
    .insert(insertData)
    .select('id')
    .single()

  if (error) {
    console.error('Error sending offer:', error)
    return { error: 'Nepodařilo se odeslat nabídku.' }
  }

  if (!alreadySent) {
    const sellerEmail = await getUserEmail(receiverId)
    if (sellerEmail) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const chatUrl = `${siteUrl}/messages?to=${user.id}&product=${productId}`
      const html = getOfferEmailHtml(sellerName, productName, formatted, chatUrl)
      await sendEmail(sellerEmail, `Nabídka ${formatted} Kč: ${productName}`, html)
    } else if (process.env.NODE_ENV === 'development') {
      console.warn('[Email] Nabídka: e-mail prodejce nenalezen')
    }
  }

  revalidatePath('/messages')
  return { data: msg }
}

/** Poslat dotaz – vytvoří zprávu bez e-mailu. */
export async function sendQuestionAction(
  productId: string,
  receiverId: string,
  text: string
): Promise<{ error?: string; data?: { id: string } }> {
  const trimmed = text?.trim()
  if (!trimmed || trimmed.length < 1) return { error: 'Zpráva nesmí být prázdná.' }
  if (trimmed.length > 5000) return { error: 'Zpráva je příliš dlouhá.' }
  if (!UUID_REGEX.test(productId) || !UUID_REGEX.test(receiverId)) {
    return { error: 'Neplatné ID.' }
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Musíte být přihlášeni.' }

  const insertData = {
    receiver_id: receiverId,
    product_id: productId,
    text: trimmed,
    sender_id: user.id,
    message_type: 'question' as const,
  }
  const { data: msg, error } = await supabase
    .from('messages')
    .insert(insertData)
    .select('id')
    .single()

  if (error) {
    console.error('Error sending question:', error)
    return { error: 'Nepodařilo se odeslat zprávu.' }
  }

  revalidatePath('/messages')
  return { data: msg }
}

/** Prodejce přijme nabídku – pošle e-mail kupujícímu. */
export async function acceptOfferAction(messageId: string): Promise<{ error?: string }> {
  if (!UUID_REGEX.test(messageId)) return { error: 'Neplatné ID zprávy.' }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Musíte být přihlášeni.' }

  const { data: msg, error: fetchErr } = await supabase
    .from('messages')
    .select('id, sender_id, receiver_id, product_id, offer_amount, offer_status, message_type')
    .eq('id', messageId)
    .single()

  if (fetchErr || !msg) return { error: 'Zpráva nenalezena.' }
  if (msg.receiver_id !== user.id) return { error: 'Tuto nabídku můžete přijmout pouze vy jako prodejce.' }
  if (msg.message_type !== 'offer') return { error: 'Tato zpráva není nabídka.' }
  if (msg.offer_status === 'accepted' || msg.offer_status === 'rejected') {
    return { error: 'Tato nabídka již byla zpracována.' }
  }

  const { error: updateErr } = await supabase
    .from('messages')
    .update({ offer_status: 'accepted' })
    .eq('id', messageId)

  if (updateErr) {
    console.error('Error accepting offer:', updateErr)
    return { error: 'Nepodařilo se přijmout nabídku.' }
  }

  const productId = msg.product_id
  const product = productId ? await getProductById(productId) : null
  const productSellerId = product?.seller_id

  let buyerId: string
  let sellerId: string
  if (productSellerId) {
    sellerId = productSellerId
    buyerId = user.id === productSellerId ? msg.sender_id : msg.receiver_id
  } else {
    buyerId = msg.sender_id
    sellerId = msg.receiver_id
  }

  if (productId && productSellerId) {
    const { data: productRow } = await supabase
      .from('products')
      .select('id, sold_at')
      .eq('id', productId)
      .single()
    const { data: existingSale } = await supabase
      .from('confirmed_sales')
      .select('id')
      .eq('product_id', productId)
      .limit(1)
      .maybeSingle()

    if (productRow && !productRow.sold_at && !existingSale) {
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (key && url) {
        const { createClient: createAdminClient } = await import('@supabase/supabase-js')
        const admin = createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
        await admin.from('products').update({ sold_at: new Date().toISOString() }).eq('id', productId).eq('seller_id', sellerId)
        await admin.from('confirmed_sales').insert({
          product_id: productId,
          buyer_id: buyerId,
          seller_id: sellerId,
          confirmed_by: user.id,
          sale_price: msg.offer_amount ?? null,
        })
      }
      revalidatePath('/marketplace')
      revalidatePath('/')
      revalidatePath(`/product/${productId}`)
      revalidatePath(`/profile/${productSellerId}`)
    }
  }

  const offerRecipientEmail = await getUserEmail(msg.sender_id)
  if (offerRecipientEmail && msg.product_id) {
    const product = await getProductById(msg.product_id)
    const productName = product?.name ?? 'produkt'
    const formatted = (msg.offer_amount ?? 0).toLocaleString('cs-CZ')
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const chatUrl = `${siteUrl}/messages?to=${user.id}&product=${msg.product_id}`
    const html = getOfferAcceptedEmailHtml(productName, formatted, chatUrl)
    await sendEmail(offerRecipientEmail, `Prodejce přijímá vaši nabídku: ${productName}`, html)
  }

  revalidatePath('/messages')
  return {}
}

/** Prodejce odmítne nabídku – bez e-mailu. */
export async function rejectOfferAction(messageId: string): Promise<{ error?: string }> {
  if (!UUID_REGEX.test(messageId)) return { error: 'Neplatné ID zprávy.' }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Musíte být přihlášeni.' }

  const { data: msg } = await supabase
    .from('messages')
    .select('id, receiver_id, offer_status')
    .eq('id', messageId)
    .single()

  if (!msg || msg.receiver_id !== user.id) return { error: 'Zpráva nenalezena.' }
  if (msg.offer_status === 'accepted' || msg.offer_status === 'rejected') {
    return { error: 'Tato nabídka již byla zpracována.' }
  }

  const { error } = await supabase
    .from('messages')
    .update({ offer_status: 'rejected' })
    .eq('id', messageId)

  if (error) {
    console.error('Error rejecting offer:', error)
    return { error: 'Nepodařilo se odmítnout nabídku.' }
  }

  revalidatePath('/messages')
  return {}
}

/** Prodejce pošle protinabídku – odmítne původní nabídku a vytvoří novou s jinou částkou. */
export async function sendCounterOfferAction(
  originalMessageId: string,
  amount: number
): Promise<{ error?: string; data?: { id: string } }> {
  if (!UUID_REGEX.test(originalMessageId)) return { error: 'Neplatné ID zprávy.' }
  if (amount < 1 || amount > 999_999_999) return { error: 'Neplatná částka.' }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Musíte být přihlášeni.' }

  const { data: origMsg, error: fetchErr } = await supabase
    .from('messages')
    .select('id, sender_id, receiver_id, product_id, offer_status, message_type')
    .eq('id', originalMessageId)
    .single()

  if (fetchErr || !origMsg) return { error: 'Zpráva nenalezena.' }
  if (origMsg.receiver_id !== user.id) return { error: 'Protinabídku může odeslat pouze prodejce.' }
  if (origMsg.message_type !== 'offer') return { error: 'Tato zpráva není nabídka.' }
  if (origMsg.offer_status === 'accepted' || origMsg.offer_status === 'rejected') {
    return { error: 'Tato nabídka již byla zpracována.' }
  }
  if (!origMsg.product_id) return { error: 'Nabídka nemá přiřazený produkt.' }

  await supabase
    .from('messages')
    .update({ offer_status: 'rejected' })
    .eq('id', originalMessageId)

  const { data: sellerProfile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
  const sellerName = sellerProfile?.name?.trim() || 'Prodejce'
  const formatted = amount.toLocaleString('cs-CZ')
  const insertData = {
    receiver_id: origMsg.sender_id,
    product_id: origMsg.product_id,
    text: `${sellerName} udělal protinabídku ${formatted} Kč. Šipkobot`,
    sender_id: user.id,
    message_type: 'offer' as const,
    offer_amount: amount,
    offer_status: 'pending' as const,
  }
  const { data: newMsg, error: insertErr } = await supabase
    .from('messages')
    .insert(insertData)
    .select('id')
    .single()

  if (insertErr) {
    console.error('Error sending counter-offer:', insertErr)
    return { error: 'Nepodařilo se odeslat protinabídku.' }
  }

  const buyerEmail = await getUserEmail(origMsg.sender_id)
  if (buyerEmail) {
    const product = await getProductById(origMsg.product_id)
    const productName = product?.name ?? 'produkt'
    const { data: buyerProfile } = await supabase.from('profiles').select('name').eq('id', origMsg.sender_id).single()
    const buyerName = buyerProfile?.name?.trim() || 'Kupující'
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const chatUrl = `${siteUrl}/messages?to=${user.id}&product=${origMsg.product_id}`
    const html = getCounterOfferEmailHtml(buyerName, sellerName, productName, formatted, chatUrl)
    await sendEmail(buyerEmail, `Protinabídka ${formatted} Kč: ${productName}`, html)
  }

  revalidatePath('/messages')
  return { data: newMsg }
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
  const canReview = confirmed && canResult.ok && !alreadyReviewed

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
