'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Header } from '@/components/header'
import { MobileNav } from '@/components/mobile-nav'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { ProductCard } from '@/components/product-card'
import { AvatarWithOnline } from '@/components/avatar-with-online'
import { createClient } from '@/lib/supabase/client'
import { getFavoriteProductIdsAction, toggleFavoriteAction, getBulkAlreadyReviewedAction, submitReviewAction, deleteProductAction } from '@/lib/supabase/actions'
import Image from 'next/image'
import {
  ArrowLeft,
  Package,
  Star,
  MapPin,
  Pencil,
  MessageCircle,
  ShoppingCart,
  Loader2,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react'
import { isUserOnline, formatMemberSince } from '@/lib/utils'
import type { Profile, ProductWithSeller, Review } from '@/lib/supabase/types'

type PurchasedItem = {
  id: string
  product_id: string
  confirmed_at: string
  product: { id: string; name: string; brand: string; price: number; condition: string; image: string | null }
  seller: { id: string; name: string | null; avatar_url: string | null }
}

type SoldItem = {
  id: string
  product_id: string
  confirmed_at: string
  product: { id: string; name: string; brand: string; price: number; condition: string; image: string | null; sold_at: string | null; view_count?: number }
  buyer: { id: string; name: string | null; avatar_url: string | null }
}

interface ProfileClientProps {
  profile: Profile
  products: ProductWithSeller[]
  soldItems: SoldItem[]
  reviews: (Review & { author?: Profile })[]
  purchasedItems: PurchasedItem[]
  favoriteCounts: Record<string, number>
  productIdsCanDelete: string[]
  isOwnProfile: boolean
}

function formatReviewDate(date: string) {
  const d = new Date(date)
  return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function ProfileClient({ profile, products, soldItems, reviews, purchasedItems, favoriteCounts, productIdsCanDelete, isOwnProfile }: ProfileClientProps) {
  const router = useRouter()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null)
  const [reviewedProductIds, setReviewedProductIds] = useState<Record<string, boolean>>({})
  const [reviewedBuyerIds, setReviewedBuyerIds] = useState<Record<string, boolean>>({})
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewBuyerDialogOpen, setReviewBuyerDialogOpen] = useState(false)
  const [reviewItem, setReviewItem] = useState<PurchasedItem | null>(null)
  const [reviewBuyerItem, setReviewBuyerItem] = useState<SoldItem | null>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => setCurrentUserId(user?.id ?? null))
  }, [])
  useEffect(() => {
    if (!currentUserId) {
      setFavoriteIds([])
      return
    }
    getFavoriteProductIdsAction().then(({ ids }) => setFavoriteIds(ids))
  }, [currentUserId])

  useEffect(() => {
    if (isOwnProfile && purchasedItems.length > 0) {
      getBulkAlreadyReviewedAction(
        purchasedItems.map((i) => ({ product_id: i.product_id, seller_id: i.seller.id }))
      ).then((status) => setReviewedProductIds(status))
    }
  }, [isOwnProfile, purchasedItems])

  useEffect(() => {
    if (isOwnProfile && soldItems.length > 0) {
      getBulkAlreadyReviewedAction(
        soldItems.map((i) => ({ product_id: i.product_id, seller_id: i.buyer.id }))
      ).then((status) => setReviewedBuyerIds(status))
    }
  }, [isOwnProfile, soldItems])

  const openReviewDialog = (item: PurchasedItem) => {
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

  const openReviewBuyerDialog = (item: SoldItem) => {
    setReviewBuyerItem(item)
    setReviewRating(0)
    setReviewComment('')
    setReviewBuyerDialogOpen(true)
  }

  const handleSubmitBuyerReview = async () => {
    if (!reviewBuyerItem || reviewRating < 1 || reviewRating > 5) return
    setIsSubmittingReview(true)
    const err = await submitReviewAction({
      product_id: reviewBuyerItem.product_id,
      profile_id: reviewBuyerItem.buyer.id,
      rating: reviewRating,
      comment: reviewComment.trim() || null,
    })
    setIsSubmittingReview(false)
    if (err?.error) {
      alert(err.error)
      return
    }
    setReviewedBuyerIds((prev) => ({ ...prev, [reviewBuyerItem.product_id]: true }))
    setReviewBuyerDialogOpen(false)
    setReviewBuyerItem(null)
    setReviewRating(0)
    setReviewComment('')
  }

  const handleDeleteProduct = async () => {
    if (!productToDelete) return
    setDeleteError(null)
    setIsDeleting(true)
    const result = await deleteProductAction(productToDelete)
    setIsDeleting(false)
    if (result.error) {
      setDeleteError(result.error)
      return
    }
    setProductToDelete(null)
    setDeleteDialogOpen(false)
    router.refresh()
  }

  const handleToggleFavorite = async (productId: string) => {
    if (!currentUserId) return
    setTogglingProductId(productId)
    const result = await toggleFavoriteAction(productId)
    if (!result.error) {
      setFavoriteIds((prev) =>
        result.isFavorite ? [...prev, productId] : prev.filter((id) => id !== productId)
      )
    }
    setTogglingProductId(null)
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />

      <main className="container mx-auto px-4 sm:px-4 py-4 sm:py-6 pb-24 sm:pb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 gap-2 -ml-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Zpět
        </Button>

        {/* Profil – horní část */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 sm:mb-8"
        >
          <Card className="border-border bg-card p-4 sm:p-6">
            <div className="flex flex-row gap-4 sm:gap-6 items-start md:items-center">
              <div className="relative shrink-0">
                <AvatarWithOnline
                  src={profile.avatar_url ?? '/placeholder.svg'}
                  alt={profile.name ?? 'Profil'}
                  size="lg"
                  isOnline={isUserOnline(profile.show_online_status, profile.last_seen_at)}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold">{profile.name ?? 'Uživatel'}</h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    {(profile.review_count ?? 0) === 0 ? (
                      <>
                        <Star className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">Zatím nebyl ohodnocen</span>
                      </>
                    ) : (
                      <>
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <span className="font-medium text-foreground">
                          {Number(profile.rating ?? 0).toFixed(1)}
                        </span>
                        <span>({profile.review_count ?? 0} hodnocení)</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 shrink-0" />
                    Členem od {formatMemberSince(profile.member_since)}
                  </div>
                </div>
              </div>
              {(isOwnProfile || (!isOwnProfile && currentUserId)) && (
                <Link
                  href={isOwnProfile ? '/dashboard' : `/messages?to=${profile.id}`}
                  className="hidden md:block shrink-0 ml-auto"
                >
                  <Button
                    variant={isOwnProfile ? 'default' : 'outline'}
                    size="sm"
                    className="gap-2"
                  >
                    {isOwnProfile ? (
                      <>
                        <Pencil className="h-4 w-4" />
                        Upravit profil
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-4 w-4" />
                        Napsat zprávu
                      </>
                    )}
                  </Button>
                </Link>
              )}
            </div>
            <div className="flex gap-2 justify-start mt-4 md:hidden">
              {isOwnProfile && (
                <Link href="/dashboard" className="flex-1">
                  <Button variant="default" size="sm" className="gap-2 w-full min-h-[44px]">
                    <Pencil className="h-4 w-4" />
                    Upravit profil
                  </Button>
                </Link>
              )}
              {!isOwnProfile && currentUserId && (
                <Link href={`/messages?to=${profile.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="gap-2 w-full min-h-[44px]">
                    <MessageCircle className="h-4 w-4" />
                    Napsat zprávu
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Taby */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Tabs defaultValue="nabidky" className="w-full">
            <TabsList className={`mb-4 grid w-full max-w-2xl ${isOwnProfile ? 'grid-cols-3' : 'grid-cols-2'} gap-2 px-4 py-2 min-h-0 overflow-visible h-auto bg-muted/50 rounded-xl border border-border`}>
              <TabsTrigger
                value="nabidky"
                className="gap-2 shrink-0 px-4 sm:px-6 py-2 text-xs sm:text-sm min-h-[36px] rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-primary transition-all truncate min-w-0"
              >
                <Package className="h-4 w-4 shrink-0" />
                {isOwnProfile ? 'Moje inzeráty' : 'Inzeráty'} ({products.length + soldItems.length})
              </TabsTrigger>
              {isOwnProfile && (
                <TabsTrigger
                  value="zakoupeno"
                  className="gap-2 shrink-0 px-4 sm:px-6 py-2 text-xs sm:text-sm min-h-[36px] rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-primary transition-all truncate min-w-0"
                >
                  <ShoppingCart className="h-4 w-4 shrink-0" />
                  Zakoupené ({purchasedItems.length})
                </TabsTrigger>
              )}
              <TabsTrigger
                value="hodnoceni"
                className="gap-2 shrink-0 px-4 sm:px-6 py-2 text-xs sm:text-sm min-h-[36px] rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-primary transition-all truncate min-w-0"
              >
                <Star className="h-4 w-4 shrink-0" />
                Hodnocení ({reviews.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="nabidky" className="mt-0">
              {products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {products.map((product) =>
                    isOwnProfile ? (
                      <Card key={product.id} className="border-border bg-card overflow-hidden flex flex-col p-0">
                        <div className="relative aspect-[4/3] bg-secondary">
                          <Image
                            src={product.image || '/placeholder.svg'}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            className="object-cover"
                          />
                          <div className="absolute top-1.5 left-1.5 flex h-7 min-w-[28px] items-center justify-center gap-1 rounded bg-white dark:bg-white/90 px-2 text-[10px] sm:text-xs z-10" style={{ color: '#2b2e33' }}>
                            <Eye className="h-3 w-3 shrink-0" />
                            <span className="tabular-nums">{'view_count' in product ? (product.view_count ?? 0) : 0}</span>
                          </div>
                          <div className="absolute top-1.5 right-1.5 flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 bg-white dark:bg-white/90 text-primary border-0 cursor-pointer" asChild>
                              <Link href={`/sell/${product.id}`} title="Upravit">
                                <Edit className="h-3 w-3" />
                              </Link>
                            </Button>
                            {productIdsCanDelete.includes(product.id) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 bg-white dark:bg-white/90 text-destructive border-0 cursor-pointer"
                                title="Smazat"
                                onClick={() => {
                                  setProductToDelete(product.id)
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="p-3 flex flex-col flex-1">
                          <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{product.brand} · {product.condition}</p>
                          <p className="text-sm font-bold text-primary mt-2">
                            {product.price.toLocaleString('cs-CZ')} Kč
                          </p>
                          <Button variant="outline" size="sm" className="h-8 text-xs mt-3" asChild>
                            <Link href={`/product/${product.id}`}>Zobrazit inzerát</Link>
                          </Button>
                        </div>
                      </Card>
                    ) : (
                      <ProductCard
                        key={product.id}
                        product={product}
                        showFavorite={!!currentUserId}
                        isFavorite={favoriteIds.includes(product.id)}
                        onToggleFavorite={handleToggleFavorite}
                        isTogglingFavorite={togglingProductId === product.id}
                        favoriteCount={favoriteCounts[product.id] ?? 0}
                      />
                    )
                  )}
                </div>
              ) : !isOwnProfile ? (
                <Card className="p-8 text-center border-dashed">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Žádné inzeráty</h3>
                  <p className="text-muted-foreground text-sm">
                    Tento uživatel zatím nemá žádné aktivní inzeráty.
                  </p>
                </Card>
              ) : null}
              {isOwnProfile && products.length === 0 && soldItems.length === 0 && (
                <Card className="p-8 text-center border-dashed">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Žádné inzeráty</h3>
                  <p className="text-muted-foreground text-sm">
                    Zatím nemáte žádné aktivní inzeráty.
                  </p>
                  <Link href="/sell">
                    <Button className="mt-4 gap-2">Přidat inzerát</Button>
                  </Link>
                </Card>
              )}
              {isOwnProfile && soldItems.length > 0 && (
                <div className="mt-8 w-full">
                  <h3 className="text-lg font-semibold mb-4">Prodané inzeráty</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {soldItems.map((item) => (
                      <Card key={item.id} className="border-border bg-card overflow-hidden flex flex-col p-0">
                        {/* Fotka s tlačítky Upravit a Smazat */}
                        <div className="relative aspect-[4/3] bg-secondary">
                          <Image
                            src={item.product?.image || '/placeholder.svg'}
                            alt={item.product?.name || ''}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            className="object-cover grayscale"
                          />
                          <div className="absolute top-1.5 left-1.5 flex h-7 min-w-[28px] items-center justify-center gap-1 rounded bg-white dark:bg-white/90 px-2 text-[10px] sm:text-xs z-10" style={{ color: '#2b2e33' }}>
                            <Eye className="h-3 w-3 shrink-0" />
                            <span className="tabular-nums">{item.product?.view_count ?? 0}</span>
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Badge className="text-sm px-3 py-1 shrink-0 bg-green-200 dark:bg-green-800/50 text-green-900 dark:text-green-100 border-transparent shadow-md">
                              Prodané
                            </Badge>
                          </div>
                          <div className="absolute top-1.5 right-1.5 flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 bg-white dark:bg-white/90 text-primary border-0 cursor-pointer" asChild>
                              <Link href={`/sell/${item.product_id}`} title="Upravit">
                                <Edit className="h-3 w-3" />
                              </Link>
                            </Button>
                            {productIdsCanDelete.includes(item.product_id) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 bg-white dark:bg-white/90 text-destructive border-0 cursor-pointer"
                                title="Smazat"
                                onClick={() => {
                                  setProductToDelete(item.product_id)
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {/* Informace pod sebou */}
                        <div className="p-3 flex flex-col flex-1">
                          <h3 className="font-semibold text-sm truncate">{item.product?.name}</h3>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{item.product?.brand} · {item.product?.condition}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Prodané {item.confirmed_at ? new Date(item.confirmed_at).toLocaleDateString('cs-CZ') : ''}
                          </p>
                          <p className="text-sm font-bold text-primary mt-2">
                            {item.product?.price?.toLocaleString('cs-CZ')} Kč
                          </p>
                          {/* Tlačítka */}
                          <div className="flex flex-col gap-2 mt-3">
                            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                              <Link href={`/product/${item.product_id}`}>Zobrazit inzerát</Link>
                            </Button>
                            {!reviewedBuyerIds[item.product_id] ? (
                              <Button variant="outline" size="sm" className="gap-1 h-8 text-xs bg-primary/10 text-primary border-primary/20" onClick={() => openReviewBuyerDialog(item)}>
                                <Star className="h-3 w-3" />
                                Ohodnotit kupujícího
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground flex items-center gap-1 py-2">
                                <Star className="h-3 w-3 fill-primary text-primary" />
                                Kupující ohodnocen
                              </span>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {isOwnProfile && (
              <TabsContent value="zakoupeno" className="mt-0">
                {purchasedItems.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {purchasedItems.map((item) => (
                      <Card key={item.id} className="border-border bg-card overflow-hidden flex flex-col p-0">
                        <div className="relative aspect-[4/3] bg-secondary">
                          <Image
                            src={item.product?.image || '/placeholder.svg'}
                            alt={item.product?.name || ''}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            className="object-cover"
                          />
                        </div>
                        <div className="p-3 flex flex-col flex-1">
                          <h3 className="font-semibold text-sm truncate">{item.product?.name}</h3>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{item.product?.brand} · {item.product?.condition}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Prodejce: {item.seller?.name || 'Uživatel'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Zakoupeno {item.confirmed_at ? new Date(item.confirmed_at).toLocaleDateString('cs-CZ') : ''}
                          </p>
                          <p className="text-sm font-bold text-primary mt-2">
                            {item.product?.price?.toLocaleString('cs-CZ')} Kč
                          </p>
                          <div className="flex flex-col gap-2 mt-3">
                            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                              <Link href={`/product/${item.product_id}`}>Zobrazit inzerát</Link>
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                              <Link href="/messages">Zprávy</Link>
                            </Button>
                            {!reviewedProductIds[item.product_id] ? (
                              <Button variant="outline" size="sm" className="gap-1 h-8 text-xs bg-primary/10 text-primary border-primary/20" onClick={() => openReviewDialog(item)}>
                                <Star className="h-3 w-3" />
                                Ohodnotit prodejce
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground flex items-center gap-1 py-2">
                                <Star className="h-3 w-3 fill-primary text-primary" />
                                Prodejce ohodnocen
                              </span>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center border-dashed">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Žádné zakoupené zboží</h3>
                    <p className="text-muted-foreground text-sm">
                      Zatím nemáte žádné zakoupené inzeráty. Po potvrzení prodeje v chatu se zde zobrazí.
                    </p>
                  </Card>
                )}
              </TabsContent>
            )}

            <TabsContent value="hodnoceni" className="mt-0">
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id} className="p-4 border-border">
                      <div className="flex gap-3">
                        <AvatarWithOnline
                          src={review.author?.avatar_url ?? '/placeholder.svg'}
                          alt={review.author?.name ?? 'Uživatel'}
                          size="md"
                          isOnline={false}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-medium">{review.author?.name ?? 'Anonym'}</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i <= review.rating ? 'fill-primary text-primary' : 'text-muted-foreground'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatReviewDate(review.created_at)}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center border-dashed">
                  <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Žádná hodnocení</h3>
                  <p className="text-muted-foreground text-sm">
                    {isOwnProfile
                      ? 'Zatím vás nikdo neohodnotil.'
                      : 'Tento uživatel zatím nemá žádná hodnocení.'}
                  </p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ohodnotit prodejce</DialogTitle>
            <DialogDescription>
              Jaká byla spokojenost s prodejcem {reviewItem?.seller?.name || 'Uživatel'} u inzerátu {reviewItem?.product?.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2 justify-center py-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setReviewRating(n)}
                  className="p-2 sm:p-1 rounded touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                >
                  <Star
                    className={`h-8 w-8 sm:h-8 sm:w-8 ${reviewRating >= n ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Volitelný komentář..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="min-h-[80px] text-base"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)} className="min-h-[44px] sm:min-h-0">
              Zrušit
            </Button>
            <Button onClick={handleSubmitReview} disabled={reviewRating < 1 || isSubmittingReview} className="min-h-[44px] sm:min-h-0">
              {isSubmittingReview ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Odeslat hodnocení
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reviewBuyerDialogOpen} onOpenChange={setReviewBuyerDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ohodnotit kupujícího</DialogTitle>
            <DialogDescription>
              Jaká byla spokojenost s kupujícím {reviewBuyerItem?.buyer?.name || 'Uživatel'} u inzerátu {reviewBuyerItem?.product?.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2 justify-center py-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setReviewRating(n)}
                  className="p-2 sm:p-1 rounded touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                >
                  <Star
                    className={`h-8 w-8 sm:h-8 sm:w-8 ${reviewRating >= n ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Volitelný komentář..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="min-h-[80px] text-base"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewBuyerDialogOpen(false)} className="min-h-[44px] sm:min-h-0">
              Zrušit
            </Button>
            <Button onClick={handleSubmitBuyerReview} disabled={reviewRating < 1 || isSubmittingReview} className="min-h-[44px] sm:min-h-0">
              {isSubmittingReview ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Odeslat hodnocení
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) { setDeleteError(null); setProductToDelete(null); } }}>
        <DialogContent className="sm:max-w-md">
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
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="min-h-[44px] sm:min-h-0">
              Zrušit
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduct} disabled={isDeleting} className="min-h-[44px] sm:min-h-0">
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
