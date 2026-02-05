// Database types based on Supabase schema

export interface Profile {
  id: string
  name: string | null
  avatar_url: string | null
  rating: number
  review_count: number
  member_since: string
  response_time: string
}

export interface Product {
  id: string
  seller_id: string
  name: string
  brand: string
  price: number
  weight: string | null
  material: string | null
  condition: 'Nové' | 'Jako nové' | 'Dobré' | 'Uspokojivé'
  category: 'steel-darts' | 'soft-darts' | 'dartboards' | 'accessories'
  image: string | null
  images: string[] | null
  description: string | null
  negotiable: boolean
  specs: Record<string, string>
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  product_id: string
  text: string
  is_read: boolean
  created_at: string
}

// Extended types with relations
export interface ProductWithSeller extends Product {
  seller: Profile
}

export interface ConversationPreview {
  id: string
  participant: Profile
  product: Pick<Product, 'id' | 'name' | 'image'>
  lastMessage: string
  timestamp: string
  unread: boolean
}

// Insert types (without auto-generated fields)
export type ProductInsert = Omit<Product, 'id' | 'created_at'>
export type MessageInsert = Omit<Message, 'id' | 'created_at' | 'is_read'>
export type ProfileInsert = Omit<Profile, 'rating' | 'review_count' | 'member_since' | 'response_time'>
