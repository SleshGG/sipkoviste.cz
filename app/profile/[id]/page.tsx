import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProfile, getProductsBySellerForProfile, getReviewsForProfile, getProductFavoriteCounts, getPurchasedItemsForUser, getSoldProductsWithBuyer, getProductIdsCanDelete } from '@/lib/supabase/database'
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

  const [profile, products, reviews, purchasedItems, soldItems] = await Promise.all([
    getProfile(profileId),
    getProductsBySellerForProfile(profileId, { includeSold: false }),
    getReviewsForProfile(profileId),
    isOwnProfile ? getPurchasedItemsForUser(profileId) : Promise.resolve([]),
    isOwnProfile ? getSoldProductsWithBuyer(profileId) : Promise.resolve([]),
  ])

  if (!profile) return notFound()

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
      favoriteCounts={favoriteCounts}
      productIdsCanDelete={Array.from(productIdsCanDelete)}
      isOwnProfile={isOwnProfile}
    />
  )
}
