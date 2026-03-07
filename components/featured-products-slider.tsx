'use client'

import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/product-card'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ProductWithSeller } from '@/lib/supabase/types'

interface FeaturedProductsSliderProps {
  products: ProductWithSeller[]
  currentUserId: string | null
  favoriteIds: string[]
  onToggleFavorite: (productId: string) => void
  togglingProductId: string | null
  favoriteCounts: Record<string, number>
}

export function FeaturedProductsSlider({
  products,
  currentUserId,
  favoriteIds,
  onToggleFavorite,
  togglingProductId,
  favoriteCounts,
}: FeaturedProductsSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps', loop: false })
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    const update = () => {
      setCanScrollPrev(emblaApi.canScrollPrev())
      setCanScrollNext(emblaApi.canScrollNext())
    }
    update()
    emblaApi.on('select', update)
    return () => emblaApi.off('select', update)
  }, [emblaApi])

  return (
    <div className="hidden md:block relative">
      <div className="overflow-hidden rounded-xl" ref={emblaRef}>
        <div className="flex items-stretch gap-3">
          {products.map((product, index) => (
            <div
              key={`featured-desktop-${product.id}-${index}`}
              className="flex-[0_0_calc((100%-1.5rem)/4)] lg:flex-[0_0_calc((100%-2.25rem)/5)] xl:flex-[0_0_calc((100%-3.75rem)/6)] min-w-0 shrink-0 flex flex-col"
            >
              <ProductCard
                product={product}
                index={index}
                showFavorite={!!currentUserId}
                isFavorite={favoriteIds.includes(product.id)}
                onToggleFavorite={onToggleFavorite}
                isTogglingFavorite={togglingProductId === product.id}
                favoriteCount={favoriteCounts[product.id] ?? 0}
                priority={index === 0}
                returnUrl="/"
              />
            </div>
          ))}
        </div>
      </div>
      {(canScrollPrev || canScrollNext) && (
        <>
          {canScrollPrev && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-[37%] -translate-y-1/2 z-10 h-12 w-12 rounded-lg shadow-md bg-background/60 border-0 hover:bg-background/80 hover:text-primary backdrop-blur-md"
              onClick={scrollPrev}
              aria-label="Předchozí"
            >
              <ChevronLeft className="size-[23px]" />
            </Button>
          )}
          {canScrollNext && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-[37%] -translate-y-1/2 z-10 h-12 w-12 rounded-lg shadow-md bg-background/60 border-0 hover:bg-background/80 hover:text-primary backdrop-blur-md"
              onClick={scrollNext}
              aria-label="Další"
            >
              <ChevronRight className="size-[23px]" />
            </Button>
          )}
        </>
      )}
    </div>
  )
}
