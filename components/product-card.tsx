'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Weight, Heart, Loader2, Eye } from 'lucide-react'
import type { ProductWithSeller } from '@/lib/supabase/types'
import type { Product as MockProduct } from '@/lib/data'
import { motion } from 'framer-motion'

interface ProductCardProps {
  product: ProductWithSeller | MockProduct
  index?: number
  showFavorite?: boolean
  isFavorite?: boolean
  onToggleFavorite?: (productId: string) => void
  isTogglingFavorite?: boolean
  /** Počet lidí, kteří mají produkt v oblíbených */
  favoriteCount?: number
  /** První obrázek v mřížce – urychlí LCP (Core Web Vitals) */
  priority?: boolean
  /** Zobrazit počet zobrazení (jen u vlastních inzerátů na profilu) */
  showViewCount?: boolean
  viewCount?: number
}

export function ProductCard({ product, index = 0, showFavorite, isFavorite, onToggleFavorite, isTogglingFavorite, favoriteCount = 0, priority, showViewCount, viewCount = 0 }: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link href={`/product/${product.id}`}>
        <Card className={`group overflow-hidden border-border bg-card transition-all duration-300 py-0 h-full flex flex-col gap-3 ${
          'sold_at' in product && product.sold_at
            ? 'opacity-75 hover:opacity-90'
            : 'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5'
        }`}>
          <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
            <Image
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover object-center transition-transform duration-300 group-hover:scale-105 mb-0 pb-0"
              priority={priority}
            />
            <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex flex-wrap gap-1">
              {showViewCount && (
                <div className="flex h-7 min-w-[28px] items-center justify-center gap-1 rounded bg-white dark:bg-white/90 px-2 text-[10px] sm:text-xs" style={{ color: '#2b2e33' }}>
                  <Eye className="h-3 w-3 shrink-0" />
                  <span className="tabular-nums">{viewCount}</span>
                </div>
              )}
              {'sold_at' in product && product.sold_at && (
                <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                  Prodané
                </Badge>
              )}
              <Badge
                variant={product.condition === 'Nové' ? 'default' : 'secondary'}
                className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
              >
                {product.condition}
              </Badge>
              {'negotiable' in product && product.negotiable && (
                <Badge variant="default" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                  Otevřeno nabídkám
                </Badge>
              )}
            </div>
            {showFavorite && onToggleFavorite && !('sold_at' in product && product.sold_at) && (
              <div className={`absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 flex items-center gap-0.5 rounded-full bg-background/80 pl-2.5 pr-3 py-1 ${favoriteCount <= 0 ? 'justify-center pr-2.5' : ''}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 sm:h-7 sm:w-7 hover:bg-transparent group/heart"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onToggleFavorite(product.id)
                  }}
                  disabled={isTogglingFavorite}
                  title={isFavorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}
                >
                  {isTogglingFavorite ? (
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                  ) : (
                    <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'group-hover/heart:fill-red-500 group-hover/heart:text-red-500'}`} />
                  )}
                </Button>
                {favoriteCount > 0 && (
                  <span className="text-[10px] sm:text-xs text-muted-foreground tabular-nums pl-0 pr-0">
                    {favoriteCount}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="px-2.5 sm:px-4 pt-0.5 sm:pt-1 pb-2.5 sm:pb-4 flex flex-col flex-1">
            <div className="flex items-start justify-between gap-1 mb-1 sm:mb-2">
              <h3 className="font-semibold text-xs sm:text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {product.name}
              </h3>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-2">{product.brand}</p>
            <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3">
              {product.weight && product.weight !== 'N/A' && (
                <span className="flex items-center gap-0.5 sm:gap-1">
                  <Weight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  {product.weight}
                </span>
              )}
              <span className="truncate">{product.material ?? ''}</span>
            </div>
            <div className="flex items-center justify-between mt-auto gap-2">
              <span className="text-sm sm:text-lg font-bold text-primary">
                {product.price.toLocaleString('cs-CZ')} Kč
              </span>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  )
}
