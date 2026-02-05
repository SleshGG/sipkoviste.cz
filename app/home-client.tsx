'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Header } from '@/components/header'
import { MobileNav } from '@/components/mobile-nav'
import { ProductCard } from '@/components/product-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Target,
  CircleDot,
  Circle,
  Package,
  Search,
  Plus,
  ArrowRight,
  Shield,
  Truck,
  MessageCircle,
  Star,
} from 'lucide-react'
import type { ProductWithSeller } from '@/lib/supabase/types'

const categoryIcons = {
  'steel-darts': Target,
  'soft-darts': CircleDot,
  'dartboards': Circle,
  'accessories': Package,
}

const features = [
  {
    icon: Shield,
    title: 'Bezpecne transakce',
    description: 'Chranene platby a overeni prodejci',
  },
  {
    icon: Truck,
    title: 'Rychle doruceni',
    description: 'Vetsina polozek odesilana do 24 hodin',
  },
  {
    icon: MessageCircle,
    title: 'Prime zpravy',
    description: 'Komunikujte primo s kupujicimi a prodejci',
  },
  {
    icon: Star,
    title: 'Duveryhodna komunita',
    description: 'Overene recenze od skutecnych hracu',
  },
]

interface CategoryCount {
  id: string
  name: string
  count: number
}

interface HomeClientProps {
  featuredProducts: ProductWithSeller[]
  categoryCounts: CategoryCount[]
  totalProducts: number
}

export function HomeClient({ featuredProducts, categoryCounts, totalProducts }: HomeClientProps) {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <Badge variant="secondary" className="mb-4">
              {totalProducts > 0 ? `${totalProducts.toLocaleString('cs-CZ')} inzeratu na trzisti` : 'Nejvetsi trziste sipek v CR'}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-balance">
              Kupujte a prodavejte{' '}
              <span className="text-primary">premiove sipky</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 text-pretty">
              Pripojte se k tisicum nadsencu do sipek. Najdete profesionalni sipky,
              terce a prislusenstvi od overenych prodejcu.
            </p>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Hledejte sipky, terce, prislusenstvi..."
                  className="h-12 pl-12 text-base bg-secondary border-border"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Link href={`/marketplace${searchQuery ? `?q=${searchQuery}` : ''}`}>
                <Button size="lg" className="h-12 px-8 w-full sm:w-auto">
                  Hledat
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/sell">
                <Button variant="outline" size="lg" className="gap-2 bg-transparent">
                  <Plus className="h-4 w-4" />
                  Pridat inzerat
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button variant="ghost" size="lg" className="gap-2">
                  Prochazet vse
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">Prochazet kategorie</h2>
              <p className="text-xs sm:text-base text-muted-foreground">Najdete presne to, co potrebujete</p>
            </div>
            <Link href="/marketplace" className="hidden sm:block">
              <Button variant="ghost" className="gap-2">
                Zobrazit vse
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
            {categoryCounts.map((category, index) => {
              const Icon = categoryIcons[category.id as keyof typeof categoryIcons]
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                >
                  <Link href={`/marketplace?category=${category.id}`}>
                    <Card className="group p-3 sm:p-6 border-border bg-card hover:border-primary/50 hover:bg-secondary/50 transition-all duration-300 cursor-pointer h-full">
                      <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
                        <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-xs sm:text-base mb-0.5 sm:mb-1 group-hover:text-primary transition-colors">
                            {category.name}
                          </h3>
                          <p className="text-[10px] sm:text-sm text-muted-foreground">
                            {category.count.toLocaleString('cs-CZ')} inzeratu
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">Doporucene inzeraty</h2>
              <p className="text-xs sm:text-base text-muted-foreground">Skvele nabidky od nejlepsich prodejcu</p>
            </div>
            <Link href="/marketplace">
              <Button variant="ghost" className="gap-2">
                Zobrazit vse
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
              {featuredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center border-dashed">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Zatim zadne inzeraty</h3>
              <p className="text-muted-foreground mb-4">
                Budte prvni, kdo prida inzerat na nase trziste!
              </p>
              <Link href="/sell">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Pridat inzerat
                </Button>
              </Link>
            </Card>
          )}
        </motion.div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-secondary/30">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Proc Bazar?</h2>
              <p className="text-muted-foreground">
                Duveryhodne trziste pro milovniky sipek
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                  className="text-center"
                >
                  <div className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-4 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-xs sm:text-base mb-1 sm:mb-2">{feature.title}</h3>
                  <p className="text-[10px] sm:text-sm text-muted-foreground leading-tight sm:leading-normal">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-8 md:p-12">
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-2xl md:text-4xl font-bold mb-4 text-balance">
                Chcete prodat sve sipky?
              </h2>
              <p className="text-muted-foreground mb-6 text-pretty">
                Vytvorte inzerat behem par minut. Oslovte tisice hracu sipek,
                kteri hledaji kvalitni vybaveni.
              </p>
              <Link href="/sell">
                <Button size="lg" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Vytvorit prvni inzerat
                </Button>
              </Link>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10">
              <Target className="h-64 w-64 -mr-16 -mb-16" />
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Target className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold">Sipkoviste.cz</span>
              <span className="text-muted-foreground text-sm">
                2026 Vsechna prava vyhrazena
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">
                Podminky
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Soukromi
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Podpora
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <MobileNav />
    </div>
  )
}
