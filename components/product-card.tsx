'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, Weight, Heart, Loader2 } from 'lucide-react'
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
  /** První obrázek v mřížce – urychlí LCP (Core Web Vitals) */
  priority?: boolean
}

export function ProductCard({ product, index = 0, showFavorite, isFavorite, onToggleFavorite, isTogglingFavorite, priority }: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link href={`/product/${product.id}`}>
        <Card className="group overflow-hidden border-border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 py-0 h-full flex flex-col gap-1">
          <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
            <Image
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover object-center transition-transform duration-300 group-hover:scale-105 mb-0 pb-0"
              priority={priority}
            />
            <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex flex-wrap gap-1">
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
            {showFavorite && onToggleFavorite && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-background/80 hover:bg-background/90"
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
                  <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                )}
              </Button>
            )}
          </div>
          <div className="p-2.5 sm:p-4 flex flex-col flex-1">
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
              {'seller' in product && product.seller && (
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink-0">
                  <div className="relative h-6 w-6 sm:h-7 sm:w-7 rounded-full overflow-hidden bg-secondary shrink-0">
                    <Image
                      src={('avatar_url' in product.seller ? product.seller.avatar_url : product.seller.avatar) || '/placeholder.svg'}
                      alt={product.seller.name ?? ''}
                      fill
                      sizes="28px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col items-start min-w-0">
                    <span className="truncate w-full text-left text-[10px] sm:text-xs font-medium text-foreground">
                      {product.seller.name ?? 'Prodejce'}
                    </span>
                    <div className="flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
                      {('review_count' in product.seller ? product.seller.review_count : product.seller.reviewCount ?? 0) === 0 ? (
                        <>
                          <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground shrink-0" />
                          <span>0</span>
                          <span className="hidden xs:inline">Zatím nebyl ohodnocen</span>
                        </>
                      ) : (
                        <>
                          <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-primary text-primary shrink-0" />
                          <span>{Number(product.seller.rating ?? 0).toFixed(1)}</span>
                          <span className="hidden xs:inline">
                            ({'review_count' in product.seller ? product.seller.review_count : product.seller.reviewCount})
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  )
}
