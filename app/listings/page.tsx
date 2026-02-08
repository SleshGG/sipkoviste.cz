'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/header'
import { MobileNav } from '@/components/mobile-nav'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import Image from 'next/image'
import {
  Package,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  ShoppingCart,
  Store,
  Star,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { deleteProductAction, updateProductAction, getBulkAlreadyReviewedAction, submitReviewAction } from '@/lib/supabase/actions'

type Listing = {
  id: string
  name: string
  brand: string
  price: number
  condition: string
  image: string | null
  visible?: boolean
  sold_at?: string | null
  created_at: string
}

type BoughtItem = {
  id: string
  product_id: string
  confirmed_at: string
  product: {
    id: string
    name: string
    brand: string
    price: number
    condition: string
    image: string | null
  }
  seller: {
    id: string
    name: string | null
    avatar_url: string | null
  }
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [bought, setBought] = useState<BoughtItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [listingToDelete, setListingToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [reviewedProductIds, setReviewedProductIds] = useState<Record<string, boolean>>({})
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewItem, setReviewItem] = useState<BoughtItem | null>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setIsLoading(false)
        return
      }
      setCurrentUserId(user.id)

      const [productsRes, salesRes] = await Promise.all([
        supabase
          .from('products')
          .select('id, name, brand, price, condition, image, visible, sold_at, created_at')
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('confirmed_sales')
          .select(`
            id,
            product_id,
            confirmed_at,
            product:products!confirmed_sales_product_id_fkey(id, name, brand, price, condition, image),
            seller:profiles!confirmed_sales_seller_id_fkey(id, name, avatar_url)
          `)
          .eq('buyer_id', user.id)
          .order('confirmed_at', { ascending: false }),
      ])

      if (!productsRes.error) setListings(productsRes.data || [])
      const boughtData = (salesRes.error ? [] : (salesRes.data || [])) as BoughtItem[]
      if (!salesRes.error) setBought(boughtData)

      if (boughtData.length > 0) {
        const status = await getBulkAlreadyReviewedAction(
          boughtData.map((i) => ({ product_id: i.product_id, seller_id: i.seller.id }))
        )
        setReviewedProductIds(status)
      }
      setIsLoading(false)
    })
  }, [])

  const handleToggleVisibility = async (id: string) => {
    const listing = listings.find((l) => l.id === id)
    if (!listing) return
    const newVisible = !(listing.visible ?? true)
    const result = await updateProductAction(id, { visible: newVisible })
    if (!result.error) {
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, visible: newVisible } : l)))
    }
  }

  const handleDeleteListing = async () => {
    if (!listingToDelete) return
    setDeleteError(null)
    setIsDeleting(true)
    const result = await deleteProductAction(listingToDelete)
    setIsDeleting(false)
    if (result.error) {
      setDeleteError(result.error)
      return
    }
    setListings((prev) => prev.filter((l) => l.id !== listingToDelete))
    setDeleteDialogOpen(false)
    setListingToDelete(null)
  }

  const openReviewDialog = (item: BoughtItem) => {
    setReviewItem(item)
    setReviewRating(0)
    setReviewComment('')
    setReviewDialogOpen(true)
  }

  const handleSubmitReview = async () => {
    if (!reviewItem || reviewRating < 1 || reviewRating > 5) return
    setIsSubmittingReview(true)
    const err = await submitReviewAction({
      product_id: reviewItem.product_id,
      profile_id: reviewItem.seller.id,
      rating: reviewRating,
      comment: reviewComment.trim() || null,
    })
    setIsSubmittingReview(false)
    if (err?.error) {
      alert(err.error)
      return
    }
    setReviewedProductIds((prev) => ({ ...prev, [reviewItem.product_id]: true }))
    setReviewDialogOpen(false)
    setReviewItem(null)
    setReviewRating(0)
    setReviewComment('')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!currentUserId) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Přihlaste se</h2>
          <p className="text-muted-foreground">Pro zobrazení inzerátů se přihlaste.</p>
        </main>
        <MobileNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">Moje inzeráty</h1>
            <p className="text-muted-foreground">Koupené i prodávané inzeráty</p>
          </div>
          <Link href="/sell">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nový inzerát</span>
            </Button>
          </Link>
        </motion.div>

        {/* Koupené inzeráty */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-10"
        >
          <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Koupené inzeráty
            <Badge variant="secondary" className="text-xs">{bought.length}</Badge>
          </h2>
          {bought.length > 0 ? (
            <div className="space-y-4">
              {bought.map((item, index) => (
                <motion.div
                  key={`bought-${item.id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + index * 0.03 }}
                >
                  <Card className="border-border bg-card p-3 sm:p-4">
                    <div className="flex gap-3 sm:gap-4">
                      <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-lg overflow-hidden bg-secondary">
                        <Image
                          src={item.product?.image || '/placeholder.svg'}
                          alt={item.product?.name || ''}
                          fill
                          sizes="(max-width: 640px) 80px, 96px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base truncate">{item.product?.name}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {item.product?.brand} · {item.product?.condition}
                        </p>
                        <p className="text-base sm:text-lg font-bold text-primary mt-1">
                          {item.product?.price?.toLocaleString('cs-CZ')} Kč
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>Prodejce: {item.seller?.name || 'Uživatel'}</span>
                          <span>·</span>
                          <span>Zakoupeno {item.confirmed_at ? new Date(item.confirmed_at).toLocaleDateString('cs-CZ') : ''}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/product/${item.product_id}`}>Zobrazit inzerát</Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href="/messages">Zprávy</Link>
                          </Button>
                          {!reviewedProductIds[item.product_id] && (
                            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openReviewDialog(item)}>
                              <Star className="h-4 w-4" />
                              Ohodnotit prodejce
                            </Button>
                          )}
                          {reviewedProductIds[item.product_id] && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Star className="h-4 w-4 fill-primary text-primary" />
                              Prodejce již ohodnocen
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="border-dashed p-8 text-center text-muted-foreground">
              <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Zatím nemáte žádné koupené inzeráty.</p>
              <p className="text-sm mt-1">Po potvrzení prodeje v chatu se zde zobrazí.</p>
            </Card>
          )}
        </motion.section>

        {/* Prodávané inzeráty */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
            <Store className="h-5 w-5 text-primary" />
            Prodávané inzeráty
            <Badge variant="secondary" className="text-xs">{listings.length}</Badge>
          </h2>
          <AnimatePresence mode="popLayout">
            {listings.length > 0 ? (
              <div className="space-y-4">
                {listings.map((listing, index) => (
                  <motion.div
                    key={`sold-${listing.id}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: 0.05 + index * 0.03 }}
                  >
                    <Card className="border-border bg-card p-3 sm:p-4">
                      <div className="flex gap-3 sm:gap-4">
                        <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-lg overflow-hidden bg-secondary">
                          <Image
                            src={listing.image || '/placeholder.svg'}
                            alt={listing.name}
                            fill
                            sizes="(max-width: 640px) 80px, 96px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-sm sm:text-base truncate">{listing.name}</h3>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                {listing.brand} · {listing.condition}
                              </p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/product/${listing.id}`} className="flex items-center gap-2">
                                    <Eye className="h-4 w-4" />
                                    Zobrazit inzerát
                                  </Link>
                                </DropdownMenuItem>
                                {!listing.sold_at && (
                                  <DropdownMenuItem asChild>
                                    <Link href={`/sell/${listing.id}`} className="flex items-center gap-2">
                                      <Edit className="h-4 w-4" />
                                      Upravit
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                                {!listing.sold_at && (
                                  <DropdownMenuItem className="gap-2" onClick={() => handleToggleVisibility(listing.id)}>
                                    {listing.visible === false ? (
                                      <>
                                        <Eye className="h-4 w-4" />
                                        Zobrazit inzerát
                                      </>
                                    ) : (
                                      <>
                                        <EyeOff className="h-4 w-4" />
                                        Skrýt inzerát
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="gap-2 text-destructive"
                                  onClick={() => {
                                    setListingToDelete(listing.id)
                                    setDeleteDialogOpen(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Smazat
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-3">
                            <span className="text-base sm:text-lg font-bold text-primary">
                              {listing.price.toLocaleString('cs-CZ')} Kč
                            </span>
                            <Badge
                              variant={listing.sold_at ? 'secondary' : listing.visible === false ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {listing.sold_at ? 'Prodané' : listing.visible === false ? 'Skrytý' : 'Aktivní'}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1.5">
                            Přidáno{' '}
                            {listing.created_at
                              ? new Date(listing.created_at).toLocaleDateString('cs-CZ', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })
                              : ''}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="border-dashed p-8 text-center text-muted-foreground">
                <Store className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Zatím nemáte žádné inzeráty k prodeji.</p>
                <Link href="/sell">
                  <Button className="mt-3 gap-2">
                    <Plus className="h-4 w-4" />
                    Přidat inzerát
                  </Button>
                </Link>
              </Card>
            )}
          </AnimatePresence>
        </motion.section>
      </main>

      {/* Dialog pro hodnocení prodejce (koupené inzeráty) */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ohodnotit prodejce</DialogTitle>
            <DialogDescription>
              Jaká byla spokojenost s prodejcem {reviewItem?.seller?.name || 'Uživatel'} u inzerátu {reviewItem?.product?.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-1 justify-center">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setReviewRating(n)}
                  className="p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <Star
                    className={`h-8 w-8 ${reviewRating >= n ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Volitelný komentář..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Zrušit
            </Button>
            <Button onClick={handleSubmitReview} disabled={reviewRating < 1 || isSubmittingReview}>
              {isSubmittingReview ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Odeslat hodnocení
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) { setDeleteError(null); setListingToDelete(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Smazat inzerát</DialogTitle>
            <DialogDescription>
              Opravdu chcete smazat tento inzerát? Tuto akci nelze vrátit zpět.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
              {deleteError}
            </p>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Zrušit
            </Button>
            <Button variant="destructive" onClick={handleDeleteListing} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Smazat
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <MobileNav />
    </div>
  )
}
