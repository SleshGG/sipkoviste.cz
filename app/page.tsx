import { createClient } from '@/lib/supabase/server'
import { HomeClient } from './home-client'
import type { ProductWithSeller } from '@/lib/supabase/types'

const categoryNames: Record<string, string> = {
  'steel-darts': 'Ocelove sipky',
  'soft-darts': 'Softove sipky',
  'dartboards': 'Terce',
  'accessories': 'Prislusenstvi',
}

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch featured products (newest 4)
  const { data: products, error: productsError } = await supabase
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
    .limit(4)

  // Fetch category counts
  const { data: allProducts } = await supabase
    .from('products')
    .select('category')

  // Calculate category counts
  const categoryCounts = [
    { id: 'steel-darts', name: categoryNames['steel-darts'], count: 0 },
    { id: 'soft-darts', name: categoryNames['soft-darts'], count: 0 },
    { id: 'dartboards', name: categoryNames['dartboards'], count: 0 },
    { id: 'accessories', name: categoryNames['accessories'], count: 0 },
  ]

  if (allProducts) {
    allProducts.forEach((product) => {
      const category = categoryCounts.find((c) => c.id === product.category)
      if (category) {
        category.count++
      }
    })
  }

  const totalProducts = allProducts?.length || 0

  // Transform products to match the expected type
  const featuredProducts: ProductWithSeller[] = (products || []).map((product) => ({
    ...product,
    seller: product.seller || {
      id: product.seller_id,
      name: 'Neznamy prodejce',
      avatar_url: null,
      rating: 5.0,
      review_count: 0,
      member_since: new Date().toISOString(),
      response_time: 'Do hodiny',
    },
  }))

  return (
    <HomeClient
      featuredProducts={featuredProducts}
      categoryCounts={categoryCounts}
      totalProducts={totalProducts}
    />
  )
}
