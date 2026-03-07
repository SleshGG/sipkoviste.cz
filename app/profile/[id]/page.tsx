import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProfile, getProductsBySellerForProfile, getReviewsForProfile, getProductFavoriteCounts, getPurchasedItemsForUser, getReservedItemsForUser, getSoldProductsWithBuyer, getProductIdsCanDelete } from '@/lib/supabase/database'
import { ProfileClient } from './profile-client'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  if (id === 'me') return { title: 'Můj profil' }
  const profile = await getProfile(id)
  if (!profile) return { title: 'Profil nenalezen' }
  return {
    title: `${profile.name ?? 'Profil'} | Šipkoviště.cz`,
    description: `Profil uživatele ${profile.name ?? 'na Šipkoviště.cz'}.`,
  }
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  let profileId = id
  if (id === 'me') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return notFound()
    profileId = user.id
  }

  const { data: { user } } = await supabase.auth.getUser()
  const isOwnProfile = !!user && profileId === user.id

  const [profile, productsRaw, reviews, purchasedItems, reservedItems, soldItems] = await Promise.all([
    getProfile(profileId),
    getProductsBySellerForProfile(profileId, { includeSold: false }),
    getReviewsForProfile(profileId),
    isOwnProfile ? getPurchasedItemsForUser(profileId) : Promise.resolve([]),
    isOwnProfile ? getReservedItemsForUser(profileId) : Promise.resolve([]),
    isOwnProfile ? getSoldProductsWithBuyer(profileId) : Promise.resolve([]),
  ])

  if (!profile) return notFound()

  // Doplň reserved_by_name u rezervovaných produktů
  const reservedByIds = [...new Set(productsRaw.filter((p) => (p as { status?: string; reserved_by?: string | null }).status === 'reserved' && (p as { reserved_by?: string | null }).reserved_by).map((p) => (p as { reserved_by?: string }).reserved_by!))]
  const reservedByNames = Object.fromEntries(
    await Promise.all(reservedByIds.map(async (id) => [id, (await getProfile(id))?.name ?? null]))
  )
  const products = productsRaw.map((p) => {
    const row = p as { status?: string; reserved_by?: string | null; reserved_by_name?: string | null }
    if (row.status === 'reserved' && row.reserved_by) {
      return { ...p, reserved_by_name: reservedByNames[row.reserved_by] ?? null }
    }
    return p
  })

  const allProductIds = [...products.map((p) => p.id), ...soldItems.map((s) => s.product.id)]
  const [favoriteCounts, productIdsCanDelete] = await Promise.all([
    allProductIds.length > 0 ? getProductFavoriteCounts(allProductIds) : Promise.resolve({}),
    isOwnProfile && allProductIds.length > 0 ? getProductIdsCanDelete(allProductIds) : Promise.resolve(new Set<string>()),
  ])

  return (
    <ProfileClient
      profile={profile}
      products={products}
      soldItems={soldItems}
      reviews={reviews}
      purchasedItems={purchasedItems}
      reservedItems={reservedItems}
      favoriteCounts={favoriteCounts}
      productIdsCanDelete={Array.from(productIdsCanDelete)}
      isOwnProfile={isOwnProfile}
    />
  )
}
