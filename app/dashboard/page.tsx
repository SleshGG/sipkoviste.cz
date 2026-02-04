'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/header'
import { MobileNav } from '@/components/mobile-nav'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
} from '@/components/ui/dialog'
import {
  Package,
  Settings,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  User,
  Bell,
  Shield,
  ChevronRight,
} from 'lucide-react'
import { mockListings } from '@/lib/data'

function DashboardContent() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') || 'listings'

  const [activeTab, setActiveTab] = useState(initialTab)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [listingToDelete, setListingToDelete] = useState<string | null>(null)
  const [listings, setListings] = useState(mockListings)

  const handleDeleteListing = () => {
    if (listingToDelete) {
      setListings((prev) => prev.filter((l) => l.id !== listingToDelete))
      setDeleteDialogOpen(false)
      setListingToDelete(null)
    }
  }

  const handleToggleVisibility = (id: string) => {
    console.log('Toggle visibility for:', id)
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
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">Nástěnka</h1>
            <p className="text-muted-foreground">Spravujte své inzeráty a nastavení</p>
          </div>
          <Link href="/sell">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nový inzerát</span>
            </Button>
          </Link>
        </motion.div>

        {/* Dashboard Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent p-0 h-auto mb-6 overflow-x-auto">
              <TabsTrigger
                value="listings"
                className="gap-1.5 sm:gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 sm:px-4 pb-3 text-sm"
              >
                <Package className="h-4 w-4" />
                <span className="hidden xs:inline">Moje</span> inzeráty
                <Badge variant="secondary" className="ml-1 text-xs">
                  {listings.length}
                </Badge>
              </TabsTrigger>

              <TabsTrigger
                value="settings"
                className="gap-1.5 sm:gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 sm:px-4 pb-3 text-sm"
              >
                <Settings className="h-4 w-4" />
                Nastavení
              </TabsTrigger>
            </TabsList>

            {/* Listings Tab */}
            <TabsContent value="listings" className="mt-0">
              <AnimatePresence mode="popLayout">
                {listings.length > 0 ? (
                  <div className="space-y-4">
                    {listings.map((listing, index) => (
                      <motion.div
                        key={listing.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                      >
<Card className="border-border bg-card p-3 sm:p-4">
                                          <div className="flex gap-3 sm:gap-4">
                                            <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-lg overflow-hidden bg-secondary">
                                              <Image
                                                src={listing.image || "/placeholder.svg"}
                                                alt={listing.name}
                                                fill
                                                className="object-cover"
                                              />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-start justify-between gap-1 sm:gap-2">
                                                <div className="min-w-0 flex-1">
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
                                                    <DropdownMenuItem className="gap-2">
                                                      <Edit className="h-4 w-4" />
                                                      Upravit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                      className="gap-2"
                                                      onClick={() => handleToggleVisibility(listing.id)}
                                                    >
                                                      <EyeOff className="h-4 w-4" />
                                                      Skrýt inzerát
                                                    </DropdownMenuItem>
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
                                                <Badge variant="outline" className="text-xs">
                                                  Aktivní
                                                </Badge>
                                              </div>
                                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 sm:mt-2 text-xs text-muted-foreground">
                                                <span>12 zobrazení</span>
                                                <span>3 dotazy</span>
                                                <span className="hidden sm:inline">Přidáno {listing.createdAt}</span>
                                              </div>
                                            </div>
                                          </div>
                                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <Card className="border-border bg-card p-12 text-center">
                    <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Zatím žádné inzeráty</h3>
                    <p className="text-muted-foreground mb-4">
                      Začněte prodávat vytvořením prvního inzerátu
                    </p>
                    <Link href="/sell">
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Vytvořit inzerát
                      </Button>
                    </Link>
                  </Card>
                )}
              </AnimatePresence>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Profile Settings */}
                <Card className="border-border bg-card lg:col-span-1">
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <User className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Nastavení profilu</h3>
                    </div>
                    <div className="flex flex-col items-center gap-4 mb-6">
                      <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="h-12 w-12 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium">Jan Novák</p>
                        <p className="text-sm text-muted-foreground">Člen od ledna 2024</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Změnit avatar
                      </Button>
                    </div>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Zobrazované jméno</Label>
                        <Input id="name" defaultValue="Jan Novák" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" defaultValue="jan@example.cz" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="phone">Telefon</Label>
                        <Input id="phone" type="tel" placeholder="+420 123 456 789" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="location">Lokalita</Label>
                        <Input id="location" placeholder="Praha" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="bio">O mně</Label>
                        <Textarea
                          id="bio"
                          placeholder="Řekněte kupujícím něco o sobě..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Middle Column - Notifications & Preferences */}
                <Card className="border-border bg-card lg:col-span-1">
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Bell className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Oznámení</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm sm:text-base">E-mailová oznámení</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Dostávat e-maily o zprávách a nabídkách
                          </p>
                        </div>
                        <Switch defaultChecked className="shrink-0" />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm sm:text-base">Push oznámení</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Být upozorněn na nové dotazy
                          </p>
                        </div>
                        <Switch defaultChecked className="shrink-0" />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm sm:text-base">SMS oznámení</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Důležité aktualizace přes SMS
                          </p>
                        </div>
                        <Switch className="shrink-0" />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm sm:text-base">Marketingové e-maily</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Tipy, novinky a speciální nabídky
                          </p>
                        </div>
                        <Switch className="shrink-0" />
                      </div>
                    </div>

                    <div className="border-t border-border mt-6 pt-6">
                      <h4 className="font-medium mb-4">Předvolby zobrazení</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-sm sm:text-base">Zobrazit telefon</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Kupující uvidí vaše číslo
                            </p>
                          </div>
                          <Switch defaultChecked className="shrink-0" />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-sm sm:text-base">Online status</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Ukazovat kdy jste online
                            </p>
                          </div>
                          <Switch defaultChecked className="shrink-0" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Right Column - Security */}
                <Card className="border-border bg-card lg:col-span-1">
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Shield className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Zabezpečení</h3>
                    </div>
                    <div className="space-y-3">
                      <button className="w-full flex items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                        <div className="text-left min-w-0">
                          <p className="font-medium text-sm sm:text-base">Změnit heslo</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Aktualizovat heslo k účtu
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                      </button>
                      <button className="w-full flex items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                        <div className="text-left min-w-0">
                          <p className="font-medium text-sm sm:text-base">Dvoufaktorové ověření</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Přidat další vrstvu zabezpečení
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0">Vypnuto</Badge>
                      </button>
                      <button className="w-full flex items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                        <div className="text-left min-w-0">
                          <p className="font-medium text-sm sm:text-base">Aktivní relace</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Spravovat přihlášená zařízení
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                      </button>
                    </div>

                    <div className="border-t border-border mt-6 pt-6">
                      <h4 className="font-medium mb-4 text-destructive text-sm sm:text-base">Nebezpečná zóna</h4>
                      <div className="space-y-3">
                        <button className="w-full flex items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border border-border hover:bg-destructive/10 hover:border-destructive/50 transition-colors">
                          <div className="text-left min-w-0">
                            <p className="font-medium text-sm sm:text-base">Deaktivovat účet</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Dočasně skrýt váš profil
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                        </button>
                        <button className="w-full flex items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border border-destructive/50 hover:bg-destructive/10 transition-colors text-destructive">
                          <div className="text-left min-w-0">
                            <p className="font-medium text-sm sm:text-base">Smazat účet</p>
                            <p className="text-xs sm:text-sm opacity-70">
                              Trvale odstranit všechna data
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 shrink-0" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Save Button */}
              <div className="flex justify-end mt-6">
                <Button size="lg">Uložit změny</Button>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Smazat inzerát</DialogTitle>
            <DialogDescription>
              Opravdu chcete smazat tento inzerát? Tuto akci nelze vrátit zpět.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Zrušit
            </Button>
            <Button variant="destructive" onClick={handleDeleteListing}>
              Smazat
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <MobileNav />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <DashboardContent />
    </Suspense>
  )
}
