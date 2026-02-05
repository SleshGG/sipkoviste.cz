'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, Weight } from 'lucide-react'
import type { ProductWithSeller } from '@/lib/supabase/types'
import type { Product as MockProduct } from '@/lib/data'
import { motion } from 'framer-motion'

interface ProductCardProps {
  product: ProductWithSeller | MockProduct
  index?: number
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
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
            />
            <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2">
              <Badge
                variant={product.condition === 'Nové' ? 'default' : 'secondary'}
                className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
              >
                {product.condition}
              </Badge>
            </div>
          </div>
          <div className="p-2.5 sm:p-4 flex flex-col flex-1">
            <div className="flex items-start justify-between gap-1 mb-1 sm:mb-2">
              <h3 className="font-semibold text-xs sm:text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {product.name}
              </h3>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-2">{product.brand}</p>
            <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3">
              {product.weight !== 'N/A' && (
                <span className="flex items-center gap-0.5 sm:gap-1">
                  <Weight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  {product.weight}
                </span>
              )}
              <span className="truncate">{product.material}</span>
            </div>
            <div className="flex items-center justify-between mt-auto gap-1">
              <span className="text-sm sm:text-lg font-bold text-primary">
                {product.price.toLocaleString('cs-CZ')} Kc
              </span>
              {'seller' in product && product.seller && (
                <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs shrink-0">
                  <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-primary text-primary" />
                  <span>{product.seller.rating}</span>
                  <span className="text-muted-foreground hidden xs:inline">
                    ({product.seller.review_count ?? ('reviewCount' in product.seller ? product.seller.reviewCount : 0)})
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  )
}
