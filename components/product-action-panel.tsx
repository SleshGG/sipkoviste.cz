'use client'

import { Button } from '@/components/ui/button'
import { Check, X, Loader2 } from 'lucide-react'

type ProductStatus = 'active' | 'reserved' | 'sold'

interface ProductActionPanelProps {
  status: ProductStatus
  currentUserId: string | null
  sellerId: string
  reservedBy: string | null
  onBuyClick: () => void
  onConfirmSale: () => void
  onCancelReservation: () => void
  isConfirming?: boolean
  isCanceling?: boolean
}

export function ProductActionPanel({
  status,
  currentUserId,
  sellerId,
  reservedBy,
  onBuyClick,
  onConfirmSale,
  onCancelReservation,
  isConfirming = false,
  isCanceling = false,
}: ProductActionPanelProps) {
  const isOwner = !!currentUserId && currentUserId === sellerId
  const isBuyer = !!currentUserId && reservedBy === currentUserId

  if (status === 'active') {
    if (currentUserId && currentUserId !== sellerId) {
      return (
        <Button onClick={onBuyClick}>
          <Check className="h-4 w-4" />
          Koupit
        </Button>
      )
    }
    return null
  }

  if (status === 'reserved') {
    if (isBuyer) {
      return (
        <p className="text-sm text-muted-foreground">
          Čeká se na potvrzení prodávajícím
        </p>
      )
    }
    if (isOwner) {
      return (
        <div className="flex gap-2">
          <Button onClick={onConfirmSale} disabled={isConfirming}>
            {isConfirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Potvrdit prodej
          </Button>
          <Button variant="outline" onClick={onCancelReservation} disabled={isCanceling}>
            {isCanceling ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            Zrušit rezervaci
          </Button>
        </div>
      )
    }
    return (
      <p className="text-sm text-muted-foreground">
        Produkt je momentálně rezervován
      </p>
    )
  }

  if (status === 'sold') {
    return (
      <p className="text-sm text-muted-foreground">
        Produkt byl prodán
      </p>
    )
  }

  return null
}
