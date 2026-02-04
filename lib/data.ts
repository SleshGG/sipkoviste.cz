import { createClient } from '@supabase/supabase-js'

// --- KONFIGURACE SUPABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// --- INTERFACES ---
export interface Product {
  id: string
  name: string
  title?: string
  brand: string
  price: number
  weight: string
  material: string
  condition: 'Nové' | 'Jako nové' | 'Dobré' | 'Uspokojivé'
  category: 'steel-darts' | 'soft-darts' | 'dartboards' | 'accessories'
  image: string
  images: string[]
  description: string
  specs?: Record<string, string>
  seller?: Seller
  createdAt: string
  negotiable?: boolean
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

// --- STATICKÉ KONSTANTY (Musí přesně sedět na SQL CHECK constraints!) ---
export const categories = [
  { id: 'steel-darts', name: 'Ocelové šipky', icon: 'target', count: 0 },
  { id: 'soft-darts', name: 'Softové šipky', icon: 'circle-dot', count: 0 },
  { id: 'dartboards', name: 'Terče', icon: 'circle', count: 0 },
  { id: 'accessories', name: 'Příslušenství', icon: 'package', count: 0 },
]

export const brands = ['Target', 'Winmau', 'Unicorn', 'Harrows', 'Red Dragon', 'Shot', 'Cosmo', 'L-Style', 'Mission', 'Datadart']
export const materials = ['90% Wolfram', '95% Wolfram', '97% Wolfram', '80% Wolfram', 'Mosaz', 'Niklové stříbro']

// TATO POLE MUSÍ SEDĚT NA SQL CHECK CONSTRAINT
export const conditions = ['Nové', 'Jako nové', 'Dobré', 'Uspokojivé'] as const;

export const weights = ['16g', '18g', '20g', '21g', '22g', '23g', '24g', '25g', '26g', '28g', '30g']

// --- MOCK DATA PRO BUILD ---
export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Target Gabriel Clemens Gen 2',
    title: 'Target Gabriel Clemens Gen 2',
    brand: 'Target',
    price: 2450,
    weight: '23g',
    material: '90% Wolfram',
    condition: 'Jako nové',
    category: 'steel-darts',
    image: '/placeholder.svg',
    images: ['/placeholder.svg'],
    description: 'Špičkové šipky.',
    createdAt: new Date().toISOString(),
  }
]

// --- DATABÁZOVÉ FUNKCE ---
export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !data || data.length === 0) return mockProducts

  return data.map(item => ({
    ...item,
    createdAt: item.created_at,
    title: item.name
  })) as Product[]
}

export async function getProductById(id: string) {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
  if (error) return mockProducts.find(p => p.id === id) || null
  return { ...data, createdAt: data.current_at, title: data.name } as Product
}

export async function getUserMessages() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('messages')
    .select('*, products(name, image)')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
  return error ? [] : data
}