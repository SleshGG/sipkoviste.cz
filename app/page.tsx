import dynamic from 'next/dynamic'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getProductFavoriteCounts, getTopProductsByFavorites, getProductsByIds, getCategoryCounts, getTotalProductCount } from '@/lib/supabase/database'
import type { ProductWithSeller } from '@/lib/supabase/types'
import { defaultOgImage, defaultOgImageUrl } from '@/lib/site-config'

const HomeClient = dynamic(() => import('./home-client').then((m) => m.HomeClient), {
  loading: () => <div className="min-h-screen bg-background flex items-center justify-center" aria-hidden="true" />,
  ssr: true,
})

/** Cache stránky 60 s – zlepší TTFB při opakovaných návštěvách */
export const revalidate = 60

const siteName = 'Šipkoviště'
const defaultDescription = 'Kupujte a prodávejte prémiové šipky, terče a příslušenství. Největší tržiště pro milovníky šipek v ČR.'

export const metadata: Metadata = {
  title: `${siteName} - Tržiště s Šipkami`,
  description: defaultDescription,
  openGraph: {
    type: 'website',
    title: `${siteName} - Tržiště s Šipkami`,
    description: defaultDescription,
    images: [defaultOgImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} - Tržiště s Šipkami`,
    description: defaultDescription,
    images: [defaultOgImageUrl],
  },
}

const categoryNames: Record<string, string> = {
  'steel-darts': 'Ocelové šipky',
  'soft-darts': 'Softové šipky',
  'dartboards': 'Terče',
  'accessories': 'Příslušenství',
}

export default async function HomePage() {
  const supabase = await createClient()

  // Načíst doporučené produkty a počty kategorií paralelně
  const TARGET_COUNT = 5
  const [topByFavorites, categoryCountsRaw, totalProducts] = await Promise.all([
    getTopProductsByFavorites(TARGET_COUNT),
    getCategoryCounts(),
    getTotalProductCount(),
  ])
  let featuredProducts: ProductWithSeller[] = []
  const favoriteCounts: Record<string, number> = {}

  if (topByFavorites.length > 0) {
    const ids = topByFavorites.map((t) => t.productId)
    topByFavorites.forEach((t) => { favoriteCounts[t.productId] = t.favoriteCount })
    featuredProducts = await getProductsByIds(ids)
  }

  // Doplň do 5 inzerátů nejnovějšími (které ještě nejsou v seznamu)
  if (featuredProducts.length < TARGET_COUNT) {
    const existingIds = new Set(featuredProducts.map((p) => p.id))
    const { data: extraProducts } = await supabase
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
      .limit(20)

    const toAdd = (extraProducts || [])
      .filter((p) => !existingIds.has(p.id))
      .slice(0, TARGET_COUNT - featuredProducts.length)
      .map((product) => ({
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
      })) as ProductWithSeller[]

    featuredProducts = [...featuredProducts, ...toAdd]

    if (toAdd.length > 0) {
      const counts = await getProductFavoriteCounts(toAdd.map((p) => p.id))
      Object.assign(favoriteCounts, counts)
    }
  }

  // Fallback: pokud žádné srdíčka, zobraz 5 nejnovějších
  if (featuredProducts.length === 0) {
    const { data: products } = await supabase
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
      .limit(TARGET_COUNT)

    featuredProducts = (products || []).map((product) => ({
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
    })) as ProductWithSeller[]

    if (featuredProducts.length > 0) {
      const counts = await getProductFavoriteCounts(featuredProducts.map((p) => p.id))
      Object.assign(favoriteCounts, counts)
    }
  }

  // Mapovat počty z DB na pevné pořadí kategorií
  const countMap = Object.fromEntries(categoryCountsRaw.map((c) => [c.category, c.count]))
  const categoryCounts = [
    { id: 'steel-darts', name: categoryNames['steel-darts'], count: countMap['steel-darts'] ?? 0 },
    { id: 'soft-darts', name: categoryNames['soft-darts'], count: countMap['soft-darts'] ?? 0 },
    { id: 'dartboards', name: categoryNames['dartboards'], count: countMap['dartboards'] ?? 0 },
    { id: 'accessories', name: categoryNames['accessories'], count: countMap['accessories'] ?? 0 },
  ]

  return (
    <HomeClient
      featuredProducts={featuredProducts}
      categoryCounts={categoryCounts}
      totalProducts={totalProducts}
      favoriteCounts={favoriteCounts}
    />
  )
}
