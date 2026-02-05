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
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Check,
  Flag,
  Loader2,
} from 'lucide-react'
import type { Product } from '@/lib/data'
import { createClient } from '@/lib/supabase/client'
import { sendMessageAction } from '@/lib/supabase/actions'

const safetyTips = [
  'Při osobním předání se setkejte na veřejném místě',
  'Před zaplacením si zboží důkladně prohlédněte',
  'Používejte bezpečné platební metody',
  'Buďte obezřetní u nabídek, které jsou příliš výhodné',
  'Uchovávejte záznamy veškeré komunikace',
]

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

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null)
    })
  }, [])

  const handleSendMessage = async () => {
    if (!currentUserId) {
      // User not logged in - redirect to login or show message
      alert('Pro odesilani zprav se musite prihlasit')
      return
    }

    setIsSending(true)
    
    const result = await sendMessageAction({
      receiver_id: product.seller.id,
      product_id: product.id,
      text: message,
    })

    setIsSending(false)

    if (result.error) {
      alert(result.error)
      return
    }

    setMessageSent(true)
    setTimeout(() => {
      setIsMessageDialogOpen(false)
      setMessage('')
      setMessageSent(false)
    }, 1500)
  }

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % product.images.length)
  }

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)
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
                    className="relative w-full h-full"
                  >
                    <Image
                      src={product.images[selectedImageIndex] || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover"
                      priority
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Image Navigation */}
                {product.images.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-10 sm:w-10 rounded-full opacity-80 hover:opacity-100"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-10 sm:w-10 rounded-full opacity-80 hover:opacity-100"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </>
                )}

                {/* Image Counter */}
                <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm">
                  {selectedImageIndex + 1} / {product.images.length}
                </div>
              </div>

              {/* Thumbnail Strip */}
              {product.images.length > 1 && (
                <div className="flex gap-1.5 sm:gap-2 p-2 sm:p-4 overflow-x-auto">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative h-12 w-12 sm:h-16 sm:w-16 shrink-0 rounded-md sm:rounded-lg overflow-hidden border-2 transition-colors ${
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsFavorited(!isFavorited)}
                    className={`h-8 w-8 sm:h-10 sm:w-10 ${isFavorited ? 'text-red-500' : ''}`}
                  >
                    <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${isFavorited ? 'fill-current' : ''}`} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                    <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">{product.name}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">{product.brand}</p>
              <p className="text-2xl sm:text-3xl font-bold text-primary mt-3 sm:mt-4">
                {product.price.toLocaleString('cs-CZ')} Kč
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 sm:gap-3">
              <Button className="flex-1 gap-2 text-sm sm:text-base h-10 sm:h-11" onClick={() => setIsMessageDialogOpen(true)}>
                <MessageCircle className="h-4 w-4" />
                <span className="hidden xs:inline">Napsat</span> prodejci
              </Button>
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
                    <span className="text-xs sm:text-sm text-muted-foreground">Hmotnost</span>
                    <span className="text-xs sm:text-sm font-medium">{product.weight}</span>
                  </div>
                  <div className="flex justify-between py-1.5 sm:py-2 border-b border-border">
                    <span className="text-xs sm:text-sm text-muted-foreground">Materiál</span>
                    <span className="text-xs sm:text-sm font-medium">{product.material}</span>
                  </div>
                  {Object.entries(product.specs).map(([key, value]) => (
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
                  <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-full overflow-hidden bg-secondary shrink-0">
                    <Image
                      src={product.seller.avatar || "/placeholder.svg"}
                      alt={product.seller.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base truncate">{product.seller.name}</h3>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-primary text-primary" />
                        <span className="text-foreground font-medium">
                          {product.seller.rating}
                        </span>
                      </div>
                      <span className="truncate">({product.seller.reviewCount} hodnocení)</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    <span className="truncate">Odpovídá {product.seller.responseTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    <span className="truncate">Členem od {product.seller.memberSince}</span>
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
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Napsat prodejci</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Odešlete zprávu prodejci {product.seller.name} ohledně tohoto zboží
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-secondary rounded-lg mb-3 sm:mb-4">
            <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-lg overflow-hidden shrink-0">
              <Image
                src={product.image || "/placeholder.svg"}
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
                <Button className="flex-1 text-sm h-9 sm:h-10" onClick={handleSendMessage} disabled={!message.trim() || isSending}>
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Odeslat'}
                </Button>
              </div>
            </>
          )}
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
            <div className="p-3 sm:p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-2 sm:gap-3">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm">
                  Buďte při nakupování obezřetní. Dodržujte tyto zásady pro bezpečné transakce.
                </p>
              </div>
            </div>
            <ul className="space-y-2 sm:space-y-3">
              {safetyTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 sm:gap-3">
                  <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
                  </div>
                  <span className="text-xs sm:text-sm">{tip}</span>
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
