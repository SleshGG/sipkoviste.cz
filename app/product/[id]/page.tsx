import { getProductById } from '@/lib/supabase/database'
import { mockProducts } from '@/lib/data'
import { ProductPageClient } from './product-page-client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

async function getProduct(id: string) {
  try {
    const product = await getProductById(id)
    
    if (product) {
      return {
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        weight: product.weight || 'N/A',
        material: product.material || 'N/A',
        condition: product.condition,
        category: product.category,
        image: product.image || '',
        images: product.images || [product.image || ''],
        description: product.description || '',
        specs: product.specs || {},
        seller: {
          id: product.seller?.id || '',
          name: product.seller?.name || 'Prodejce',
          avatar: product.seller?.avatar_url || '',
          rating: product.seller?.rating || 0,
          reviewCount: product.seller?.review_count || 0,
          memberSince: product.seller?.member_since || '',
          responseTime: product.seller?.response_time || '',
        },
        createdAt: product.created_at,
      }
    }
    
    // Fallback to mock data
    const mockProduct = mockProducts.find((p) => p.id === id)
    return mockProduct || null
  } catch (error) {
    console.error('Error fetching product:', error)
    // Fallback to mock data
    const mockProduct = mockProducts.find((p) => p.id === id)
    return mockProduct || null
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Produkt nenalezen</h1>
          <p className="text-muted-foreground mb-4">Tento inzerat byl mozna odstranen</p>
          <Link href="/marketplace">
            <Button>Zpet na trziste</Button>
          </Link>
        </div>
      </div>
    )
  }

  return <ProductPageClient product={product} />
}
