import { createClient } from '@supabase/supabase-js'

// Inicializace Supabase klienta (ujisti se, že máš tyto proměnné v .env.local)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// --- INTERFACES ---
export interface Product {
  id: string
  name: string
  brand: string
  price: number
  weight: string
  material: string
  condition: 'Nové' | 'Jako nové' | 'Dobré' | 'Uspokojivé'
  category: 'steel-darts' | 'soft-darts' | 'dartboards' | 'accessories'
  image: string
  images: string[]
  description: string
  specs: Record<string, string>
  seller: Seller
  createdAt: string
}

export interface Seller {
  id: string
  name: string
  avatar: string
  rating: number
  reviewCount: number
  memberSince: string
  responseTime: string
}

export interface Message {
  id: string
  senderId: string
  senderName: string
  senderAvatar: string
  productId: string
  productName: string
  productImage: string
  lastMessage: string
  timestamp: string
  unread: boolean
}

// --- STATICKÉ KONSTANTY (Pro filtry a UI) ---
export const categories = [
  { id: 'steel-darts', name: 'Ocelové šipky', icon: 'target', count: 0 },
  { id: 'soft-darts', name: 'Softové šipky', icon: 'circle-dot', count: 0 },
  { id: 'dartboards', name: 'Terče', icon: 'circle', count: 0 },
  { id: 'accessories', name: 'Příslušenství', icon: 'package', count: 0 },
]

export const brands = ['Target', 'Winmau', 'Unicorn', 'Harrows', 'Red Dragon', 'Shot', 'Cosmo', 'L-Style', 'Mission', 'Datadart']
export const materials = ['90% Wolfram', '95% Wolfram', '97% Wolfram', '80% Wolfram', 'Mosaz', 'Niklové stříbro']
export const conditions = ['Nové', 'Jako nové', 'Dobré', 'Uspokojivé']
export const weights = ['16g', '18g', '20g', '21g', '22g', '23g', '24g', '25g', '26g', '28g', '30g']

// --- DATABÁZOVÉ FUNKCE ---

/**
 * Načte všechny produkty z databáze
 */
export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Chyba při načítání produktů:', error)
    return []
  }

  // Mapování databáze na tvůj Product interface (přejmenování created_at na createdAt)
  return (data || []).map(item => ({
    ...item,
    createdAt: item.created_at,
    // Pokud je seller v DB jako JSONB, TypeScript ho uvidí správně
  })) as Product[]
}

/**
 * Načte jeden konkrétní produkt podle ID
 */
export async function getProductById(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Produkt nenalezen:', error)
    return null
  }

  return { ...data, createdAt: data.created_at } as Product
}

/**
 * Načte zprávy pro aktuálně přihlášeného uživatele
 */
export async function getUserMessages() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('messages')
    .select('*, products(name, image)')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Chyba při načítání zpráv:', error)
    return []
  }

  return data
}