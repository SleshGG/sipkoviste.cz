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

export const brands = [
  'Target',
  'Winmau',
  'Unicorn',
  'Harrows',
  'Red Dragon',
  'Shot',
  'Cosmo',
  'L-Style',
  'Mission',
  'Datadart',
  'Pentathlon',
  'One80',
  'GOAT',
]

export const materials = [
  '90% Wolfram',
  '95% Wolfram',
  '97% Wolfram',
  '80% Wolfram',
  'Mosaz',
  'Niklové stříbro',
]

export const conditions = ['Nové', 'Jako nové', 'Dobré', 'Uspokojivé']

export const weights = [
  '16g', '16.5g', '17g', '17.5g', '18g', '18.5g', '19g', '19.5g',
  '20g', '20.5g', '21g', '21.5g', '22g', '22.5g', '23g', '23.5g',
  '24g', '24.5g', '25g', '25.5g', '26g', '26.5g', '27g', '27.5g',
  '28g', '28.5g', '29g', '29.5g', '30g',
]
