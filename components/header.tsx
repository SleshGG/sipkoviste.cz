'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Target, Search, Plus, MessageCircle, User, Menu, Settings, LogOut, Package } from 'lucide-react'
import { useState } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { AuthDialog } from '@/components/auth-dialog'

export function Header() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false) // Mock auth state

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Target className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">Bazar</span>
        </Link>

        {/* Search Bar - Hidden on mobile */}
        <div className="hidden flex-1 max-w-xl md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Hledejte šipky, terče, příslušenství..."
              className="w-full pl-10 bg-secondary border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-2 md:flex">
          <Link href="/marketplace">
            <Button variant="ghost" size="sm">
              Procházet
            </Button>
          </Link>
          <Link href="/sell">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Prodat
            </Button>
          </Link>
          
          {isLoggedIn ? (
            <>
              <Link href="/messages">
                <Button variant="ghost" size="icon" className="relative">
                  <MessageCircle className="h-5 w-5" />
                  <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                    2
                  </Badge>
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-3 p-2">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Jan Novak</p>
                      <p className="text-xs text-muted-foreground">jan@example.cz</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <Package className="h-4 w-4" />
                      Moje inzeraty
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/messages" className="flex items-center gap-2 cursor-pointer">
                      <MessageCircle className="h-4 w-4" />
                      Zpravy
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard?tab=settings" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="h-4 w-4" />
                      Nastaveni
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive cursor-pointer"
                    onClick={() => setIsLoggedIn(false)}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Odhlasit se
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2"
              onClick={() => setIsAuthDialogOpen(true)}
            >
              <User className="h-4 w-4" />
              Prihlasit se
            </Button>
          )}
        </nav>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-11/12">
            <div className="flex flex-col gap-6 pt-6 pl-3 pr-3">
              {isLoggedIn ? (
                <div className="flex items-center gap-3 pl-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Jan Novak</p>
                    <p className="text-sm text-muted-foreground">jan@example.cz</p>
                  </div>
                </div>
              ) : (
                <div className="px-4">
                  <Button 
                    className="w-full gap-2" 
                    onClick={() => setIsAuthDialogOpen(true)}
                  >
                    <User className="h-4 w-4" />
                    Prihlasit se / Registrace
                  </Button>
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Hledat..."
                  className="pl-10 bg-secondary"
                />
              </div>
              <nav className="flex flex-col gap-2 px-0">
                <Link href="/marketplace">
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Target className="h-4 w-4" />
                    Prochazet trziste
                  </Button>
                </Link>
                <Link href="/sell">
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Plus className="h-4 w-4" />
                    Pridat inzerat
                  </Button>
                </Link>
                {isLoggedIn && (
                  <>
                    <Link href="/dashboard">
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <Package className="h-4 w-4" />
                        Moje inzeraty
                      </Button>
                    </Link>
                    <Link href="/messages">
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Zpravy
                        <Badge className="ml-auto">2</Badge>
                      </Button>
                    </Link>
                    <Link href="/dashboard?tab=settings">
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <Settings className="h-4 w-4" />
                        Nastaveni
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                      onClick={() => setIsLoggedIn(false)}
                    >
                      <LogOut className="h-4 w-4" />
                      Odhlasit se
                    </Button>
                  </>
                )}
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Auth Dialog */}
      <AuthDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} />
    </header>
  )
}
