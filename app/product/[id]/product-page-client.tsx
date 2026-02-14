'use client'

import { useState, useEffect, useRef } from 'react'
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
  Heart,
  Share2,
  MessageCircle,
  Star,
  Shield,
  AlertTriangle,
  MapPin,
  Check,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react'
import type { Product as MockProduct } from '@/lib/data'
import type { ProductWithSeller } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'
import { sendBuyIntentAction, sendOfferAction, sendQuestionAction, getFavoriteProductIdsAction, toggleFavoriteAction } from '@/lib/supabase/actions'
import { AvatarWithOnline } from '@/components/avatar-with-online'
import { isUserOnline, formatMemberSince } from '@/lib/utils'

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
  const [message, setMessage] = useState('')
  const [isFavorited, setIsFavorited] = useState(false)
  const [messageSent, setMessageSent] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)
  const [isImageLightboxOpen, setIsImageLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [offerAmount, setOfferAmount] = useState('')
  const touchStartX = useRef<number | null>(null)
  const didSwipe = useRef(false)
  const slideDirection = useRef<number>(0)

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
    const result = await sendBuyIntentAction(
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
    setTimeout(() => {
      setDialogMode(null)
      setMessageSent(false)
      router.push(`/messages?to=${product.seller.id}&product=${product.id}`)
    }, 1200)
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
    setTimeout(() => {
      setDialogMode(null)
      setMessageSent(false)
      router.push(`/messages?to=${product.seller.id}&product=${product.id}`)
    }, 1200)
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
    setTimeout(() => {
      setDialogMode(null)
      setMessageSent(false)
      router.push(`/messages?to=${product.seller.id}&product=${product.id}`)
    }, 1200)
  }

  const images = (product.images && product.images.length > 0) ? product.images : (product.image ? [product.image] : ['/placeholder.svg'])

  return (
    <ProductScrollProvider
      header={<Header />}
    >
      <div className="min-h-screen md:min-h-0 bg-background pb-20 md:pb-0">
      <main className="md:container md:mx-auto md:px-4 md:py-6">
        {/* Mobil: fotka 4:3, 100% šířka pod headerem, tlačítko zpět ve fotce */}
        <div className="md:hidden relative w-full h-[62vh] bg-secondary -mt-px overflow-hidden">
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
              initial={(d) => (d === 0 ? {} : { x: d > 0 ? '-100%' : '100%', opacity: 0.9 })}
              animate={{ x: 0, opacity: 1 }}
              exit={(d) => (d === 0 ? { opacity: 0 } : { x: d > 0 ? '100%' : '-100%', opacity: 0.9 })}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute inset-0 cursor-pointer touch-pan-y"
              role="button"
              tabIndex={0}
              onTouchStart={(e) => {
                touchStartX.current = e.touches[0].clientX
                didSwipe.current = false
              }}
              onTouchEnd={(e) => {
                if (touchStartX.current === null || images.length <= 1) return
                const deltaX = e.changedTouches[0].clientX - touchStartX.current
                touchStartX.current = null
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

            {/* Prodaný inzerát */}
            {'sold_at' in product && product.sold_at && (
              <div className="rounded-lg bg-muted border border-border px-4 py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
                <p className="font-medium text-sm sm:text-base">Tento inzerát byl prodán a již není k dispozici.</p>
              </div>
            )}

            {/* Quick Actions */}
            <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 w-full ${('negotiable' in product && product.negotiable) && (!('sold_at' in product) || !product.sold_at) ? 'sm:grid-cols-4' : ''}`}>
              {(!('sold_at' in product) || !product.sold_at) && (
                <>
                  <Button className="w-full gap-2 text-sm sm:text-base h-10 sm:h-11" onClick={() => setDialogMode('buy')}>
                    <Check className="h-4 w-4" />
                    Koupit
                  </Button>
                  {('negotiable' in product && product.negotiable) && (
                    <Button variant="outline" className="w-full gap-2 text-sm sm:text-base h-10 sm:h-11" onClick={() => setDialogMode('offer')}>
                      <MessageCircle className="h-4 w-4" />
                      Nabídnout cenu
                    </Button>
                  )}
                  <Button variant="outline" className="w-full gap-2 text-sm sm:text-base h-10 sm:h-11" onClick={() => setDialogMode('question')}>
                    <MessageCircle className="h-4 w-4" />
                    Poslat dotaz
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                className={`w-full gap-2 bg-transparent text-sm sm:text-base h-10 sm:h-11 ${('sold_at' in product && product.sold_at) ? 'sm:col-span-3' : ''}`}
                onClick={() => setIsSafetyDialogOpen(true)}
              >
                <Shield className="h-4 w-4" />
                Bezpečnostní tipy
              </Button>
            </div>

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
            <Link href={`/profile/${product.seller.id}`}>
              <Card className="border-border bg-card hover:border-primary/50 transition-colors cursor-pointer">
                <div className="p-3 sm:p-4">
                  <h2 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Informace o prodejci</h2>
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
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
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    <span className="truncate">
                      Členem od {formatMemberSince(product.seller.member_since ?? product.seller.memberSince)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
            </Link>
          </motion.div>
        </div>
      </main>

      {/* Koupit / Nabídnout cenu / Poslat dotaz Dialog */}
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
            <DialogTitle className="text-base sm:text-lg">
              {dialogMode === 'buy' && 'Koupit produkt'}
              {dialogMode === 'offer' && 'Nabídnout cenu'}
              {dialogMode === 'question' && 'Poslat dotaz'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {dialogMode === 'buy' && `Prodejci ${product.seller.name} přijde e-mail. Poté si domluvíte podrobnosti v chatu.`}
              {dialogMode === 'offer' && `Prodejci přijde e-mail s vaší nabídkou. Pokud ji přijme, dostanete upozornění.`}
              {dialogMode === 'question' && `Prodejci ${product.seller.name} přijde zpráva do chatu (bez e-mailu).`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-secondary rounded-lg mb-3 sm:mb-4">
            <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-lg overflow-hidden shrink-0">
              <Image
                src={images[0] || product.image || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-xs sm:text-sm truncate">{product.name}</h4>
              <p className="text-primary font-semibold text-sm sm:text-base">{product.price.toLocaleString('cs-CZ')} Kč</p>
            </div>
          </div>
          {messageSent ? (
            <div className="text-center py-6 sm:py-8">
              <div className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base mb-1">Odesláno!</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Přesměrování do chatu…
              </p>
            </div>
          ) : (
            <>
              {dialogMode === 'buy' && (
                <>
                  <div className="p-3 sm:p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-3 sm:mb-4">
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Koupě je závazná.</p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      Koupě je závazná – po potvrzení bude inzerát označen jako prodaný a přestane se zobrazovat v nabídce. S prodejcem si poté domluvíte předání v chatu.
                    </p>
                  </div>
                  <div className="flex gap-2 sm:gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setDialogMode(null)}>
                      Zrušit
                    </Button>
                    <Button className="flex-1" onClick={handleBuy} disabled={isSending}>
                      {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ano, koupit'}
                    </Button>
                  </div>
                </>
              )}
              {dialogMode === 'offer' && (
                <>
                  <div className="mb-3 sm:mb-4">
                    <label htmlFor="offer-amount" className="text-xs sm:text-sm font-medium text-foreground block mb-1.5">
                      Vaše nabídka (Kč)
                    </label>
                    <input
                      id="offer-amount"
                      type="text"
                      inputMode="numeric"
                      placeholder="např. 1 500"
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
                </>
              )}
              {dialogMode === 'question' && (
                <>
                  <Textarea
                    placeholder="Dobrý den, mám zájem o toto zboží. Je stále k dispozici?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="resize-none text-sm mb-3 sm:mb-4"
                  />
                  <div className="flex gap-2 sm:gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setDialogMode(null)}>
                      Zrušit
                    </Button>
                    <Button className="flex-1" onClick={handleQuestion} disabled={isSending || !message.trim()}>
                      {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Odeslat'}
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Lightbox – jen fotka, max šířka, menu viditelné, zavření ve fotce */}
      <Dialog open={isImageLightboxOpen} onOpenChange={setIsImageLightboxOpen}>
        <DialogContent
          aria-describedby={undefined}
          className="fixed z-40 p-0 border-0 bg-transparent shadow-none overflow-hidden focus:outline-none focus-visible:outline-none focus-visible:ring-0
            !top-16 !bottom-0 !left-0 !right-0 !w-full !max-w-none !translate-x-0 !translate-y-0
            !flex !items-center !justify-center
            max-md:!bottom-16"
          overlayClassName="!z-40 backdrop-blur-md bg-black/50"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Náhled obrázku inzerátu</DialogTitle>
          <div className="flex items-center justify-center w-full h-full min-w-0 min-h-0 p-4">
            <div className="relative inline-block max-w-full max-h-full">
              <Image
                src={images[lightboxIndex] || "/placeholder.svg"}
                alt={product.name}
                width={1920}
                height={1080}
                className="object-contain w-auto h-auto max-w-[calc(100vw-2rem)] max-h-[calc(100vh-5rem)] max-md:max-h-[calc(100vh-8rem)] block"
                unoptimized={images[lightboxIndex] === '/placeholder.svg'}
              />
              <DialogClose
                className="!bg-white !text-black border !border-white/50 rounded-lg px-4 py-2 flex items-center gap-2 absolute top-4 right-4 z-50 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 hover:!bg-white/90 active:!bg-white/90"
                aria-label="Zavřít"
              >
                <X className="h-4 w-4" />
                <span className="text-sm font-medium">Zavřít</span>
              </DialogClose>
              {images.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 z-50 flex justify-center gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLightboxIndex(i)}
                      className={`h-2 w-2 rounded-full transition-colors ${
                        i === lightboxIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                      aria-label={`Fotka ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Safety Tips Dialog */}
      <Dialog open={isSafetyDialogOpen} onOpenChange={setIsSafetyDialogOpen}>
        <DialogContent aria-describedby={undefined} className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Bezpečnostní tipy pro kupující
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="p-3 sm:p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-start gap-2 sm:gap-3">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm">
                  Buďte při nákupu vybavení obezřetní. Hrajte fair play a držte se těchto zásad.
                </p>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-foreground">Zásady</h3>
            <ul className="space-y-2 sm:space-y-3">
              {safetyTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 sm:gap-3">
                  <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
                  </div>
                  <span className="text-xs sm:text-sm">
                    <strong className="text-foreground font-semibold">{tip.label}:</strong>{' '}
                    {tip.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      <MobileNav />
    </div>
    </ProductScrollProvider>
  )
}
