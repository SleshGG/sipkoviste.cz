export interface Product {
  id: string
  name: string
  price: number
  category: string
  image: string
  seller: string
  description: string
  condition: "Nové" | "Použité"
}

export const mockProducts: Product[] = [
  {
    id: "1",
    name: "Sada profesionálních šipek",
    price: 1250,
    category: "Šipky",
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800&auto=format&fit=crop",
    seller: "Jan Novák",
    description: "Prodám téměř nepoužívané šipky, váha 23g.",
    condition: "Použité",
  },
  {
    id: "2",
    name: "Elektronický terč Winmau",
    price: 3400,
    category: "Terče",
    image: "https://images.unsplash.com/photo-1629905679177-4c4e2623653f?q=80&w=800&auto=format&fit=crop",
    seller: "Petr Svoboda",
    description: "Špičkový elektronický terč, jako nový.",
    condition: "Nové",
  }
]