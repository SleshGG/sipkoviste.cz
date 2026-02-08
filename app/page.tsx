import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/server'
import type { ProductWithSeller } from '@/lib/supabase/types'

const HomeClient = dynamic(() => import('./home-client').then((m) => m.HomeClient), {
  loading: () => <div className="min-h-screen bg-background flex items-center justify-center" aria-hidden="true" />,
  ssr: true,
})

/** Cache stránky 60 s – zlepší TTFB při opakovaných návštěvách */
export const revalidate = 60

const categoryNames: Record<string, string> = {
  'steel-darts': 'Ocelové šipky',
  'soft-darts': 'Softové šipky',
  'dartboards': 'Terče',
  'accessories': 'Příslušenství',
}

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch featured products (newest 4) – jen viditelné
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
    .eq('visible', true)
    .is('sold_at', null)
    .order('created_at', { ascending: false })
    .limit(4)

  // Fetch category counts – jen viditelné
  const { data: allProducts } = await supabase
    .from('products')
    .select('category')
    .eq('visible', true)
    .is('sold_at', null)

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
      name: 'Neznámý prodejce',
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
