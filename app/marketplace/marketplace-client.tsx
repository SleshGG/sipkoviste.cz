'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/header'
import { MobileNav } from '@/components/mobile-nav'
import { ProductCard } from '@/components/product-card'
import { MarketplaceFilters, type FiltersState } from '@/components/marketplace-filters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { getFavoriteProductIdsAction, toggleFavoriteAction } from '@/lib/supabase/actions'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Search, X, Package, Heart } from 'lucide-react'
import type { ProductWithSeller } from '@/lib/supabase/types'

interface MarketplaceClientProps {
  initialProducts: ProductWithSeller[]
  favoriteCounts?: Record<string, number>
}

export function MarketplaceClient({ initialProducts, favoriteCounts = {} }: MarketplaceClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialCategory = searchParams.get('category')
  const initialQuery = searchParams.get('q') || ''

  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [sortBy, setSortBy] = useState('favorites')
  const [filters, setFilters] = useState<FiltersState>({
    priceRange: [0, 10000],
    weights: [],
    materials: [],
    brands: [],
    conditions: [],
    categories: initialCategory ? [initialCategory] : [],
  })
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null)
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null)
    })
  }, [])
  useEffect(() => {
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

  const filteredProducts = useMemo(() => {
    let products = [...initialProducts]

    // Pouze oblíbené
    if (showOnlyFavorites && currentUserId) {
      products = products.filter((p) => favoriteIds.includes(p.id))
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query))
      )
    }

    // Price filter
    products = products.filter(
      (p) => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    )

    // Category filter
    if (filters.categories.length > 0) {
      products = products.filter((p) => filters.categories.includes(p.category))
    }

    // Weight filter
    if (filters.weights.length > 0) {
      products = products.filter((p) => p.weight && filters.weights.includes(p.weight))
    }

    // Material filter
    if (filters.materials.length > 0) {
      products = products.filter((p) => p.material && filters.materials.includes(p.material))
    }

    // Brand filter
    if (filters.brands.length > 0) {
      products = products.filter((p) => filters.brands.includes(p.brand))
    }

    // Condition filter
    if (filters.conditions.length > 0) {
      products = products.filter((p) => filters.conditions.includes(p.condition))
    }

    // Sorting
    switch (sortBy) {
      case 'favorites':
        products.sort((a, b) => (favoriteCounts[b.id] ?? 0) - (favoriteCounts[a.id] ?? 0))
        break
      case 'price-low':
        products.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        products.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        products.sort((a, b) => (b.seller?.rating ?? 0) - (a.seller?.rating ?? 0))
        break
      case 'newest':
      default:
        products.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    return products
  }, [searchQuery, filters, sortBy, initialProducts, showOnlyFavorites, currentUserId, favoriteIds, favoriteCounts])

  const activeFilters = useMemo(() => {
    const active: { key: string; label: string; value: string }[] = []

    if (showOnlyFavorites && currentUserId) {
      active.push({ key: 'favorites-only', label: 'Oblíbené', value: 'Pouze oblíbené' })
    }

    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) {
      active.push({
        key: 'price',
        label: 'Cena',
        value: `${filters.priceRange[0].toLocaleString('cs-CZ')} - ${filters.priceRange[1].toLocaleString('cs-CZ')} Kč`,
      })
    }

    filters.categories.forEach((c) => {
      const cat = c.replace('-', ' ')
      active.push({ key: `category-${c}`, label: 'Kategorie', value: cat })
    })

    filters.weights.forEach((w) => {
      active.push({ key: `weight-${w}`, label: 'Hmotnost', value: w })
    })

    filters.materials.forEach((m) => {
      active.push({ key: `material-${m}`, label: 'Material', value: m })
    })

    filters.brands.forEach((b) => {
      active.push({ key: `brand-${b}`, label: 'Znacka', value: b })
    })

    filters.conditions.forEach((c) => {
      active.push({ key: `condition-${c}`, label: 'Stav', value: c })
    })

    return active
  }, [filters, showOnlyFavorites, currentUserId])

  const removeFilter = (filterKey: string) => {
    if (filterKey === 'favorites-only') {
      setShowOnlyFavorites(false)
    } else if (filterKey === 'price') {
      setFilters((f) => ({ ...f, priceRange: [0, 10000] }))
    } else {
      const dashIndex = filterKey.indexOf('-')
      const type = dashIndex === -1 ? filterKey : filterKey.slice(0, dashIndex)
      const value = dashIndex === -1 ? '' : filterKey.slice(dashIndex + 1)
      const key = `${type}s` as keyof Pick<
        FiltersState,
        'weights' | 'materials' | 'brands' | 'conditions' | 'categories'
      >
      setFilters((f) => ({
        ...f,
        [key]: (f[key] as string[]).filter((v) => v !== value),
      }))
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Tržiště</h1>
          <p className="text-muted-foreground">
            Procházejte {filteredProducts.length} inzerátů
          </p>
        </motion.div>

        {/* Search and Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="flex flex-col sm:flex-row gap-4 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Hledat inzeráty..."
              className="pl-10 bg-secondary border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {currentUserId && (
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 bg-secondary/50">
                <Heart className={`h-4 w-4 shrink-0 ${showOnlyFavorites ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                <Label htmlFor="favorites-only" className="text-sm font-medium cursor-pointer whitespace-nowrap">
                  Pouze oblíbené
                </Label>
                <Switch
                  id="favorites-only"
                  checked={showOnlyFavorites}
                  onCheckedChange={setShowOnlyFavorites}
                />
              </div>
            )}
            {/* Mobile Filter Button - only visible on mobile/tablet */}
            <div className="lg:hidden">
              <MarketplaceFilters filters={filters} onFiltersChange={setFilters} />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Řadit podle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="favorites">Nejoblíbenější</SelectItem>
                <SelectItem value="newest">Nejnovější</SelectItem>
                <SelectItem value="price-low">Cena: od nejnizsi</SelectItem>
                <SelectItem value="price-high">Cena: od nejvyssi</SelectItem>
                <SelectItem value="rating">Nejlépe hodnocené</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Active Filters */}
        <AnimatePresence>
          {activeFilters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 mb-6"
            >
              {activeFilters.map((filter) => (
                <Badge
                  key={filter.key}
                  variant="secondary"
                  className="gap-1 pr-1 capitalize"
                >
                  {filter.value}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 hover:bg-transparent"
                    onClick={() => removeFilter(filter.key)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => {
                  setShowOnlyFavorites(false)
                  setFilters({
                    priceRange: [0, 10000],
                    weights: [],
                    materials: [],
                    brands: [],
                    conditions: [],
                    categories: [],
                  })
                }}
              >
                Vymazat vse
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <div className="bg-card border border-border rounded-lg p-4">
                <MarketplaceFilters filters={filters} onFiltersChange={setFilters} isSidebar />
              </div>
            </div>
          </aside>

          <div className="flex-1">
            {filteredProducts.length > 0 ? (
              <motion.div
                layout
                className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4"
              >
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product, index) => (
                    <ProductCard
                      key={`product-${product.id}-${index}`}
                      product={product}
                      index={index}
                      showFavorite={!!currentUserId}
                      isFavorite={favoriteIds.includes(product.id)}
                      onToggleFavorite={handleToggleFavorite}
                      isTogglingFavorite={togglingProductId === product.id}
                      favoriteCount={favoriteCounts[product.id] ?? 0}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Žádné inzeráty nenalezeny</h3>
                <p className="text-muted-foreground mb-4">
                  {initialProducts.length === 0 
                    ? 'Zatím tu nejsou žádné inzeráty. Buďte první!'
                    : 'Zkuste upravit filtry nebo hledany vyraz'}
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('')
                    setFilters({
                      priceRange: [0, 10000],
                      weights: [],
                      materials: [],
                      brands: [],
                      conditions: [],
                      categories: [],
                    })
                  }}
                >
                  Vymazat všechny filtry
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  )
}
