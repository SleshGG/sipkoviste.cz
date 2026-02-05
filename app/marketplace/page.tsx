import { Suspense } from 'react'
import { MarketplaceClient } from './marketplace-client'
import { getProducts } from '@/lib/supabase/database'
import { mockProducts } from '@/lib/data'

export const dynamic = 'force-dynamic'

async function getMarketplaceProducts() {
  try {
    const products = await getProducts()
    // If no products in database, return mock data for demo
    if (products.length === 0) {
      // Convert mock data to match the database type structure
      return mockProducts.map(p => ({
        id: p.id,
        seller_id: p.seller.id,
        name: p.name,
        brand: p.brand,
        price: p.price,
        weight: p.weight === 'N/A' ? null : p.weight,
        material: p.material,
        condition: p.condition,
        category: p.category,
        image: p.image,
        images: p.images,
        description: p.description,
        negotiable: false,
        specs: p.specs,
        created_at: p.createdAt,
        seller: {
          id: p.seller.id,
          name: p.seller.name,
          avatar_url: p.seller.avatar,
          rating: p.seller.rating,
          review_count: p.seller.reviewCount,
          member_since: p.seller.memberSince,
          response_time: p.seller.responseTime,
        }
      }))
    }
    return products
  } catch (error) {
    console.error('Error fetching products:', error)
    // Return mock data as fallback
    return mockProducts.map(p => ({
      id: p.id,
      seller_id: p.seller.id,
      name: p.name,
      brand: p.brand,
      price: p.price,
      weight: p.weight === 'N/A' ? null : p.weight,
      material: p.material,
      condition: p.condition,
      category: p.category,
      image: p.image,
      images: p.images,
      description: p.description,
      negotiable: false,
      specs: p.specs,
      created_at: p.createdAt,
      seller: {
        id: p.seller.id,
        name: p.seller.name,
        avatar_url: p.seller.avatar,
        rating: p.seller.rating,
        review_count: p.seller.reviewCount,
        member_since: p.seller.memberSince,
        response_time: p.seller.responseTime,
      }
    }))
  }
}

export default async function MarketplacePage() {
  const products = await getMarketplaceProducts()

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <MarketplaceClient initialProducts={products as any} />
    </Suspense>
  )
}
