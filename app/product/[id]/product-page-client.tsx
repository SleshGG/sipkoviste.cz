'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/header'
import { MobileNav } from '@/components/mobile-nav'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
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
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  Flag,
  Loader2,
} from 'lucide-react'
import type { Product as MockProduct } from '@/lib/data'
import type { ProductWithSeller } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'
import { sendMessageAction, getFavoriteProductIdsAction, toggleFavoriteAction } from '@/lib/supabase/actions'
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
}

export function ProductPageClient({ product }: ProductPageClientProps) {
  const router = useRouter()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)
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

  const handleSendMessage = async () => {
    const text =
      product.negotiable && offerAmount.trim() !== ''
        ? `Nabízím ${offerAmount.trim().replace(/\s/g, '')} Kč.\n\n${message.trim()}`
        : message.trim()
    if (!text) return
    setIsSending(true)
    const result = await sendMessageAction({
      receiver_id: product.seller.id,
      product_id: product.id,
      text,
    })
    setIsSending(false)

    if (result.error) {
      alert(result.error)
      return
    }

    setMessageSent(true)
    setOfferAmount('')
    setTimeout(() => {
      setIsMessageDialogOpen(false)
      setMessage('')
      setMessageSent(false)
    }, 1500)
  }

  const images = (product.images && product.images.length > 0) ? product.images : (product.image ? [product.image] : ['/placeholder.svg'])

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="mb-3 sm:mb-4 gap-2 -ml-2 sm:ml-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Zpět
          </Button>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="overflow-hidden border-border bg-card rounded-none sm:rounded-lg">
              <div className="relative aspect-[4/3] sm:aspect-square bg-secondary">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-full h-full cursor-zoom-in"
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setLightboxIndex(selectedImageIndex)
                      setIsImageLightboxOpen(true)
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
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Image Navigation */}
                {images.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-10 sm:w-10 rounded-full opacity-80 hover:opacity-100 z-10"
                      onClick={(e) => { e.stopPropagation(); prevImage() }}
                    >
                      <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-10 sm:w-10 rounded-full opacity-80 hover:opacity-100 z-10"
                      onClick={(e) => { e.stopPropagation(); nextImage() }}
                    >
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </>
                )}

                {/* Image Counter */}
                <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm z-10 pointer-events-none">
                  {selectedImageIndex + 1} / {images.length}
                </div>
              </div>

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="flex gap-1.5 sm:gap-2 p-2 sm:p-4 overflow-x-auto">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedImageIndex(index)
                        setLightboxIndex(index)
                        setIsImageLightboxOpen(true)
                      }}
                      className={`relative h-12 w-12 sm:h-16 sm:w-16 shrink-0 rounded-md sm:rounded-lg overflow-hidden border-2 transition-colors cursor-zoom-in ${
                        index === selectedImageIndex
                          ? 'border-primary'
                          : 'border-transparent hover:border-border'
                      }`}
                    >
                      <Image
                        src={image || "/placeholder.svg"}
                        alt={`${product.name} ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>

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
                  {currentUserId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleToggleFavorite}
                      disabled={isTogglingFavorite}
                      className={`h-8 w-8 sm:h-10 sm:w-10 ${isFavorited ? 'text-red-500' : ''}`}
                      title={isFavorited ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}
                    >
                      {isTogglingFavorite ? (
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      ) : (
                        <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${isFavorited ? 'fill-current' : ''}`} />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 sm:h-10 sm:w-10"
                    onClick={handleShare}
                    title="Sdílet"
                  >
                    <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
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
            <div className="flex gap-2 sm:gap-3">
              {(!('sold_at' in product) || !product.sold_at) && (
                <Button className="flex-1 gap-2 text-sm sm:text-base h-10 sm:h-11" onClick={() => setIsMessageDialogOpen(true)}>
                  <MessageCircle className="h-4 w-4" />
                  <span className="hidden xs:inline">Napsat</span> prodejci
                </Button>
              )}
              <Button
                variant="outline"
                className="gap-2 bg-transparent text-sm sm:text-base h-10 sm:h-11"
                onClick={() => setIsSafetyDialogOpen(true)}
              >
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Bezpečnostní</span> tipy
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
            <Card className="border-border bg-card">
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

            {/* Report */}
            <div className="flex items-center justify-center">
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <Flag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Nahlásit inzerát
              </Button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Message Dialog */}
      <Dialog
        open={isMessageDialogOpen}
        onOpenChange={(open) => {
          setIsMessageDialogOpen(open)
          if (!open) setOfferAmount('')
        }}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Napsat prodejci</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Odešlete zprávu prodejci {product.seller.name} ohledně tohoto zboží
              {product.negotiable && ' — prodejce je otevřen cenovým nabídkám.'}
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
              <h3 className="font-semibold text-sm sm:text-base mb-1">Zpráva odeslána!</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Prodejce vám odpoví do vaší schránky
              </p>
            </div>
          ) : (
            <>
              {product.negotiable && (
                <div className="mb-3 sm:mb-4">
                  <label htmlFor="offer-amount" className="text-xs sm:text-sm font-medium text-foreground block mb-1.5">
                    Vaše nabídka (Kč) — volitelné
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
              )}
              <Textarea
                placeholder="Dobrý den, mám zájem o toto zboží. Je stále k dispozici?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="resize-none text-sm"
              />
              <div className="flex gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent text-sm h-9 sm:h-10"
                  onClick={() => setIsMessageDialogOpen(false)}
                >
                  Zrušit
                </Button>
                <Button
                  className="flex-1 text-sm h-9 sm:h-10"
                  onClick={handleSendMessage}
                  disabled={isSending || (!message.trim() && !(product.negotiable && offerAmount.trim()))}
                >
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Odeslat'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      <Dialog open={isImageLightboxOpen} onOpenChange={setIsImageLightboxOpen}>
        <DialogContent
          className="max-w-[calc(100vw-2rem)] w-auto max-h-[calc(100vh-2rem)] p-0 border-0 bg-transparent shadow-none overflow-visible"
          closeButtonClassName="!bg-green-500 text-white rounded-full p-2 h-10 w-10 flex items-center justify-center hover:!bg-green-600 opacity-100 top-3 right-3 [&_svg]:size-5"
        >
          <DialogTitle className="sr-only">Náhled obrázku inzerátu</DialogTitle>
          <div className="relative flex items-center justify-center min-h-[200px] bg-black/90 rounded-lg">
            <div className="relative max-w-[calc(100vw-4rem)] max-h-[calc(100vh-5rem)] w-full h-full flex items-center justify-center">
              <Image
                src={images[lightboxIndex] || "/placeholder.svg"}
                alt={product.name}
                width={1200}
                height={900}
                className="object-contain max-h-[calc(100vh-5rem)] w-auto h-auto"
                unoptimized={images[lightboxIndex] === '/placeholder.svg'}
              />
            </div>
            {images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full opacity-90 hover:opacity-100"
                  onClick={() => setLightboxIndex((i) => (i <= 0 ? images.length - 1 : i - 1))}
                  aria-label="Předchozí obrázek"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full opacity-90 hover:opacity-100"
                  onClick={() => setLightboxIndex((i) => (i >= images.length - 1 ? 0 : i + 1))}
                  aria-label="Další obrázek"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {lightboxIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Safety Tips Dialog */}
      <Dialog open={isSafetyDialogOpen} onOpenChange={setIsSafetyDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
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
  )
}
