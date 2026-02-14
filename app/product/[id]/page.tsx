import type { Metadata } from 'next'
import { getProductById, getProductFavoriteCounts } from '@/lib/supabase/database'
import { incrementProductViewAction } from '@/lib/supabase/actions'
import { defaultOgImage, defaultOgImageUrl } from '@/lib/site-config'
import { ProductPageClient } from './product-page-client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

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
        images: (product.images && product.images.length > 0) ? product.images : [product.image || '/placeholder.svg'],
        description: product.description || '',
        specs: product.specs || {},
        negotiable: product.negotiable ?? false,
        sold_at: product.sold_at ?? null,
        seller: {
          id: product.seller?.id || '',
          name: product.seller?.name || 'Prodejce',
          avatar: product.seller?.avatar_url || '',
          rating: product.seller?.rating || 0,
          reviewCount: product.seller?.review_count || 0,
          memberSince: product.seller?.member_since || '',
          responseTime: product.seller?.response_time || '',
          show_online_status: product.seller?.show_online_status ?? true,
          last_seen_at: product.seller?.last_seen_at ?? null,
        },
        createdAt: product.created_at,
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

/** Pro og:image musí být vždy přímá URL, ne _next/image – FB crawler jinak obrázek neumí načíst. */
function ensureDirectImageUrl(url: string): string {
  if (url.includes('/_next/image')) {
    const match = url.match(/[?&]url=([^&]+)/)
    if (match) return decodeURIComponent(match[1])
  }
  return url
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) return { title: 'Produkt nenalezen' }
  const title = `${product.name}${product.brand ? ` – ${product.brand}` : ''}`
  const description = product.description?.slice(0, 160) || `Inzerát: ${product.name}. Cena ${product.price} Kč.`
  const rawImage = product.image ? ensureDirectImageUrl(product.image) : undefined
  const ogImage = rawImage ? { url: rawImage, width: 1200, height: 630 } : defaultOgImage
  const twitterImage = rawImage ?? defaultOgImageUrl
  return {
    title,
    description,
    openGraph: { title, description, images: [ogImage] },
    twitter: { card: 'summary_large_image', title, description, images: [twitterImage] },
  }
}

export default async function ProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string | string[] }> }) {
  const { id } = await params
  const resolved = await searchParams
  const from = typeof resolved.from === 'string' ? resolved.from : resolved.from?.[0]
  const [product, favoriteCounts] = await Promise.all([
    getProduct(id),
    getProductFavoriteCounts([id]),
  ])

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Produkt nenalezen</h1>
          <p className="text-muted-foreground mb-4">Tento inzerát byl možná odstraněn</p>
          <Link
            href="/marketplace"
            className="relative z-40 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
            aria-label="Zpět"
          >
            <ArrowLeft className="size-5 shrink-0" strokeWidth={2} />
          </Link>
        </div>
      </div>
    )
  }

  const favoriteCount = favoriteCounts[id] ?? 0

  incrementProductViewAction(id)

  return <ProductPageClient product={product} favoriteCount={favoriteCount} returnUrl={from} />
}
