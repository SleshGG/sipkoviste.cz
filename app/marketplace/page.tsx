import nextDynamic from 'next/dynamic'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getProducts } from '@/lib/supabase/database'
import type { ProductWithSeller } from '@/lib/supabase/types'

export const metadata: Metadata = {
  title: 'Tržiště',
  description: 'Prohlížejte inzeráty šipek, terčů a příslušenství. Filtrujte podle kategorie, značky a ceny.',
  openGraph: { title: 'Tržiště | Šipkoviště.cz', description: 'Prohlížejte inzeráty šipek, terčů a příslušenství.' },
}

export const dynamic = 'force-dynamic'

const MarketplaceClient = nextDynamic(() => import('./marketplace-client').then((m) => m.MarketplaceClient), {
  loading: () => <div className="min-h-screen bg-background flex items-center justify-center" aria-hidden="true" />,
  ssr: true,
})

async function getMarketplaceProducts(): Promise<ProductWithSeller[]> {
  try {
    const products = await getProducts()
    return products
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

export default async function MarketplacePage() {
  const products = await getMarketplaceProducts()

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <MarketplaceClient initialProducts={products} />
    </Suspense>
  )
}
