'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/header'
import { MobileNav } from '@/components/mobile-nav'
import { ProductScrollProvider } from '@/lib/product-scroll-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  MessageCircle,
  Star,
  Shield,
  AlertTriangle,
  CircleHelp,
  Banknote,
  MapPin,
  Check,
  CheckCircle2,
  Loader2,
  X,
  Clock,
  Calendar,
} from 'lucide-react'
import type { Product as MockProduct } from '@/lib/data'
import type { ProductWithSeller } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'
import { reserveProductAction, confirmSaleAction, cancelReservationAction, expireReservationsAction, sendOfferAction, sendQuestionAction, getFavoriteProductIdsAction, toggleFavoriteAction, getProfileNameAction, incrementProductViewAction } from '@/lib/supabase/actions'
import { AuthDialog } from '@/components/auth-dialog'
import { AvatarWithOnline } from '@/components/avatar-with-online'
import { isUserOnline, formatMemberSince, formatLastSeenLabel } from '@/lib/utils'

type Product = ProductWithSeller | MockProduct

const safetyTips: { label: string; text: string }[] = [
  { label: 'Prověřte si hodnocení', text: 'Vždy se podívejte na hodnocení prodejce od ostatních šipkařů.' },
  { label: 'Chtějte aktuální fotku', text: 'U drahých šipek žádejte fotku s lístkem, kde je jméno prodejce a dnešní datum.' },
  { label: 'Osobní předání je jistota', text: 'Pokud je to možné, potkejte se u terče nebo na veřejném místě.' },
  { label: 'Příliš levné "limitky"?', text: 'Buďte opatrní u nabídek, které jsou až podezřele výhodné.' },
]

const categoryLabels: Record<string, string> = {
  'steel-darts': 'Ocelové šipky',
  'soft-darts': 'Softové šipky',
  'dartboards': 'Terče',
  'accessories': 'Příslušenství',
}

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return '0 min'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h > 0) return `${h} h ${m} min`
  return `${m} min`
}

function ReservationCountdown({ expiresAt, onExpired }: { expiresAt: string; onExpired: () => void }) {
  const [left, setLeft] = useState(() => Math.max(0, new Date(expiresAt).getTime() - Date.now()))
  const expiredRef = useRef(false)
  useEffect(() => {
    if (left <= 0 && !expiredRef.current) {
      expiredRef.current = true
      onExpired()
      return
    }
    const t = setInterval(() => {
      const next = Math.max(0, new Date(expiresAt).getTime() - Date.now())
      setLeft(next)
      if (next <= 0 && !expiredRef.current) {
        expiredRef.current = true
        onExpired()
      }
    }, 60000)
    return () => clearInterval(t)
  }, [expiresAt, onExpired, left])
  const isUrgent = left > 0 && left < 4 * 60 * 60 * 1000
  const isCritical = left > 0 && left < 60 * 60 * 1000
  return (
    <span className={`font-medium ${isCritical ? 'text-red-600 dark:text-red-400' : isUrgent ? 'text-amber-600 dark:text-amber-400' : ''}`}>
      {formatTimeLeft(left)}
    </span>
  )
}

interface ProductPageClientProps {
  product: Product
  favoriteCount?: number
  returnUrl?: string
}

function parseReturnUrl(raw: string | null | undefined): string | undefined {
  if (!raw || typeof raw !== 'string') return undefined
  if (raw === '.' || raw === '_') return '/'
  if (raw.startsWith('/')) return raw
  return `/${raw}`
}

export function ProductPageClient({ product, favoriteCount = 0, returnUrl: returnUrlProp }: ProductPageClientProps) {
  const router = useRouter()
  const returnUrl = (() => {
    if (typeof window !== 'undefined') {
      try {
        const from = new URLSearchParams(window.location.search).get('from')
        const parsed = parseReturnUrl(from)
        if (parsed) return parsed
      } catch {
        /* ignore */
      }
    }
    return parseReturnUrl(returnUrlProp)
  })()
  const backHref = (returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//')) ? returnUrl : '/marketplace'
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [dialogMode, setDialogMode] = useState<'buy' | 'offer' | 'question' | null>(null)
  const [isSafetyDialogOpen, setIsSafetyDialogOpen] = useState(false)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [isFavorited, setIsFavorited] = useState(false)
  const [messageSent, setMessageSent] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)
  const [isImageLightboxOpen, setIsImageLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [offerAmount, setOfferAmount] = useState('')
  const [productState, setProductState] = useState<{
    status?: 'active' | 'reserved' | 'sold'
    reserved_by?: string | null
    reservation_expires_at?: string | null
    reserved_by_name?: string | null
  }>(() => ({
    status: ('status' in product ? product.status : product.sold_at ? 'sold' : 'active') as 'active' | 'reserved' | 'sold',
    reserved_by: 'reserved_by' in product ? product.reserved_by : null,
    reservation_expires_at: 'reservation_expires_at' in product ? product.reservation_expires_at : null,
    reserved_by_name: 'reserved_by_name' in product ? product.reserved_by_name : null,
  }))
  const [isConfirming, setIsConfirming] = useState(false)
  const [isCanceling, setIsCanceling] = useState(false)
  const sellerId = 'seller' in product && product.seller ? (product.seller as { id?: string }).id : undefined
  const status = productState.status ?? ('status' in product ? product.status : product.sold_at ? 'sold' : 'active')
  const isBuyer = !!currentUserId && (productState.reserved_by === currentUserId || ('buyer_id' in product && (product as { buyer_id?: string }).buyer_id === currentUserId))
  const isSeller = !!currentUserId && sellerId === currentUserId
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const didSwipe = useRef(false)
  const slideDirection = useRef<number>(0)
  const gestureLockedHorizontal = useRef(false)
  const lightboxTouchStartX = useRef<number | null>(null)
  const lightboxTouchStartY = useRef<number | null>(null)
  const lightboxGestureLockedHorizontal = useRef(false)
  const galleryTouchRef = useRef<HTMLDivElement>(null)
  const lightboxTouchRef = useRef<HTMLDivElement>(null)
  const lightboxSlideDirection = useRef<number>(0)

  useEffect(() => {
    setProductState({
      status: ('status' in product ? product.status : product.sold_at ? 'sold' : 'active') as 'active' | 'reserved' | 'sold',
      reserved_by: 'reserved_by' in product ? product.reserved_by : null,
      reservation_expires_at: 'reservation_expires_at' in product ? product.reservation_expires_at : null,
      reserved_by_name: 'reserved_by_name' in product ? product.reserved_by_name : null,
    })
  }, [product])

  useEffect(() => {
    incrementProductViewAction(product.id)
  }, [product.id])

  useEffect(() => {
    if (status !== 'reserved' || !productState.reservation_expires_at) return
    const expiresAt = new Date(productState.reservation_expires_at).getTime()
    if (expiresAt <= Date.now()) {
      expireReservationsAction().then(() => router.refresh())
    }
  }, [status, productState.reservation_expires_at])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`product-${product.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products', filter: `id=eq.${product.id}` }, async (payload) => {
        const row = payload.new as { status?: string; reserved_by?: string | null; reservation_expires_at?: string | null; sold_at?: string | null }
        const reservedBy = row.reserved_by ?? null
        let reservedByName: string | null = null
        if (reservedBy) {
          const { name } = await getProfileNameAction(reservedBy)
          reservedByName = name
        }
        setProductState({
          status: (row.status ?? (row.sold_at ? 'sold' : 'active')) as 'active' | 'reserved' | 'sold',
          reserved_by: reservedBy,
          reservation_expires_at: row.reservation_expires_at ?? null,
          reserved_by_name: reservedByName,
        })
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [product.id])

  useEffect(() => {
    const supabase = createClient()
    const setUser = (user: { id: string } | null) => setCurrentUserId(user?.id ?? null)
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!currentUserId) {
      setIsFavorited(false)
      return
    }
    getFavoriteProductIdsAction().then(({ ids }) => {
      setIsFavorited(ids.includes(product.id))
    })
  }, [currentUserId, product.id])

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const title = `${product.name} | Šipkoviště.cz`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ url, title })
      } catch (err) {
        if ((err as Error).name !== 'AbortError') copyToClipboard(url)
      }
    } else {
      copyToClipboard(url)
    }
  }

  const copyToClipboard = (text: string) => {
    if (typeof navigator === 'undefined') return
    navigator.clipboard.writeText(text).then(() => alert('Odkaz zkopírován do schránky'))
  }

  const handleToggleFavorite = async () => {
    if (!currentUserId) return
    setIsTogglingFavorite(true)
    const result = await toggleFavoriteAction(product.id)
    if (!result.error) setIsFavorited(result.isFavorite)
    setIsTogglingFavorite(false)
  }

  const handleBuy = async () => {
    setIsSending(true)
    const result = await reserveProductAction(
      product.id,
      product.seller.id,
      product.name,
      product.seller.name ?? 'Prodejce'
    )
    setIsSending(false)
    if (result.error) {
      alert(result.error)
      return
    }
    setMessageSent(true)
    setProductState((prev) => ({ ...prev, status: 'reserved' as const, reserved_by: currentUserId ?? undefined, reservation_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }))
  }

  const handleOffer = async () => {
    const amount = parseInt(offerAmount.replace(/\s/g, ''), 10)
    if (!amount || amount < 1) {
      alert('Zadejte platnou částku.')
      return
    }
    setIsSending(true)
    const result = await sendOfferAction(
      product.id,
      product.seller.id,
      product.name,
      product.seller.name ?? 'Prodejce',
      amount
    )
    setIsSending(false)
    if (result.error) {
      alert(result.error)
      return
    }
    setMessageSent(true)
    setOfferAmount('')
  }

  const handleQuestion = async () => {
    if (!message.trim()) return
    setIsSending(true)
    const result = await sendQuestionAction(product.id, product.seller.id, message.trim())
    setIsSending(false)
    if (result.error) {
      alert(result.error)
      return
    }
    setMessageSent(true)
    setMessage('')
  }

  const handleConfirmSale = async () => {
    setIsConfirming(true)
    const err = await confirmSaleAction(product.id)
    setIsConfirming(false)
    if (err?.error) {
      alert(err.error)
      return
    }
    setProductState((p) => ({ ...p, status: 'sold' as const, reserved_by: null, reservation_expires_at: null, reserved_by_name: null }))
    router.refresh()
  }

  const handleCancelReservation = async () => {
    setIsCanceling(true)
    const err = await cancelReservationAction(product.id)
    setIsCanceling(false)
    if (err?.error) {
      alert(err.error)
      return
    }
    setProductState((p) => ({ ...p, status: 'active' as const, reserved_by: null, reservation_expires_at: null, reserved_by_name: null }))
    router.refresh()
  }

  const handleReservationExpired = useCallback(() => {
    setProductState((p) => ({ ...p, status: 'active' as const, reserved_by: null, reservation_expires_at: null, reserved_by_name: null }))
    expireReservationsAction().then(() => router.refresh())
  }, [])

  const images = useMemo(
    () => (product.images?.length ? product.images : product.image ? [product.image] : ['/placeholder.svg']),
    [product.images, product.image]
  )

  // Při horizontálním swipu na fotce blokovat vertikální scroll; při vertikálním nechat stránku posouvat
  useEffect(() => {
    const el = galleryTouchRef.current
    if (!el) return
    const onTouchMove = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null || images.length <= 1) return
      const dx = Math.abs(e.touches[0].clientX - touchStartX.current)
      const dy = Math.abs(e.touches[0].clientY - touchStartY.current)
      if (!gestureLockedHorizontal.current && (dx > 10 || dy > 10)) {
        gestureLockedHorizontal.current = dx > dy
      }
      if (gestureLockedHorizontal.current) e.preventDefault()
    }
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => el.removeEventListener('touchmove', onTouchMove)
  }, [images.length])

  useEffect(() => {
    const el = lightboxTouchRef.current
    if (!el) return
    const onTouchMove = (e: TouchEvent) => {
      if (lightboxTouchStartX.current === null || lightboxTouchStartY.current === null || images.length <= 1) return
      const dx = Math.abs(e.touches[0].clientX - lightboxTouchStartX.current)
      const dy = Math.abs(e.touches[0].clientY - lightboxTouchStartY.current)
      if (!lightboxGestureLockedHorizontal.current && (dx > 10 || dy > 10)) {
        lightboxGestureLockedHorizontal.current = dx > dy
      }
      if (lightboxGestureLockedHorizontal.current) e.preventDefault()
    }
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => el.removeEventListener('touchmove', onTouchMove)
  }, [images.length, isImageLightboxOpen])

  // Klávesové šipky v lightboxu (desktop)
  useEffect(() => {
    if (!isImageLightboxOpen || images.length <= 1) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        lightboxSlideDirection.current = 1
        setLightboxIndex((prev) => (prev - 1 + images.length) % images.length)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        lightboxSlideDirection.current = -1
        setLightboxIndex((prev) => (prev + 1) % images.length)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isImageLightboxOpen, images.length])

  return (
    <ProductScrollProvider
      header={<Header />}
    >
      <div className="min-h-screen md:min-h-0 bg-background pb-20 md:pb-0">
      <main className="md:container md:mx-auto md:px-4 md:py-6">
        {/* Mobil: fotka 4:3, 100% šířka pod headerem, tlačítko zpět ve fotce */}
        <div ref={galleryTouchRef} className="md:hidden relative w-full h-[62vh] bg-secondary -mt-px overflow-hidden">
          <a
            href={backHref}
            className="absolute left-3 top-3 z-40 h-10 w-10 min-w-10 min-h-10 rounded-lg border border-border bg-secondary flex items-center justify-center text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
            aria-label="Zpět"
          >
            <ArrowLeft className="size-5 shrink-0" strokeWidth={2} />
          </a>
          <AnimatePresence mode="sync" custom={slideDirection.current}>
            <motion.div
              key={selectedImageIndex}
              custom={slideDirection.current}
              initial={(d) => (d === 0 ? {} : { x: d > 0 ? '-100%' : '100%', opacity: 0.92 })}
              animate={{ x: 0, opacity: 1 }}
              exit={(d) => (d === 0 ? { opacity: 0 } : { x: d > 0 ? '100%' : '-100%', opacity: 0.92 })}
              transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
              className="absolute inset-0 cursor-pointer"
              role="button"
              tabIndex={0}
              onTouchStart={(e) => {
                touchStartX.current = e.touches[0].clientX
                touchStartY.current = e.touches[0].clientY
                gestureLockedHorizontal.current = false
                didSwipe.current = false
              }}
              onTouchEnd={(e) => {
                if (touchStartX.current === null || images.length <= 1) return
                const deltaX = e.changedTouches[0].clientX - touchStartX.current
                touchStartX.current = null
                touchStartY.current = null
                gestureLockedHorizontal.current = false
                if (Math.abs(deltaX) < 50) return
                didSwipe.current = true
                slideDirection.current = deltaX > 0 ? 1 : -1
                setSelectedImageIndex((prev) =>
                  deltaX > 0 ? (prev - 1 + images.length) % images.length : (prev + 1) % images.length
                )
              }}
              onClick={() => {
                if (didSwipe.current) return
                setIsImageLightboxOpen(true)
                setLightboxIndex(selectedImageIndex)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setLightboxIndex(selectedImageIndex)
                  setIsImageLightboxOpen(true)
                }
              }}
              aria-label="Zvětšit obrázek"
            >
              <Image
                src={images[selectedImageIndex] || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-cover"
                priority
                loading="eager"
                sizes="100vw"
              />
            </motion.div>
          </AnimatePresence>
          {images.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    slideDirection.current = i > selectedImageIndex ? -1 : 1
                    setSelectedImageIndex(i)
                  }}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    i === selectedImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                  aria-label={`Fotka ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 px-3 sm:px-4 pt-4 md:pt-0 md:px-0">
          {/* Levý sloupec: Back + Image Gallery – jen desktop */}
          <div className="hidden md:block w-full lg:min-w-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <a
                href={backHref}
                className="relative z-40 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors mb-3 sm:mb-4"
                aria-label="Zpět"
              >
                <ArrowLeft className="size-5 shrink-0" strokeWidth={2} />
              </a>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
            <div className="overflow-hidden rounded-lg">
              {/* PC: vlevo na výšku, vpravo dvě čtverce pod sebou – 2/3 + 1/3, přes celou půlku */}
              <div className="w-full">
                {images.length === 1 ? (
                  <div className="w-full aspect-[4/3]">
                    <button
                      onClick={() => {
                        setSelectedImageIndex(0)
                        setLightboxIndex(0)
                        setIsImageLightboxOpen(true)
                      }}
                      className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border-2 border-transparent cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 bg-secondary"
                      aria-label="Fotka 1"
                    >
                      <Image
                        src={images[0] || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover"
                        priority
                        loading="eager"
                        sizes="(max-width: 768px) 90vw, 420px"
                      />
                    </button>
                  </div>
                ) : (
                  <div className="w-full aspect-[3/2] grid grid-cols-[2fr_1fr] grid-rows-[1fr_1fr] gap-3">
                    {/* Vlevo: 1 fotka přes celou výšku (výška = 2 čtverce vpravo) */}
                    <button
                      onClick={() => {
                        setSelectedImageIndex(0)
                        setLightboxIndex(0)
                        setIsImageLightboxOpen(true)
                      }}
                      className="relative row-span-2 min-h-0 overflow-hidden rounded-lg border-2 border-transparent cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 bg-secondary"
                      aria-label="Fotka 1"
                    >
                      <Image
                        src={images[0] || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover"
                        priority
                        loading="eager"
                        sizes="(max-width: 768px) 100vw, 66vw"
                      />
                    </button>
                    {/* Vpravo: dvě čtverce pod sebou */}
                    {images.slice(1, 3).map((image, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedImageIndex(index + 1)
                          setLightboxIndex(index + 1)
                          setIsImageLightboxOpen(true)
                        }}
                        className="relative aspect-square w-full min-h-0 overflow-hidden rounded-lg border-2 border-transparent cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 bg-secondary"
                        aria-label={`Fotka ${index + 2}`}
                      >
                        <Image
                          src={image || "/placeholder.svg"}
                          alt={`${product.name} ${index + 2}`}
                          fill
                          loading="lazy"
                          className="object-cover"
                          sizes="33vw"
                        />
                      </button>
                    ))}
                  </div>
                )}
                {images.length > 3 && (
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      {images.slice(3).map((image, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedImageIndex(index + 3)
                            setLightboxIndex(index + 3)
                            setIsImageLightboxOpen(true)
                          }}
                          className="relative aspect-square w-full min-h-0 overflow-hidden rounded-lg border-2 border-transparent cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 bg-secondary"
                          aria-label={`Fotka ${index + 4}`}
                        >
                          <Image
                            src={image || "/placeholder.svg"}
                            alt={`${product.name} ${index + 4}`}
                            fill
                            loading="lazy"
                            className="object-cover"
                            sizes="(max-width: 1024px) 33vw, 160px"
                          />
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            </div>
            </motion.div>
          </div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-4 sm:space-y-6"
          >
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2">
                <Badge variant={product.condition === 'Nové' ? 'default' : 'secondary'} className="text-xs sm:text-sm">
                  {product.condition}
                </Badge>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className={`flex h-10 min-h-10 items-center justify-center gap-1 rounded-lg border border-border bg-secondary px-2.5 hover:bg-secondary/80 transition-colors ${favoriteCount <= 0 ? 'w-10' : 'min-w-10'}`}>
                    {currentUserId ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleToggleFavorite}
                        disabled={isTogglingFavorite}
                        className="h-8 w-8 hover:bg-transparent group/heart"
                        title={isFavorited ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}
                      >
                        {isTogglingFavorite ? (
                          <Loader2 className="size-5 animate-spin" />
                        ) : (
                          <Heart className={`size-5 transition-colors ${isFavorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground group-hover/heart:fill-red-500 group-hover/heart:text-red-500'}`} />
                        )}
                      </Button>
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center" title="Přihlaste se pro přidání do oblíbených">
                        <Heart className="size-5 text-muted-foreground" />
                      </span>
                    )}
                    {favoriteCount > 0 && (
                      <span className="text-xs sm:text-sm text-muted-foreground tabular-nums" title="Počet lidí s tímto produktem v oblíbených">
                        {favoriteCount}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleShare}
                    title="Sdílet"
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
                  >
                    <Share2 className="size-5 shrink-0" />
                  </button>
                </div>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">{product.name}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">{product.brand}</p>
              <div className="flex flex-wrap items-baseline gap-2 mt-3 sm:mt-4">
                <p className="text-2xl sm:text-3xl font-bold text-primary">
                  {product.price.toLocaleString('cs-CZ')} Kč
                </p>
                {product.negotiable && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    Otevřeno nabídkám
                  </Badge>
                )}
              </div>
              {product.negotiable && (
                <div className="mt-3 sm:mt-4 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 sm:px-4 sm:py-3">
                  <p className="text-sm sm:text-base font-medium text-foreground">
                    Prodejce je otevřen cenovým nabídkám — můžete mu napsat a nabídnout svou cenu.
                  </p>
                </div>
              )}
            </div>

            {/* ProductActionPanel: ACTIVE | RESERVED | SOLD */}
            {status === 'active' && (
              <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 w-full ${('negotiable' in product && product.negotiable) ? 'sm:grid-cols-4' : ''}`}>
                {currentUserId !== sellerId && (
                  <>
                    <Button
                      className="w-full gap-2 text-sm sm:text-base h-10 sm:h-11"
                      onClick={() => (currentUserId ? setDialogMode('buy') : setIsAuthDialogOpen(true))}
                    >
                      <Check className="h-4 w-4" />
                      Rezervovat
                    </Button>
                    {('negotiable' in product && product.negotiable) && (
                      <Button
                        variant="outline"
                        className="w-full gap-2 text-sm sm:text-base h-10 sm:h-11"
                        onClick={() => (currentUserId ? setDialogMode('offer') : setIsAuthDialogOpen(true))}
                      >
                        <MessageCircle className="h-4 w-4" />
                        Nabídnout cenu
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full gap-2 text-sm sm:text-base h-10 sm:h-11"
                      onClick={() => (currentUserId ? setDialogMode('question') : setIsAuthDialogOpen(true))}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Poslat dotaz
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  className={`w-full gap-2 bg-transparent text-sm sm:text-base h-10 sm:h-11 ${!currentUserId || currentUserId === sellerId ? 'sm:col-span-3' : ''}`}
                  onClick={() => setIsSafetyDialogOpen(true)}
                >
                  <Shield className="h-4 w-4" />
                  Bezpečnostní tipy
                </Button>
              </div>
            )}

            {status === 'reserved' && (
              <div className="space-y-3">
                {isBuyer && (
                  <div className="rounded-lg bg-muted border border-border px-4 py-3 sm:py-4">
                    <h3 className="font-semibold text-sm sm:text-base mb-1">Čeká se na potvrzení prodávajícím</h3>
                    <p className="text-sm text-muted-foreground mb-2">Prodávající má 24 hodin na potvrzení prodeje.</p>
                    {productState.reservation_expires_at && (
                      <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                        Rezervace vyprší za: <ReservationCountdown expiresAt={productState.reservation_expires_at} onExpired={handleReservationExpired} />
                      </p>
                    )}
                    {sellerId && (
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push(`/messages?to=${sellerId}&product=${product.id}`)}>
                        <MessageCircle className="h-4 w-4" />
                        Zobrazit chat
                      </Button>
                    )}
                  </div>
                )}
                {isSeller && (
                  <div className="rounded-lg bg-primary/10 border border-primary/30 px-4 py-3 sm:py-4">
                    <h3 className="font-semibold text-sm sm:text-base mb-1">Zájem o váš produkt</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {((productState.reserved_by_name ?? ('reserved_by_name' in product ? product.reserved_by_name : null)) || 'Uživatel')} si chce tento produkt koupit. Potvrzením dokončíte prodej.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button className="gap-2" onClick={handleConfirmSale} disabled={isConfirming}>
                        {isConfirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Potvrdit prodej
                      </Button>
                      <Button variant="outline" onClick={handleCancelReservation} disabled={isCanceling}>
                        {isCanceling ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                        Zrušit rezervaci
                      </Button>
                      {productState.reserved_by && (
                        <Button variant="outline" className="gap-2" onClick={() => router.push(`/messages?to=${productState.reserved_by}&product=${product.id}`)}>
                          <MessageCircle className="h-4 w-4" />
                          Zobrazit chat
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {!isBuyer && !isSeller && (
                  <div className="rounded-lg bg-muted border border-border px-4 py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
                    <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500 shrink-0" />
                    <p className="font-medium text-sm sm:text-base">Tento produkt je rezervován.</p>
                  </div>
                )}
                <Button variant="outline" className="w-full gap-2 text-sm sm:text-base h-10 sm:h-11" onClick={() => setIsSafetyDialogOpen(true)}>
                  <Shield className="h-4 w-4" />
                  Bezpečnostní tipy
                </Button>
              </div>
            )}

            {status === 'sold' && (
              <div className="space-y-3">
                <div className="rounded-lg bg-muted border border-border px-4 py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
                  <p className="font-medium text-sm sm:text-base">Produkt byl prodán.</p>
                </div>
                {(isBuyer || isSeller) && (
                  <Button variant="outline" className="w-full gap-2" onClick={() => router.push('/profile/me')}>
                    <Star className="h-4 w-4" />
                    Ohodnotit
                  </Button>
                )}
                <Button variant="outline" className="w-full gap-2 text-sm sm:text-base h-10 sm:h-11" onClick={() => setIsSafetyDialogOpen(true)}>
                  <Shield className="h-4 w-4" />
                  Bezpečnostní tipy
                </Button>
              </div>
            )}

            {/* Description */}
            <div>
              <h2 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Popis</h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            {/* Specifications */}
            <Card className="border-border bg-card">
              <div className="p-3 sm:p-4">
                <h2 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Specifikace</h2>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between py-1.5 sm:py-2 border-b border-border">
                    <span className="text-xs sm:text-sm text-muted-foreground">Kategorie</span>
                    <span className="text-xs sm:text-sm font-medium">
                      {categoryLabels[product.category] ?? product.category}
                    </span>
                  </div>
                  {product.brand && (
                    <div className="flex justify-between py-1.5 sm:py-2 border-b border-border">
                      <span className="text-xs sm:text-sm text-muted-foreground">Značka</span>
                      <span className="text-xs sm:text-sm font-medium">{product.brand}</span>
                    </div>
                  )}
                  {product.condition && (
                    <div className="flex justify-between py-1.5 sm:py-2 border-b border-border">
                      <span className="text-xs sm:text-sm text-muted-foreground">Stav</span>
                      <span className="text-xs sm:text-sm font-medium">{product.condition}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1.5 sm:py-2 border-b border-border">
                    <span className="text-xs sm:text-sm text-muted-foreground">Hmotnost</span>
                    <span className="text-xs sm:text-sm font-medium">{product.weight ?? '—'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 sm:py-2 border-b border-border">
                    <span className="text-xs sm:text-sm text-muted-foreground">Materiál</span>
                    <span className="text-xs sm:text-sm font-medium">{product.material ?? '—'}</span>
                  </div>
                  {Object.entries(product.specs || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-1.5 sm:py-2 border-b border-border last:border-0">
                      <span className="text-xs sm:text-sm text-muted-foreground">{key}</span>
                      <span className="text-xs sm:text-sm font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Seller Card */}
            <Card className="border-border bg-card gap-0">
              <div className="p-0 flex-1 flex flex-col">
                <div className="flex flex-col gap-0 justify-center flex-1">
                  {/* Fotka, jméno, hodnocení – odkaz na profil */}
                  <Link href={`/profile/${product.seller.id}`} className="group flex items-center gap-3 sm:gap-4 rounded-t-xl rounded-b-none border border-black p-4 m-0.5 -mb-0.5 hover:bg-secondary/50 transition-colors">
                    <AvatarWithOnline
                      src={product.seller.avatar_url ?? product.seller.avatar ?? '/placeholder.svg'}
                      alt={product.seller.name ?? 'Prodejce'}
                      size="lg"
                      isOnline={'show_online_status' in product.seller && 'last_seen_at' in product.seller && isUserOnline(product.seller.show_online_status, product.seller.last_seen_at)}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base truncate">{product.seller.name ?? 'Prodejce'}</h3>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                        {(product.seller.reviewCount ?? product.seller.review_count ?? 0) === 0 ? (
                          <>
                            <Star className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                            <span className="text-foreground font-medium">0</span>
                            <span className="truncate">Zatím nebyl ohodnocen</span>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-0.5 sm:gap-1">
                              <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-primary text-primary" />
                              <span className="text-foreground font-medium">
                                {Number(product.seller.rating ?? 0).toFixed(1)}
                              </span>
                            </div>
                            <span className="truncate">({product.seller.reviewCount ?? product.seller.review_count} hodnocení)</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground group-hover:bg-secondary/80 group-hover:text-foreground transition-colors" aria-hidden>
                      <ArrowRight className="size-5 shrink-0" strokeWidth={2} />
                    </span>
                  </Link>

                    <div className="flex items-center gap-0 text-muted-foreground/40 p-0 m-0 leading-[0]" aria-hidden>
                      <span className="flex-1 h-px bg-border" />
                      <span className="text-[10px] leading-none">·</span>
                      <span className="flex-1 h-px bg-border" />
                    </div>

                    {/* Naposledy online */}
                    {(() => {
                      const lastSeenLabel = formatLastSeenLabel('show_online_status' in product.seller ? product.seller.show_online_status : true, 'last_seen_at' in product.seller ? product.seller.last_seen_at : null)
                      return lastSeenLabel ? (
                        <>
                          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground pt-[22px] pb-[22px] px-4 h-[50px]">
                            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                            <span>Naposledy online: {lastSeenLabel}</span>
                          </div>
                          <div className="flex items-center gap-0 text-muted-foreground/40 p-0 m-0 leading-[0]" aria-hidden>
                            <span className="flex-1 h-px bg-border" />
                            <span className="text-[10px] leading-none">·</span>
                            <span className="flex-1 h-px bg-border" />
                          </div>
                        </>
                      ) : null
                    })()}

                    {/* Člen od */}
                    <div className="flex items-center justify-start gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground pt-4 pb-4 mb-0 px-4 h-[60px]">
                      <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                      <span>Člen od {formatMemberSince(product.seller.member_since ?? product.seller.memberSince)}</span>
                    </div>
                  </div>
                </div>
              </Card>
          </motion.div>
        </div>
      </main>

      {/* Rezervovat / Nabídnout cenu / Poslat dotaz Dialog */}
      <Dialog
        open={dialogMode !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDialogMode(null)
            setOfferAmount('')
            setMessage('')
          }
        }}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="sr-only">
              {dialogMode === 'buy' && 'Rezervace'}
              {dialogMode === 'offer' && 'Nabídnout cenu'}
              {dialogMode === 'question' && 'Poslat dotaz'}
            </DialogTitle>
          </DialogHeader>
          {messageSent ? (
            <div className="text-left">
              <div className="h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Check className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base mb-1">
                {dialogMode === 'buy' && 'Vaše rezervace je nyní aktivní'}
                {dialogMode === 'offer' && 'Vaše nabídka byla odeslána'}
                {dialogMode === 'question' && 'Vaše zpráva byla odeslána'}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                {dialogMode === 'buy' && 'Nyní máte 24h na domluvení podrobností prodeje. Po 24h vyprší vaše rezervace nebo prodávající potvrdí prodej.'}
                {dialogMode === 'offer' && 'Prodejci byla odeslána vaše nabídka. Jakmile se prodávající rozhodne, přijde vám upozornění.'}
                {dialogMode === 'question' && `Prodejci ${product.seller.name} přišla vaše zpráva do chatu. Můžete pokračovat v konverzaci.`}
              </p>
              <Button
                className="gap-2"
                onClick={() => {
                  setDialogMode(null)
                  setMessageSent(false)
                  router.push(`/messages?to=${product.seller.id}&product=${product.id}`)
                }}
              >
                <MessageCircle className="h-4 w-4" />
                Napsat prodejci
              </Button>
            </div>
          ) : (
            <>
              {dialogMode === 'buy' && (
                <div className="text-left">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CircleHelp className="h-5 w-5 sm:h-6 sm:w-6 text-primary" aria-hidden />
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base mb-1">Zarezervujte si produkt na 24 hodin</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-6">
                    Po kliknutí odešleme prodejci upozornění a otevřeme vám společný chat. Máte celých 24 hodin na to, abyste si doladili detaily dopravy a platby. Pokud se do té doby nedomluvíte, produkt se automaticky vrátí zpět do prodeje.
                  </p>
                  <div className="flex gap-2 sm:gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setDialogMode(null)}>
                      Zrušit
                    </Button>
                    <Button className="flex-1" onClick={handleBuy} disabled={isSending}>
                      {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ano, rezervovat'}
                    </Button>
                  </div>
                </div>
              )}
              {dialogMode === 'offer' && (
                <div className="text-left">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Banknote className="h-5 w-5 sm:h-6 sm:w-6 text-primary" aria-hidden />
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base mb-1">Nabídněte svou cenu</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                    Zadejte částku, kterou jste ochotni za produkt zaplatit. Prodejci přijde vaše nabídka do chatu a může ji přijmout nebo odmítnout.
                  </p>
                  <div className="mb-4 sm:mb-6">
                    <input
                      id="offer-amount"
                      type="text"
                      inputMode="numeric"
                      placeholder="např. 1 500 Kč"
                      aria-label="Vaše nabídka v Kč"
                      value={offerAmount}
                      onChange={(e) => setOfferAmount(e.target.value.replace(/[^\d\s]/g, ''))}
                      className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div className="flex gap-2 sm:gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setDialogMode(null)}>
                      Zrušit
                    </Button>
                    <Button className="flex-1" onClick={handleOffer} disabled={isSending || !offerAmount.trim()}>
                      {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Odeslat nabídku'}
                    </Button>
                  </div>
                </div>
              )}
              {dialogMode === 'question' && (
                <div className="text-left">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" aria-hidden />
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base mb-1">Poslat dotaz prodejci</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                    {`Prodejci ${product.seller.name} přijde vaše zpráva do chatu. Můžete se zeptat na dostupnost, stav zboží nebo dopravu.`}
                  </p>
                  <div className="mb-4 sm:mb-6 text-left">
                    <Textarea
                      placeholder="Dobrý den, mám zájem o toto zboží. Je stále k dispozici?"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      className="resize-none text-sm"
                    />
                  </div>
                  <div className="flex gap-2 sm:gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setDialogMode(null)}>
                      Zrušit
                    </Button>
                    <Button className="flex-1" onClick={handleQuestion} disabled={isSending || !message.trim()}>
                      {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Odeslat'}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Lightbox – konzistentní na všech telefonech (safe-area, fixní rozměry) */}
      <Dialog open={isImageLightboxOpen} onOpenChange={setIsImageLightboxOpen}>
        <DialogContent
          aria-describedby={undefined}
          className="fixed z-40 p-0 border-0 bg-transparent shadow-none overflow-hidden focus:outline-none focus-visible:outline-none focus-visible:ring-0
            !left-0 !right-0 !w-full !max-w-none !translate-x-0 !translate-y-0
            !flex !flex-col !grid-none
            md:!top-16 md:!bottom-0
            max-md:!top-[72px] max-md:!bottom-[64px] max-md:!h-[calc(100vh-136px)]"
          overlayClassName="!z-40 backdrop-blur-md bg-black/50"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Náhled obrázku inzerátu</DialogTitle>
          {/* Tlačítko zavřít úplně nahoře */}
          <DialogClose
            className="absolute top-2 right-2 md:top-10 md:right-10 z-50 !bg-white !text-black border !border-white/50 rounded-lg px-4 py-2 flex items-center gap-2 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 hover:!bg-white/90 active:!bg-white/90"
            aria-label="Zavřít"
          >
            <X className="h-4 w-4" />
            <span className="text-sm font-medium">Zavřít</span>
          </DialogClose>
          {/* Fotka na středu */}
          <div
            ref={lightboxTouchRef}
            className="flex-1 flex items-center justify-center min-h-0 overflow-hidden px-4 relative"
            onTouchStart={(e) => {
              if (images.length <= 1) return
              lightboxTouchStartX.current = e.touches[0].clientX
              lightboxTouchStartY.current = e.touches[0].clientY
              lightboxGestureLockedHorizontal.current = false
            }}
            onTouchEnd={(e) => {
              if (lightboxTouchStartX.current === null || images.length <= 1) return
              const deltaX = e.changedTouches[0].clientX - lightboxTouchStartX.current
              lightboxTouchStartX.current = null
              lightboxTouchStartY.current = null
              lightboxGestureLockedHorizontal.current = false
              if (Math.abs(deltaX) < 50) return
              lightboxSlideDirection.current = deltaX > 0 ? 1 : -1
              setLightboxIndex((prev) =>
                deltaX > 0 ? (prev - 1 + images.length) % images.length : (prev + 1) % images.length
              )
            }}
          >
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="sync" custom={lightboxSlideDirection.current}>
                <motion.div
                  key={lightboxIndex}
                  custom={lightboxSlideDirection.current}
                  initial={(d) => (d === 0 ? {} : { x: d > 0 ? '-100%' : '100%', opacity: 0.92 })}
                  animate={{ x: 0, opacity: 1 }}
                  exit={(d) => (d === 0 ? { opacity: 0 } : { x: d > 0 ? '100%' : '-100%', opacity: 0.92 })}
                  transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
                  className="absolute inset-0 md:top-10 flex items-center justify-center"
                >
                  <Image
                    src={images[lightboxIndex] || "/placeholder.svg"}
                    alt={product.name}
                    width={1920}
                    height={1080}
                    sizes="100vw"
                    className="object-contain w-auto h-auto max-w-full max-h-full block"
                    unoptimized={images[lightboxIndex] === '/placeholder.svg'}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
            {/* Šipky pro desktop – předchozí / další */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    lightboxSlideDirection.current = 1
                    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length)
                  }}
                  className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-50 h-12 w-12 items-center justify-center rounded-lg bg-white/60 backdrop-blur-md border-0 hover:bg-white/80 hover:text-black transition-colors text-black"
                  aria-label="Předchozí fotka"
                >
                  <ChevronLeft className="size-[23px]" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    lightboxSlideDirection.current = -1
                    setLightboxIndex((prev) => (prev + 1) % images.length)
                  }}
                  className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-50 h-12 w-12 items-center justify-center rounded-lg bg-white/60 backdrop-blur-md border-0 hover:bg-white/80 hover:text-black transition-colors text-black"
                  aria-label="Další fotka"
                >
                  <ChevronRight className="size-[23px]" />
                </button>
              </>
            )}
          </div>
          {/* Tečky dole mimo obrázek */}
          {images.length > 1 && (
            <div className="flex justify-center gap-1.5 py-4 shrink-0">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    lightboxSlideDirection.current = i > lightboxIndex ? -1 : 1
                    setLightboxIndex(i)
                  }}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    i === lightboxIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                  aria-label={`Fotka ${i + 1}`}
                />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Safety Tips Dialog */}
      <Dialog open={isSafetyDialogOpen} onOpenChange={setIsSafetyDialogOpen}>
        <DialogContent aria-describedby={undefined} className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogTitle className="sr-only">Bezpečnostní tipy pro kupující</DialogTitle>
          <div className="text-left">
            <div className="h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" aria-hidden />
            </div>
            <h3 className="font-semibold text-sm sm:text-base mb-1">Bezpečnostní tipy pro kupující</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              Buďte při nákupu vybavení obezřetní. Hrajte fair play a držte se těchto zásad.
            </p>
            <ul className="space-y-2 sm:space-y-3">
              {safetyTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 sm:gap-3">
                  <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
                  </div>
                  <span className="text-xs sm:text-sm">
                    <strong className="text-foreground font-semibold">{tip.label}:</strong>{' '}
                    {tip.text}
                  </span>
                </li>
              ))}
            </ul>
            <Button className="mt-6" variant="outline" onClick={() => setIsSafetyDialogOpen(false)}>
              Zavřít
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AuthDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} />

      <MobileNav />
    </div>
    </ProductScrollProvider>
  )
}
