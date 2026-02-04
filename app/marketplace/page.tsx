'use client'

import { useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/header'
import { MobileNav } from '@/components/mobile-nav'
import { ProductCard } from '@/components/product-card'
import { MarketplaceFilters, type FiltersState } from '@/components/marketplace-filters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, Grid3X3, LayoutGrid, X } from 'lucide-react'
import { mockProducts } from '@/lib/data'
import { SidebarBanner } from '@/components/sidebar-banner' // Import SidebarBanner
import { InlineBanner } from '@/components/inline-banner' // Import InlineBanner

function MarketplaceContent() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category')
  const initialQuery = searchParams.get('q') || ''

  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid')
  const [filters, setFilters] = useState<FiltersState>({
    priceRange: [0, 10000],
    weights: [],
    materials: [],
    brands: [],
    conditions: [],
    categories: initialCategory ? [initialCategory] : [],
  })

  const filteredProducts = useMemo(() => {
    let products = [...mockProducts]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
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
      products = products.filter((p) => filters.weights.includes(p.weight))
    }

    // Material filter
    if (filters.materials.length > 0) {
      products = products.filter((p) => filters.materials.includes(p.material))
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
      case 'price-low':
        products.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        products.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        products.sort((a, b) => b.seller.rating - a.seller.rating)
        break
      case 'newest':
      default:
        products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    return products
  }, [searchQuery, filters, sortBy])

  const activeFilters = useMemo(() => {
    const active: { key: string; label: string; value: string }[] = []

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
      active.push({ key: `material-${m}`, label: 'Materiál', value: m })
    })

    filters.brands.forEach((b) => {
      active.push({ key: `brand-${b}`, label: 'Značka', value: b })
    })

    filters.conditions.forEach((c) => {
      active.push({ key: `condition-${c}`, label: 'Stav', value: c })
    })

    return active
  }, [filters])

  const removeFilter = (filterKey: string) => {
    if (filterKey === 'price') {
      setFilters((f) => ({ ...f, priceRange: [0, 10000] }))
    } else {
      const [type, value] = filterKey.split('-')
      const key = `${type}s` as keyof Pick<
        FiltersState,
        'weights' | 'materials' | 'brands' | 'conditions' | 'categories'
      >
      setFilters((f) => ({
        ...f,
        [key]: (f[key] as string[]).filter((v) => v !== value && v !== filterKey.replace(`${type}-`, '')),
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
          <div className="flex items-center gap-2">
            {/* Mobile Filter Button - only visible on mobile/tablet */}
            <div className="lg:hidden">
              <MarketplaceFilters filters={filters} onFiltersChange={setFilters} />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Řadit podle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Nejnovější</SelectItem>
                <SelectItem value="price-low">Cena: od nejnižší</SelectItem>
                <SelectItem value="price-high">Cena: od nejvyšší</SelectItem>
                <SelectItem value="rating">Nejlépe hodnocené</SelectItem>
              </SelectContent>
            </Select>
            <div className="hidden sm:flex items-center border border-border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-9 w-9 rounded-r-none"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'compact' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-9 w-9 rounded-l-none"
                onClick={() => setViewMode('compact')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
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
                onClick={() =>
                  setFilters({
                    priceRange: [0, 10000],
                    weights: [],
                    materials: [],
                    brands: [],
                    conditions: [],
                    categories: [],
                  })
                }
              >
                Vymazat vše
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
                className={`grid ${
                  viewMode === 'grid'
                    ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4'
                    : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3'
                }`}
              >
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
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
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Žádné inzeráty nenalezeny</h3>
                <p className="text-muted-foreground mb-4">
                  Zkuste upravit filtry nebo hledaný výraz
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

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <MarketplaceContent />
    </Suspense>
  )
}
