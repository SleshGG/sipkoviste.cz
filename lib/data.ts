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

export const categories = [
  { id: 'steel-darts', name: 'Ocelové šipky', icon: 'target', count: 1250 },
  { id: 'soft-darts', name: 'Softové šipky', icon: 'circle-dot', count: 890 },
  { id: 'dartboards', name: 'Terče', icon: 'circle', count: 430 },
  { id: 'accessories', name: 'Příslušenství', icon: 'package', count: 2100 },
]

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

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Target Gabriel Clemens Gen 2',
    brand: 'Target',
    price: 2199,
    weight: '23g',
    material: '90% Wolfram',
    condition: 'Nové',
    category: 'steel-darts',
    image: 'https://images.unsplash.com/photo-1582156926892-d51f65acb00e?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1582156926892-d51f65acb00e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=800&h=600&fit=crop',
    ],
    description: 'Profesionální ocelové šipky používané Gabrielem Clemensem. Precizně opracovaný barrel s výjimečným gripem.',
    specs: {
      'Délka barrelu': '50mm',
      'Průměr barrelu': '6.5mm',
      'Typ hrotu': 'Storm Points',
      'Tvar letek': 'Standard',
      'Násadka': 'Pro Grip',
    },
    seller: {
      id: 's1',
      name: 'DartsPro Shop',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      rating: 4.9,
      reviewCount: 328,
      memberSince: '2020',
      responseTime: '< 1 hodina',
    },
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Winmau Blade 6 Triple Core',
    brand: 'Winmau',
    price: 3699,
    weight: 'N/A',
    material: 'Sisal',
    condition: 'Nové',
    category: 'dartboards',
    image: 'https://images.unsplash.com/photo-1581623881823-bc8e7fe5d7d6?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1581623881823-bc8e7fe5d7d6?w=800&h=600&fit=crop',
    ],
    description: 'Profesionální terč s technologií Triple Core pro minimální odrazy šipek.',
    specs: {
      'Průměr': '45 cm',
      'Drátěnka': 'Razor Wire',
      'Spider': 'Triple Core Carbon',
      'Povrch': 'High Density Sisal',
    },
    seller: {
      id: 's2',
      name: 'BoardMaster',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      rating: 4.8,
      reviewCount: 156,
      memberSince: '2019',
      responseTime: '< 2 hodiny',
    },
    createdAt: '2024-01-14',
  },
  {
    id: '3',
    name: 'Red Dragon Gerwyn Price Iceman',
    brand: 'Red Dragon',
    price: 1599,
    weight: '24g',
    material: '90% Wolfram',
    condition: 'Jako nové',
    category: 'steel-darts',
    image: 'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=800&h=600&fit=crop',
    ],
    description: 'Šipky mistra světa Gerwyna Price s agresivním kruhovým gripem.',
    specs: {
      'Délka barrelu': '52mm',
      'Průměr barrelu': '6.8mm',
      'Typ hrotu': 'Trident Points',
      'Tvar letek': 'Kite',
      'Násadka': 'Nitrotech',
    },
    seller: {
      id: 's3',
      name: 'WelshDarts',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      rating: 4.7,
      reviewCount: 89,
      memberSince: '2021',
      responseTime: '< 4 hodiny',
    },
    createdAt: '2024-01-13',
  },
  {
    id: '4',
    name: 'Target Nexus Pro Flights',
    brand: 'Target',
    price: 299,
    weight: 'N/A',
    material: 'Polymer',
    condition: 'Nové',
    category: 'accessories',
    image: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&h=600&fit=crop',
    ],
    description: 'Prémiové 100 mikronové letky se zvýšenou odolností a konzistentní drahou letu.',
    specs: {
      'Tloušťka': '100 Mikronů',
      'Tvar': 'Standard',
      'Množství': '3 sady (9 letek)',
    },
    seller: {
      id: 's1',
      name: 'DartsPro Shop',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      rating: 4.9,
      reviewCount: 328,
      memberSince: '2020',
      responseTime: '< 1 hodina',
    },
    createdAt: '2024-01-12',
  },
  {
    id: '5',
    name: 'Cosmo Fit Flight Air',
    brand: 'Cosmo',
    price: 219,
    weight: 'N/A',
    material: 'Polymer',
    condition: 'Nové',
    category: 'accessories',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
    ],
    description: 'Japonské letky pro softové šipky s integrovaným systémem násadek.',
    specs: {
      'Tvar': 'Slim',
      'Systém': 'Fit Flight Air',
      'Množství': '3 letky',
    },
    seller: {
      id: 's4',
      name: 'SoftTipKing',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop',
      rating: 4.6,
      reviewCount: 234,
      memberSince: '2018',
      responseTime: '< 3 hodiny',
    },
    createdAt: '2024-01-11',
  },
  {
    id: '6',
    name: 'Unicorn Eclipse Pro2',
    brand: 'Unicorn',
    price: 3199,
    weight: 'N/A',
    material: 'Sisal',
    condition: 'Dobré',
    category: 'dartboards',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=600&fit=crop',
    ],
    description: 'Oficiální turnajový terč PDC s ultra-tenkou drátěnkou.',
    specs: {
      'Průměr': '45 cm',
      'Drátěnka': 'Super Thin',
      'Povrch': 'PDC Grade Sisal',
    },
    seller: {
      id: 's2',
      name: 'BoardMaster',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      rating: 4.8,
      reviewCount: 156,
      memberSince: '2019',
      responseTime: '< 2 hodiny',
    },
    createdAt: '2024-01-10',
  },
  {
    id: '7',
    name: 'Shot Tribal Weapon 4',
    brand: 'Shot',
    price: 1349,
    weight: '22g',
    material: '90% Wolfram',
    condition: 'Nové',
    category: 'soft-darts',
    image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=600&fit=crop',
    ],
    description: 'Novozélandské softové šipky s unikátním tribal gravírováním.',
    specs: {
      'Délka barrelu': '48mm',
      'Průměr barrelu': '6.3mm',
      'Typ hrotu': '2BA Conversion',
      'Tvar letek': 'Pear',
    },
    seller: {
      id: 's4',
      name: 'SoftTipKing',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop',
      rating: 4.6,
      reviewCount: 234,
      memberSince: '2018',
      responseTime: '< 3 hodiny',
    },
    createdAt: '2024-01-09',
  },
  {
    id: '8',
    name: 'Harrows Retina 95%',
    brand: 'Harrows',
    price: 1949,
    weight: '21g',
    material: '95% Wolfram',
    condition: 'Nové',
    category: 'steel-darts',
    image: 'https://images.unsplash.com/photo-1628253747716-0c4f5c90fdda?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1628253747716-0c4f5c90fdda?w=800&h=600&fit=crop',
    ],
    description: 'Ultra-tenký barrel s laserem gravírovanými gripovými zónami.',
    specs: {
      'Délka barrelu': '46mm',
      'Průměr barrelu': '5.8mm',
      'Typ hrotu': 'Predator Points',
      'Tvar letek': 'Standard',
      'Násadka': 'Supergrip Carbon',
    },
    seller: {
      id: 's1',
      name: 'DartsPro Shop',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      rating: 4.9,
      reviewCount: 328,
      memberSince: '2020',
      responseTime: '< 1 hodina',
    },
    createdAt: '2024-01-08',
  },
]

export const mockMessages: Message[] = [
  {
    id: 'm1',
    senderId: 's1',
    senderName: 'DartsPro Shop',
    senderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    productId: '1',
    productName: 'Target Gabriel Clemens Gen 2',
    productImage: 'https://images.unsplash.com/photo-1582156926892-d51f65acb00e?w=100&h=100&fit=crop',
    lastMessage: 'Ano, šipky jsou stále k dispozici! Mám je pro vás rezervovat?',
    timestamp: 'před 2 hodinami',
    unread: true,
  },
  {
    id: 'm2',
    senderId: 's3',
    senderName: 'WelshDarts',
    senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    productId: '3',
    productName: 'Red Dragon Gerwyn Price Iceman',
    productImage: 'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=100&h=100&fit=crop',
    lastMessage: 'Mohu odeslat zítra, pokud dnes potvrdíte.',
    timestamp: 'před 1 dnem',
    unread: false,
  },
  {
    id: 'm3',
    senderId: 's2',
    senderName: 'BoardMaster',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    productId: '2',
    productName: 'Winmau Blade 6 Triple Core',
    productImage: 'https://images.unsplash.com/photo-1581623881823-bc8e7fe5d7d6?w=100&h=100&fit=crop',
    lastMessage: 'Děkujeme za nákup! Sledovací číslo zašleme brzy.',
    timestamp: 'před 3 dny',
    unread: false,
  },
]

export const mockListings: Product[] = mockProducts.slice(0, 3)
