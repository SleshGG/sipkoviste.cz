import dynamic from 'next/dynamic'
import type { Metadata } from 'next'
import { getProductFavoriteCounts, getCategoryCounts, getTotalProductCount, getProducts } from '@/lib/supabase/database'
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
  title: `${siteName} - Tržiště s šipkami a příslušenstvím`,
  description: defaultDescription,
  openGraph: {
    type: 'website',
    title: `${siteName} - Tržiště s šipkami a příslušenstvím`,
    description: defaultDescription,
    images: [defaultOgImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} - Tržiště s šipkami a příslušenstvím`,
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
  // Načíst počty kategorií a produkty ze všech kategorií paralelně
  const [categoryCountsRaw, totalProducts, steelDartsProducts, softDartsProducts, dartboardsProducts, accessoriesProducts] = await Promise.all([
    getCategoryCounts(),
    getTotalProductCount(),
    getProducts({ category: 'steel-darts', limit: 6 }),
    getProducts({ category: 'soft-darts', limit: 2 }),
    getProducts({ category: 'dartboards', limit: 2 }),
    getProducts({ category: 'accessories', limit: 2 }),
  ])

  // Mapovat počty z DB na pevné pořadí kategorií
  const countMap = Object.fromEntries(categoryCountsRaw.map((c) => [c.category, c.count]))
  const categoryCounts = [
    { id: 'steel-darts', name: categoryNames['steel-darts'], count: countMap['steel-darts'] ?? 0 },
    { id: 'soft-darts', name: categoryNames['soft-darts'], count: countMap['soft-darts'] ?? 0 },
    { id: 'dartboards', name: categoryNames['dartboards'], count: countMap['dartboards'] ?? 0 },
    { id: 'accessories', name: categoryNames['accessories'], count: countMap['accessories'] ?? 0 },
  ]

  // Počty oblíbených pro produkty v kategoriích
  const [steelDartsFavoriteCounts, softDartsFavoriteCounts, dartboardsFavoriteCounts, accessoriesFavoriteCounts] = await Promise.all([
    getProductFavoriteCounts(steelDartsProducts.map((p) => p.id)),
    getProductFavoriteCounts(softDartsProducts.map((p) => p.id)),
    getProductFavoriteCounts(dartboardsProducts.map((p) => p.id)),
    getProductFavoriteCounts(accessoriesProducts.map((p) => p.id)),
  ])

  return (
    <>
      <HomeClient
        categoryCounts={categoryCounts}
        totalProducts={totalProducts}
        steelDartsProducts={steelDartsProducts}
        softDartsProducts={softDartsProducts}
        dartboardsProducts={dartboardsProducts}
        accessoriesProducts={accessoriesProducts}
        steelDartsFavoriteCounts={steelDartsFavoriteCounts}
        softDartsFavoriteCounts={softDartsFavoriteCounts}
        dartboardsFavoriteCounts={dartboardsFavoriteCounts}
        accessoriesFavoriteCounts={accessoriesFavoriteCounts}
      />
    </>
  )
}
