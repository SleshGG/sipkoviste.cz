import { cache } from 'react'
import { createClient } from './server'
import type { Product, ProductWithSeller, Profile, Message, MessageWithRelations, Review, ProductInsert, MessageInsert, ConfirmedSale } from './types'

// ============ PRODUCTS ============

export async function getProducts(options?: {
  category?: string
  brand?: string
  condition?: string
  minPrice?: number
  maxPrice?: number
  search?: string
  limit?: number
  offset?: number
}): Promise<ProductWithSeller[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('products')
    .select(`
      *,
      seller:profiles!products_seller_id_fkey (
        id,
        name,
        avatar_url,
        rating,
        review_count,
        member_since,
        response_time,
        show_online_status,
        last_seen_at
      )
    `)
    .eq('visible', true)
    .is('sold_at', null)
    .order('created_at', { ascending: false })

  if (options?.category) {
    query = query.eq('category', options.category)
  }
  if (options?.brand) {
    query = query.eq('brand', options.brand)
  }
  if (options?.condition) {
    query = query.eq('condition', options.condition)
  }
  if (options?.minPrice) {
    query = query.gte('price', options.minPrice)
  }
  if (options?.maxPrice) {
    query = query.lte('price', options.maxPrice)
  }
  if (options?.search) {
    // Escape ILIKE wildcards (% a _) aby uživatel nemohl ovlivnit výsledky
    const escaped = options.search
      .replace(/\\/g, '\\\\')
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_')
    query = query.or(`name.ilike.%${escaped}%,brand.ilike.%${escaped}%,description.ilike.%${escaped}%`)
  }
  if (options?.limit) {
    query = query.limit(options.limit)
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data as ProductWithSeller[]
}

/** Produkty podle ID (např. pro stránku oblíbených). */
export async function getProductsByIds(ids: string[]): Promise<ProductWithSeller[]> {
  if (ids.length === 0) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      seller:profiles!products_seller_id_fkey (
        id,
        name,
        avatar_url,
        rating,
        review_count,
        member_since,
        response_time,
        show_online_status,
        last_seen_at
      )
    `)
    .eq('visible', true)
    .is('sold_at', null)
    .in('id', ids)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products by IDs:', error)
    return []
  }

  // Zachovat pořadí podle ids
  const map = new Map((data ?? []).map((p) => [p.id, p]))
  return ids.map((id) => map.get(id)).filter(Boolean) as ProductWithSeller[]
}

/** Produkty s nejvíce srdíčky (pro doporučené inzeráty). Vrací { productId: favoriteCount }. */
export async function getTopProductsByFavorites(limit = 4): Promise<{ productId: string; favoriteCount: number }[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_top_products_by_favorites', {
    limit_count: limit,
  })
  if (error) {
    console.error('Error fetching top products by favorites:', error)
    return []
  }
  return (data ?? []).map((r: { product_id: string; favorite_count: number }) => ({
    productId: r.product_id,
    favoriteCount: Number(r.favorite_count) || 0,
  }))
}

/** Počet oblíbených u produktů (volá DB funkci). */
export async function getProductFavoriteCounts(productIds: string[]): Promise<Record<string, number>> {
  if (productIds.length === 0) return {}
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_product_favorite_counts', {
    product_ids: productIds,
  })
  if (error) {
    console.error('Error fetching favorite counts:', error)
    return {}
  }
  const result: Record<string, number> = {}
  ;(data ?? []).forEach((r: { product_id: string; favorite_count: number }) => {
    result[r.product_id] = Number(r.favorite_count) || 0
  })
  return result
}

/** Počty inzerátů po kategoriích + celkový počet. Rychlejší než načítání všech produktů. */
export async function getCategoryCounts(): Promise<{ category: string; count: number }[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_category_counts')
  if (error) {
    console.error('Error fetching category counts:', error)
    return []
  }
  return (data ?? []).map((r: { category: string; count: number }) => ({
    category: r.category,
    count: Number(r.count) || 0,
  }))
}

/** Celkový počet viditelných neprodaných produktů. */
export async function getTotalProductCount(): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('visible', true)
    .is('sold_at', null)
  if (error) return 0
  return count ?? 0
}

/** Pro sitemap: vrací ID viditelných, neprodaných produktů. */
export async function getProductIdsForSitemap(): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('id')
    .eq('visible', true)
    .is('sold_at', null)
  if (error) return []
  return (data ?? []).map((r) => r.id)
}

/** Cachovaná verze – deduplikuje volání v rámci jednoho requestu (metadata + page). */
export const getProductByIdCached = cache(async (id: string): Promise<ProductWithSeller | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      seller:profiles!products_seller_id_fkey (
        id,
        name,
        avatar_url,
        rating,
        review_count,
        member_since,
        response_time,
        show_online_status,
        last_seen_at
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    return null
  }
  return data as ProductWithSeller
})

export async function getProductById(id: string): Promise<ProductWithSeller | null> {
  return getProductByIdCached(id)
}

export async function getProductsBySeller(sellerId: string): Promise<Product[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching seller products:', error)
    return []
  }

  return data
}

/** Produkty prodejce pro zobrazení na profilu. */
export async function getProductsBySellerForProfile(
  sellerId: string,
  options?: { includeSold?: boolean }
): Promise<ProductWithSeller[]> {
  const supabase = await createClient()
  let query = supabase
    .from('products')
    .select(`
      *,
      seller:profiles!products_seller_id_fkey (
        id,
        name,
        avatar_url,
        rating,
        review_count,
        member_since,
        response_time,
        show_online_status,
        last_seen_at
      )
    `)
    .eq('seller_id', sellerId)
    .eq('visible', true)

  if (!options?.includeSold) {
    query = query.is('sold_at', null).order('created_at', { ascending: false })
  } else {
    query = query
      .order('sold_at', { ascending: false, nullsFirst: true })
      .order('created_at', { ascending: false })
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching seller products for profile:', error)
    return []
  }

  return (data ?? []) as ProductWithSeller[]
}

export async function createProduct(product: ProductInsert): Promise<Product | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single()

  if (error) {
    console.error('Error creating product:', error)
    return null
  }

  return data
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating product:', error)
    return null
  }

  return data
}

export async function deleteProduct(id: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting product:', error)
    return false
  }

  return true
}

/** Vrátí ID produktů, které lze smazat (nemají zprávy ani confirmed_sales). */
export async function getProductIdsCanDelete(productIds: string[]): Promise<Set<string>> {
  if (productIds.length === 0) return new Set()
  const supabase = await createClient()

  const [messagesRes, salesRes] = await Promise.all([
    supabase.from('messages').select('product_id').in('product_id', productIds),
    supabase.from('confirmed_sales').select('product_id').in('product_id', productIds),
  ])

  const hasMessages = new Set((messagesRes.data ?? []).map((r) => r.product_id))
  const hasSales = new Set((salesRes.data ?? []).map((r) => r.product_id))

  const canDelete = new Set<string>()
  for (const id of productIds) {
    if (!hasMessages.has(id) && !hasSales.has(id)) canDelete.add(id)
  }
  return canDelete
}

// ============ PROFILES ============

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    return null
  }

  return data
}

// ============ MESSAGES ============

export async function getConversations(userId: string) {
  const supabase = await createClient()
  
  // Get all messages where user is sender or receiver
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey (
        id,
        name,
        avatar_url
      ),
      receiver:profiles!messages_receiver_id_fkey (
        id,
        name,
        avatar_url
      ),
      product:products!messages_product_id_fkey (
        id,
        name,
        image
      )
    `)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching conversations:', error)
    return []
  }

  // Group by conversation (unique combination of other user + product)
  const conversationsMap = new Map<string, { id: string; participant: Profile; product: { id: string; name: string; image: string | null }; lastMessage: string; timestamp: string; unread: boolean }>()
  
  ;(data as MessageWithRelations[]).forEach((msg) => {
    const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id
    const otherUser = msg.sender_id === userId ? msg.receiver : msg.sender
    const key = `${otherUserId}-${msg.product_id}`
    
    if (!conversationsMap.has(key) || new Date(msg.created_at) > new Date(conversationsMap.get(key)!.timestamp)) {
      conversationsMap.set(key, {
        id: msg.id,
        participant: otherUser,
        product: msg.product,
        lastMessage: msg.text,
        timestamp: msg.created_at,
        unread: !msg.is_read && msg.receiver_id === userId
      })
    }
  })

  return Array.from(conversationsMap.values())
}

export async function getMessagesByConversation(userId: string, otherUserId: string, productId: string): Promise<Message[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('product_id', productId)
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    return []
  }

  return data
}

export async function sendMessage(message: MessageInsert): Promise<Message | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('messages')
    .insert(message)
    .select()
    .single()

  if (error) {
    console.error('Error sending message:', error)
    return null
  }

  return data
}

export async function markMessagesAsRead(userId: string, senderId: string, productId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('receiver_id', userId)
    .eq('sender_id', senderId)
    .eq('product_id', productId)

  if (error) {
    console.error('Error marking messages as read:', error)
    return false
  }

  return true
}

// ============ REVIEWS ============

/** Zjistí, zda uživatel (authorId) může ohodnotit profil (profileId) za produkt (productId). Oba účastníci (kupující i prodejce) mohou hodnotit druhého po potvrzení prodeje. */
export async function canUserRateProfile(
  productId: string,
  authorId: string,
  profileId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()

  if (authorId === profileId) {
    return { ok: false, error: 'Nemůžete ohodnotit sami sebe.' }
  }

  const { data: product } = await supabase
    .from('products')
    .select('seller_id')
    .eq('id', productId)
    .single()

  if (!product) {
    return { ok: false, error: 'Produkt nenalezen.' }
  }

  const { data: messages } = await supabase
    .from('messages')
    .select('id')
    .eq('product_id', productId)
    .or(`and(sender_id.eq.${authorId},receiver_id.eq.${profileId}),and(sender_id.eq.${profileId},receiver_id.eq.${authorId})`)
    .limit(1)

  if (!messages?.length) {
    return { ok: false, error: 'Hodnotit můžete až po konverzaci o tomto inzerátu.' }
  }

  // Potvrzený prodej: (buyer_id, seller_id) musí být (author, profile) nebo (profile, author)
  const { data: saleAsBuyer } = await supabase
    .from('confirmed_sales')
    .select('id')
    .eq('product_id', productId)
    .eq('buyer_id', authorId)
    .eq('seller_id', profileId)
    .maybeSingle()
  const { data: saleAsSeller } = await supabase
    .from('confirmed_sales')
    .select('id')
    .eq('product_id', productId)
    .eq('buyer_id', profileId)
    .eq('seller_id', authorId)
    .maybeSingle()

  if (!saleAsBuyer && !saleAsSeller) {
    return { ok: false, error: 'Hodnotit můžete až po potvrzení prodeje v chatu (prodejce potvrdí prodej).' }
  }

  return { ok: true }
}

/** Prodané inzeráty prodejce s informací o kupujícím. */
export async function getSoldProductsWithBuyer(sellerId: string): Promise<Array<{
  id: string
  product_id: string
  confirmed_at: string
  sale_price: number | null
  product: { id: string; name: string; brand: string; price: number; condition: string; image: string | null; sold_at: string | null; view_count?: number }
  buyer: { id: string; name: string | null; avatar_url: string | null }
}>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('confirmed_sales')
    .select(`
      id,
      product_id,
      confirmed_at,
      sale_price,
      product:products!confirmed_sales_product_id_fkey(id, name, brand, price, condition, image, sold_at, view_count),
      buyer:profiles!confirmed_sales_buyer_id_fkey(id, name, avatar_url)
    `)
    .eq('seller_id', sellerId)
    .order('confirmed_at', { ascending: false })

  if (error) {
    console.error('Error fetching sold products with buyer:', error)
    return []
  }

  return (data ?? []) as Array<{
    id: string
    product_id: string
    confirmed_at: string
    sale_price: number | null
    product: { id: string; name: string; brand: string; price: number; condition: string; image: string | null; sold_at: string | null; view_count?: number }
    buyer: { id: string; name: string | null; avatar_url: string | null }
  }>
}

/** Zakoupené položky uživatele (potvrzené prodeje). */
export async function getPurchasedItemsForUser(buyerId: string): Promise<Array<{
  id: string
  product_id: string
  confirmed_at: string
  sale_price: number | null
  product: { id: string; name: string; brand: string; price: number; condition: string; image: string | null }
  seller: { id: string; name: string | null; avatar_url: string | null }
}>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('confirmed_sales')
    .select(`
      id,
      product_id,
      confirmed_at,
      sale_price,
      product:products!confirmed_sales_product_id_fkey(id, name, brand, price, condition, image),
      seller:profiles!confirmed_sales_seller_id_fkey(id, name, avatar_url)
    `)
    .eq('buyer_id', buyerId)
    .order('confirmed_at', { ascending: false })

  if (error) {
    console.error('Error fetching purchased items:', error)
    return []
  }

  return (data ?? []) as Array<{
    id: string
    product_id: string
    confirmed_at: string
    sale_price: number | null
    product: { id: string; name: string; brand: string; price: number; condition: string; image: string | null }
    seller: { id: string; name: string | null; avatar_url: string | null }
  }>
}

export async function getConfirmedSale(
  productId: string,
  buyerId: string,
  sellerId: string
): Promise<ConfirmedSale | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('confirmed_sales')
    .select('*')
    .eq('product_id', productId)
    .eq('buyer_id', buyerId)
    .eq('seller_id', sellerId)
    .maybeSingle()
  return data as ConfirmedSale | null
}

export async function getReviewsForProfile(profileId: string): Promise<(Review & { author?: Profile })[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      author:profiles!reviews_author_id_fkey(id, name, avatar_url)
    `)
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching reviews:', error)
    return []
  }
  return (data ?? []) as (Review & { author?: Profile })[]
}

export async function getExistingReview(
  authorId: string,
  profileId: string,
  productId: string
): Promise<Review | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('reviews')
    .select('*')
    .eq('author_id', authorId)
    .eq('profile_id', profileId)
    .eq('product_id', productId)
    .maybeSingle()
  return data as Review | null
}

// ============ FAVORITES ============

export async function getFavoriteProductIds(userId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('favorites')
    .select('product_id')
    .eq('user_id', userId)
  if (error) {
    console.error('Error fetching favorites:', error)
    return []
  }
  return (data ?? []).map((r) => r.product_id)
}

// ============ AUTH HELPERS ============

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getCurrentUserWithProfile() {
  const user = await getCurrentUser()
  if (!user) return null
  
  const profile = await getProfile(user.id)
  return { user, profile }
}
