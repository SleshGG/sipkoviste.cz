'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { useDeferredEffect } from '@/lib/use-deferred-effect'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Header } from '@/components/header'
import { ProductCard } from '@/components/product-card'
import { createClient } from '@/lib/supabase/client'
import { getFavoriteProductIdsAction, toggleFavoriteAction } from '@/lib/supabase/actions'
import { Button } from '@/components/ui/button'
import { Plus, Filter, MessageCircle, Shield, Zap, Users, ArrowRight } from 'lucide-react'

const Footer = dynamic(() => import('@/components/footer').then((m) => m.Footer), { ssr: true })
const MobileNav = dynamic(() => import('@/components/mobile-nav').then((m) => m.MobileNav), { ssr: false })
import { categoryIconComponents } from '@/components/category-icons'
import type { ProductWithSeller } from '@/lib/supabase/types'

const benefits = [
  { icon: Filter, title: 'Filtry', text: 'Značka, váha, materiál' },
  { icon: MessageCircle, title: 'Chat', text: 'Rezervace 24h, domluva' },
  { icon: Shield, title: 'Hodnocení', text: 'Ověření prodejci' },
  { icon: Zap, title: '3 minuty', text: 'Inzerát zdarma' },
  { icon: Users, title: 'Komunita', text: 'Šipkaři pro šipkaře' },
]

interface CategoryCount {
  id: string
  name: string
  count: number
}

interface HomeClientProps {
  categoryCounts: CategoryCount[]
  totalProducts: number
  steelDartsProducts?: ProductWithSeller[]
  softDartsProducts?: ProductWithSeller[]
  dartboardsProducts?: ProductWithSeller[]
  accessoriesProducts?: ProductWithSeller[]
  steelDartsFavoriteCounts?: Record<string, number>
  softDartsFavoriteCounts?: Record<string, number>
  dartboardsFavoriteCounts?: Record<string, number>
  accessoriesFavoriteCounts?: Record<string, number>
}

export function HomeClient({
  categoryCounts,
  totalProducts,
  steelDartsProducts = [],
  softDartsProducts = [],
  dartboardsProducts = [],
  accessoriesProducts = [],
  steelDartsFavoriteCounts = {},
  softDartsFavoriteCounts = {},
  dartboardsFavoriteCounts = {},
  accessoriesFavoriteCounts = {},
}: HomeClientProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null)
    })
  }, [])
  useDeferredEffect(() => {
    if (!currentUserId) {
      setFavoriteIds([])
      return
    }
    getFavoriteProductIdsAction().then(({ ids }) => setFavoriteIds(ids))
  }, [currentUserId])

  const handleToggleFavorite = async (productId: string) => {
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
      {/* Hero + Kategorie – mobilní layout: grid + tlačítko, desktop: jedna řádka */}
      <section className="relative overflow-hidden flex items-center justify-center pt-[144px] md:pt-[160px] pb-[172px] md:pb-[180px]">
        {/* Ostré pozadí (pravá strana) */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center scale-105"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1756365394848-9089dce11d54?w=1200&q=80)',
          }}
        />
        {/* Rozmazané pozadí (levá ~50 %) s přechodem doprava */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center scale-105"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1756365394848-9089dce11d54?w=1200&q=80)',
            filter: 'blur(10px)',
            WebkitMaskImage: 'linear-gradient(to right, black 0%, black 50%, transparent 100%)',
            maskImage: 'linear-gradient(to right, black 0%, black 50%, transparent 100%)',
          }}
        />
        <div
          className="absolute inset-0 z-[1] bg-gradient-to-b from-black/90 via-background/70 to-background pointer-events-none"
          aria-hidden
        />
        <div className="container mx-auto px-4 sm:px-6 relative z-10 w-full flex flex-col items-start">
          <div className="w-full max-w-[1600px] text-left space-y-5 sm:space-y-8">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="text-xs sm:text-sm font-medium tracking-[0.2em] text-primary uppercase"
            >
              Jediné šipkařské tržiště v Česku
            </motion.p>
            <div className="w-full mx-auto mt-10 mb-10">
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.2] text-left"
              >
                Najděte své vítězné šipky.
                <br />
                Kupujte a prodávejte vybavení
                <br />
                v komunitě nadšenců
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="text-muted-foreground text-sm sm:text-lg md:text-xl leading-relaxed text-left mt-5 sm:mt-8 max-w-[600px]"
              >
                Největší <span className="font-bold">česká komunita</span>, kde vaše šipky najdou nový domov. Najděte perfektní grip, ideální váhu a vybavení, které vám sedne do ruky.
              </motion.p>
            </div>
          </div>
          {/* Mobil: grid 2 sloupce + tlačítko. Desktop: jedna řádka */}
          <div className="pt-4 w-full max-w-4xl">
              <div className="flex flex-col md:flex-row md:flex-nowrap md:items-stretch md:justify-start md:overflow-x-auto md:scrollbar-hide gap-3">
                <div className="grid grid-cols-2 md:contents gap-2 md:gap-3">
                  {categoryCounts.map((category) => {
                    const Icon = categoryIconComponents[category.id as keyof typeof categoryIconComponents]
                    return (
                      <Link
                        key={category.id}
                        href={`/marketplace?category=${category.id}`}
                        className="group flex items-center gap-3 p-3 md:py-3 md:px-4 rounded-lg bg-white/5 backdrop-blur-xl backdrop-saturate-150 hover:bg-white/15 transition-colors min-h-[56px] md:min-h-0 md:shrink-0"
                      >
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <p className="font-medium text-sm truncate">{category.name}</p>
                          <p className="text-xs text-muted-foreground">{category.count.toLocaleString('cs-CZ')} inzerátů</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
                <Link
                  href="/marketplace"
                  className="flex items-center justify-center gap-2 p-4 md:py-3 md:px-4 rounded-lg border border-primary bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0 min-h-[56px] md:min-h-0"
                >
                  <span className="text-sm font-medium">Zobrazit vše</span>
                  <ArrowRight className="size-5 shrink-0" strokeWidth={2} />
                </Link>
              </div>
            </div>
        </div>
        {/* Přechod do další sekce */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-background pointer-events-none z-[1]"
          aria-hidden
        />
      </section>

      {/* Header overlays hero sekci */}
      <Header variant="overlay" />

      {/* Ocelové šipky – 100 % šířky, 6 produktů v řadě */}
      {(steelDartsProducts.length > 0) && (
        <section className="container mx-auto px-4 pb-8 md:pb-12">
          <div className="rounded-xl p-4">
            <div className="mb-4">
              <div className="relative flex h-[100px] w-full items-center justify-between overflow-hidden rounded-lg border border-white/10 px-4">
              <div
                className="absolute inset-0 bg-cover bg-center blur-sm"
                style={{ backgroundImage: 'url(/images/dartboard-sisal.png)' }}
              />
              <div className="absolute inset-0 bg-black/50" aria-hidden />
              <h2 className="relative z-10 px-4 text-2xl font-semibold text-white sm:text-3xl">Ocelové šipky</h2>
              <Link
                href="/marketplace?category=steel-darts"
                className="relative z-10 inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20"
              >
                Všechny ocelové šipky
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
              </div>
            </div>
            <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {steelDartsProducts.map((product, index) => (
                <div key={product.id} className="min-w-0">
                  <ProductCard
                    product={product}
                    index={index}
                    showFavorite={!!currentUserId}
                    isFavorite={favoriteIds.includes(product.id)}
                    onToggleFavorite={handleToggleFavorite}
                    isTogglingFavorite={togglingProductId === product.id}
                    favoriteCount={steelDartsFavoriteCounts[product.id] ?? 0}
                    priority={index === 0}
                    returnUrl="/"
                  />
              </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Softové šipky | Terče | Příslušenství – 3 boxy v jedné řadě */}
      <section className="container mx-auto px-4 pb-12 md:pb-16">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {/* Softové šipky */}
          {(softDartsProducts.length > 0) && (
            <div className="flex flex-col rounded-xl p-4 md:min-w-0">
              <div className="mb-4">
                <div className="relative flex h-[100px] w-full items-center justify-between overflow-hidden rounded-lg border border-white/10 px-4">
                  <div
                    className="absolute inset-0 bg-cover bg-center blur-sm"
                    style={{ backgroundImage: 'url(/images/dartboard-electronic.png)' }}
                  />
                  <div className="absolute inset-0 bg-black/50" aria-hidden />
                  <h2 className="relative z-10 px-4 text-xl font-semibold text-white sm:text-2xl">Softové šipky</h2>
                  <Link
                    href="/marketplace?category=soft-darts"
                    className="relative z-10 inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20"
                  >
                    Všechny
                    <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  </Link>
                </div>
              </div>
              <div className="grid w-full grid-cols-2 gap-3">
                {softDartsProducts.map((product, index) => (
                  <div key={product.id} className="min-w-0">
                    <ProductCard
                      product={product}
                      index={index}
                      showFavorite={!!currentUserId}
                      isFavorite={favoriteIds.includes(product.id)}
                      onToggleFavorite={handleToggleFavorite}
                      isTogglingFavorite={togglingProductId === product.id}
                      favoriteCount={softDartsFavoriteCounts[product.id] ?? 0}
                      priority={false}
                      returnUrl="/"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Terče */}
          <div className="flex flex-col rounded-xl p-4 md:min-w-0">
            <div className="mb-4">
              <div className="relative flex h-[100px] w-full items-center justify-between overflow-hidden rounded-lg border border-white/10 px-4">
                <div
                  className="absolute inset-0 bg-cover bg-center blur-sm"
                  style={{ backgroundImage: 'url(/images/dartboard-sisal.png)' }}
                />
                <div className="absolute inset-0 bg-black/50" aria-hidden />
                <h2 className="relative z-10 px-4 text-xl font-semibold text-white sm:text-2xl">Terče</h2>
                <Link
                  href="/marketplace?category=dartboards"
                  className="relative z-10 inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20"
                >
                  Všechny
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              </div>
            </div>
            <div className="grid w-full grid-cols-2 gap-3">
              {dartboardsProducts.map((product, index) => (
                <div key={product.id} className="min-w-0">
                  <ProductCard
                    product={product}
                    index={index}
                    showFavorite={!!currentUserId}
                    isFavorite={favoriteIds.includes(product.id)}
                    onToggleFavorite={handleToggleFavorite}
                    isTogglingFavorite={togglingProductId === product.id}
                    favoriteCount={dartboardsFavoriteCounts[product.id] ?? 0}
                    priority={false}
                    returnUrl="/"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Příslušenství */}
          {(accessoriesProducts.length > 0) && (
            <div className="flex flex-col rounded-xl p-4 md:min-w-0">
              <div className="mb-4">
                <div className="relative flex h-[100px] w-full items-center justify-between overflow-hidden rounded-lg border border-white/10 px-4">
                  <div
                    className="absolute inset-0 bg-cover bg-center blur-sm"
                    style={{ backgroundImage: 'url(/images/dartboard-electronic.png)' }}
                  />
                  <div className="absolute inset-0 bg-black/50" aria-hidden />
                  <h2 className="relative z-10 px-4 text-xl font-semibold text-white sm:text-2xl">Příslušenství</h2>
                  <Link
                    href="/marketplace?category=accessories"
                    className="relative z-10 inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20"
                  >
                    Všechny
                    <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  </Link>
                </div>
              </div>
              <div className="grid w-full grid-cols-2 gap-3">
                {accessoriesProducts.map((product, index) => (
                  <div key={product.id} className="min-w-0">
                    <ProductCard
                      product={product}
                      index={index}
                      showFavorite={!!currentUserId}
                      isFavorite={favoriteIds.includes(product.id)}
                      onToggleFavorite={handleToggleFavorite}
                      isTogglingFavorite={togglingProductId === product.id}
                      favoriteCount={accessoriesFavoriteCounts[product.id] ?? 0}
                      priority={false}
                      returnUrl="/"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Proč vybrat Šipkoviště – sekce s ikonami v boxech */}
      <section className="py-14 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-xl md:text-2xl font-semibold mb-12 uppercase tracking-wide">
            Proč vybrat Šipkoviště?
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 md:gap-8 place-items-center">
            {benefits.map((item) => (
              <div key={item.title} className="flex flex-col items-center text-center gap-2 sm:gap-4">
                <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-lg border border-border bg-secondary/50 flex items-center justify-center shrink-0">
                  <item.icon className="h-6 w-6 sm:h-9 sm:w-9 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-xs sm:text-base md:text-lg">{item.title}</p>
                  <p className="text-[10px] sm:text-sm md:text-base text-muted-foreground mt-0.5 sm:mt-1.5">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA – přidat inzerát, box přes celou šířku s fotkou a blurem */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-xl w-full min-h-[280px] md:min-h-[320px] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-cover bg-center scale-105"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80)',
              filter: 'blur(8px)',
            }}
          />
          <div
            className="absolute inset-0 bg-background/80"
            aria-hidden
          />
          <div className="relative z-10 max-w-xl mx-auto text-center p-8 md:p-10">
            <p className="text-muted-foreground text-base md:text-lg mb-3">100% zdarma. Žádné provize, žádné háčky.</p>
            <h3 className="text-2xl md:text-3xl font-semibold mb-5">Leží vám v šuplíku vítězný set?</h3>
            <p className="text-base md:text-lg text-muted-foreground mb-8">
              Vystavte své vybavení během minuty a oslovte největší šipkařskou komunitu v Česku.
            </p>
            <Link href="/sell">
              <Button size="lg" className="gap-2 h-12 px-8">
                <Plus className="h-5 w-5" />
                Přidat inzerát zdarma
              </Button>
            </Link>
          </div>
        </div>
        </div>
      </section>

      <Footer />
      <MobileNav />
    </div>
  )
}
