'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Header } from '@/components/header'
import { MobileNav } from '@/components/mobile-nav'
import { ProductCard } from '@/components/product-card'
import { Button } from '@/components/ui/button'
import { getFavoriteProductIdsAction, toggleFavoriteAction } from '@/lib/supabase/actions'
import { Heart, ArrowLeft, Package } from 'lucide-react'
import type { ProductWithSeller } from '@/lib/supabase/types'

interface FavoritesClientProps {
  products: ProductWithSeller[]
  favoriteIds: string[]
  favoriteCounts: Record<string, number>
}

export function FavoritesClient({ products, favoriteIds, favoriteCounts }: FavoritesClientProps) {
  const [currentFavoriteIds, setCurrentFavoriteIds] = useState<string[]>(favoriteIds)
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null)

  useEffect(() => {
    getFavoriteProductIdsAction().then(({ ids }) => setCurrentFavoriteIds(ids))
  }, [])

  const handleToggleFavorite = async (productId: string) => {
    setTogglingProductId(productId)
    const result = await toggleFavoriteAction(productId)
    if (!result.error) {
      setCurrentFavoriteIds((prev) =>
        result.isFavorite ? [...prev, productId] : prev.filter((id) => id !== productId)
      )
    }
    setTogglingProductId(null)
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/marketplace">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Zpět na tržiště
            </Button>
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="h-6 w-6 fill-red-500 text-red-500" />
            Oblíbené
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {products.length === 0
              ? 'Zatím nemáte žádné oblíbené inzeráty.'
              : `${products.length} ${products.length === 1 ? 'inzerát' : products.length < 5 ? 'inzeráty' : 'inzerátů'} v oblíbených`}
          </p>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                showFavorite={true}
                isFavorite={currentFavoriteIds.includes(product.id)}
                onToggleFavorite={handleToggleFavorite}
                isTogglingFavorite={togglingProductId === product.id}
                favoriteCount={favoriteCounts[product.id] ?? 0}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-border rounded-lg">
            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              <Heart className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Žádné oblíbené</h3>
            <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
              Klikněte na srdíčko u inzerátu v tržišti a přidejte ho sem.
            </p>
            <Link href="/marketplace">
              <Button>Procházet tržiště</Button>
            </Link>
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  )
}
