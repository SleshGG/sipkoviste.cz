import { createClient } from './server'
import type { Product, ProductWithSeller, Profile, Message, ProductInsert, MessageInsert } from './types'

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
        response_time
      )
    `)
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
    query = query.or(`name.ilike.%${options.search}%,brand.ilike.%${options.search}%,description.ilike.%${options.search}%`)
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

export async function getProductById(id: string): Promise<ProductWithSeller | null> {
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
        response_time
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    return null
  }

  return data as ProductWithSeller
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
  const conversationsMap = new Map()
  
  data.forEach((msg: any) => {
    const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id
    const otherUser = msg.sender_id === userId ? msg.receiver : msg.sender
    const key = `${otherUserId}-${msg.product_id}`
    
    if (!conversationsMap.has(key) || new Date(msg.created_at) > new Date(conversationsMap.get(key).created_at)) {
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
