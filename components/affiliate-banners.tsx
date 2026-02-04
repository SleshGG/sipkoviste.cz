"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  X,
  ExternalLink,
  Target,
  Percent,
  Trophy,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface Banner {
  id: string
  title: string
  subtitle: string
  description?: string
  cta: string
  link: string
  badge?: string
  icon: typeof Target
  gradient: string
  accentColor: string
}

const banners: Banner[] = [
  {
    id: "dartshop",
    title: "DartShop.cz",
    subtitle: "Oficiální partner",
    description: "Sleva 15% na první nákup s kódem BAZAR15",
    cta: "Nakupovat",
    link: "#",
    badge: "-15%",
    icon: Percent,
    gradient: "from-primary/20 via-primary/5 to-transparent",
    accentColor: "text-primary",
  },
  {
    id: "tournament",
    title: "Czech Darts Open 2024",
    subtitle: "Největší turnaj v ČR",
    description: "Registrace otevřena - limitovaný počet míst",
    cta: "Registrovat",
    link: "#",
    badge: "Akce",
    icon: Trophy,
    gradient: "from-amber-500/20 via-amber-500/5 to-transparent",
    accentColor: "text-amber-500",
  },
  {
    id: "premium",
    title: "Prémiové členství",
    subtitle: "Bazar Pro",
    description: "Zvýrazněné inzeráty, bez limitů, prioritní podpora",
    cta: "Vyzkoušet",
    link: "#",
    badge: "Nové",
    icon: Zap,
    gradient: "from-violet-500/20 via-violet-500/5 to-transparent",
    accentColor: "text-violet-500",
  },
]

// Large Hero Banner (for homepage)
export function HeroBanner() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  if (dismissed) return null

  const banner = banners[currentIndex]
  const Icon = banner.icon

  return (
    null
  )
}

// Sidebar Banner (for marketplace)
export function SidebarBanner() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextBanner = () => setCurrentIndex((prev) => (prev + 1) % banners.length)
  const prevBanner = () => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)

  const banner = banners[currentIndex]
  const Icon = banner.icon

  return (
    <Card className={`overflow-hidden border-border bg-gradient-to-b ${banner.gradient} bg-card`}>
      <div className="p-4">
        <div className="flex items-center justify-end mb-3">
          <div className="flex items-center gap-1">
            <button
              onClick={prevBanner}
              className="p-1 rounded hover:bg-secondary/80 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              onClick={nextBanner}
              className="p-1 rounded hover:bg-secondary/80 transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={banner.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className={`h-12 w-12 rounded-xl bg-secondary flex items-center justify-center mb-3`}>
              <Icon className={`h-6 w-6 ${banner.accentColor}`} />
            </div>

            <div className="mb-3">
              {banner.badge && (
                <Badge variant="secondary" className={`${banner.accentColor} mb-2`}>
                  {banner.badge}
                </Badge>
              )}
              <h4 className="font-semibold mb-1">{banner.title}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2">{banner.description}</p>
            </div>

            <Link href={banner.link}>
              <Button size="sm" variant="secondary" className="w-full gap-2">
                {banner.cta}
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>
    </Card>
  )
}

// Inline Banner (between products)
export function InlineBanner({ variant = "default" }: { variant?: "default" | "compact" }) {
  const banner = banners[0] // Use first banner for inline
  const Icon = banner.icon

  if (variant === "compact") {
    return (
      <Link href={banner.link}>
        <Card className="overflow-hidden border-border bg-gradient-to-r from-primary/10 to-transparent hover:border-primary/50 transition-colors">
          <div className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{banner.title}</p>
              <p className="text-xs text-muted-foreground truncate">{banner.description}</p>
            </div>
            <Badge variant="secondary" className="shrink-0 text-primary">
              {banner.badge}
            </Badge>
          </div>
        </Card>
      </Link>
    )
  }

  return (
    <Card className={`overflow-hidden border-border bg-gradient-to-r ${banner.gradient} bg-card col-span-full`}>
      <div className="p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <div className="h-14 w-14 rounded-xl bg-secondary flex items-center justify-center shrink-0">
          <Icon className={`h-7 w-7 ${banner.accentColor}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
            <h4 className="font-semibold">{banner.title}</h4>
            {banner.badge && (
              <Badge variant="secondary" className={banner.accentColor}>
                {banner.badge}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{banner.description}</p>
        </div>
        <Link href={banner.link}>
          <Button size="sm" className="gap-2 shrink-0">
            {banner.cta}
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </Card>
  )
}

// Small text link banner
export function TextBanner() {
  return (
    null
  )
}
