import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getCurrentUser } from '@/lib/supabase/database'
import { getFavoriteProductIds, getProductsByIds, getProductFavoriteCounts } from '@/lib/supabase/database'
import { defaultOgImage } from '@/lib/site-config'
import { FavoritesClient } from './favorites-client'

export const metadata: Metadata = {
  title: 'Oblíbené',
  description: 'Inzeráty které jste přidali do oblíbených na Šipkoviště.cz.',
  openGraph: {
    title: 'Oblíbené | Šipkoviště.cz',
    description: 'Inzeráty které jste přidali do oblíbených.',
    images: [defaultOgImage],
  },
}

export const dynamic = 'force-dynamic'

export default async function OblibenePage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/?auth=required')
  }

  const favoriteIds = await getFavoriteProductIds(user.id)
  const products = favoriteIds.length > 0 ? await getProductsByIds(favoriteIds) : []
  const favoriteCounts = products.length > 0 ? await getProductFavoriteCounts(products.map((p) => p.id)) : {}

  return <FavoritesClient products={products} favoriteIds={favoriteIds} favoriteCounts={favoriteCounts} />
}
