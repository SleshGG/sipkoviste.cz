'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Target, Search, Plus, MessageCircle, User, Menu, Settings, LogOut, Package, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { AuthDialog } from '@/components/auth-dialog'
import { AvatarWithOnline } from '@/components/avatar-with-online'
import { createClient } from '@/lib/supabase/client'
import { signOut } from '@/lib/supabase/actions'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Profile } from '@/lib/supabase/types'

export function Header() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)

  const fetchUnreadCount = async (userId: string) => {
    const supabase = createClient()
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false)
    if (!error) setUnreadMessagesCount(count ?? 0)
  }

  useEffect(() => {
    const supabase = createClient()
    let isMounted = true

    const loadProfileAndUnread = (userId: string) => {
      Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', userId).eq('is_read', false),
      ]).then(([profileRes, countRes]) => {
        if (!isMounted) return
        setProfile(profileRes.data ?? null)
        setUnreadMessagesCount(countRes.count ?? 0)
      })
    }

    // getSession() je rychlejší – bere z lokálního úložiště, bez čekání na server
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return
      setUser(session?.user ?? null)
      setIsLoading(false)
      if (session?.user) {
        loadProfileAndUnread(session.user.id)
      }
    }).catch(() => {
      if (isMounted) setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return
      setUser(session?.user ?? null)
      setIsLoading(false)
      if (session?.user) {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          loadProfileAndUnread(session.user.id)
        } else {
          fetchUnreadCount(session.user.id)
        }
      } else {
        setProfile(null)
        setUnreadMessagesCount(0)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user?.id) return
    const supabase = createClient()
    const channel = supabase
      .channel('header-messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchUnreadCount(user.id)
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const handleSignOut = async () => {
    setIsLoggingOut(true)
    await signOut()
    setUser(null)
    setProfile(null)
    setIsLoggingOut(false)
    router.push('/')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/marketplace?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const isLoggedIn = !!user

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Target className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">Šipkoviště.cz</span>
        </Link>

        {/* Search Bar - Hidden on mobile */}
        <form onSubmit={handleSearch} className="hidden flex-1 max-w-xl md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Hledejte šipky, terče, příslušenství..."
              className="w-full pl-10 bg-secondary border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-2 md:flex">
          <Link href="/marketplace">
            <Button variant="ghost" size="sm">
              Prochazet
            </Button>
          </Link>
          <Link href="/sell">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Prodat
            </Button>
          </Link>
          
          <Link href="/listings">
            <Button variant="ghost" size="sm" className="gap-2">
              <Package className="h-5 w-5" />
              Moje inzeráty
            </Button>
          </Link>
          <Link href="/messages" className="group/msg">
            <Button variant="ghost" size="icon" className="relative">
              <MessageCircle className="h-5 w-5" />
              {!isLoading && unreadMessagesCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-black bg-primary px-1 text-[10px] font-bold text-primary-foreground transition-[filter] group-hover/msg:brightness-110">
                  {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                </span>
              )}
            </Button>
          </Link>
          {isLoggedIn ? (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-3 p-2">
                    <div className="overflow-visible">
                      <AvatarWithOnline
                        src={profile?.avatar_url ?? '/placeholder.svg'}
                        alt={profile?.name ?? 'Profil'}
                        size="md"
                        isOnline={true}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{profile?.name || 'Uživatel'}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="h-4 w-4" />
                      Nastavení
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive cursor-pointer"
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4 mr-2" />
                    )}
                    Odhlásit se
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => setIsAuthDialogOpen(true)}
              disabled={isLoading}
              aria-label="Přihlásit se"
            >
              <User className="h-4 w-4" />
              Přihlásit se
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
          <SheetContent 
            side="right" 
            className="w-11/12 flex flex-col p-0"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {/* Header: profil / přihlášení – oddělený blok */}
            <div className="shrink-0 border-b border-border bg-muted/30 px-4 py-5">
              {isLoggedIn ? (
                <div className="flex items-center gap-4">
                  <div className="overflow-visible shrink-0">
                    <AvatarWithOnline
                      src={profile?.avatar_url ?? '/placeholder.svg'}
                      alt={profile?.name ?? 'Profil'}
                      size="lg"
                      isOnline={true}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{profile?.name || 'Uživatel'}</p>
                    <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
              ) : (
                <Button 
                  className="w-full gap-2 h-12" 
                  onClick={() => setIsAuthDialogOpen(true)}
                >
                  <User className="h-4 w-4" />
                  Přihlásit se / Registrace
                </Button>
              )}
            </div>

            {/* Navigace – hlavní obsah menu */}
            <nav className="flex-1 overflow-y-auto py-4 px-2">
              <div className="flex flex-col gap-1">
                {isLoggedIn ? (
                  <>
                    <Link href="/dashboard">
                      <Button variant="ghost" className="w-full justify-start gap-3 h-11 rounded-lg">
                        <User className="h-5 w-5 text-muted-foreground" />
                        Můj profil
                      </Button>
                    </Link>
                    <Link href="/listings">
                      <Button variant="ghost" className="w-full justify-start gap-3 h-11 rounded-lg">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        Moje inzeráty
                      </Button>
                    </Link>
                    <Link href="/messages">
                      <Button variant="ghost" className="w-full justify-start gap-3 h-11 rounded-lg relative">
                        <MessageCircle className="h-5 w-5 text-muted-foreground" />
                        Zprávy
                        {unreadMessagesCount > 0 && (
                          <Badge variant="default" className="ml-auto h-5 min-w-5 rounded-full border border-black px-1 text-xs">
                            {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                          </Badge>
                        )}
                      </Button>
                    </Link>
                    <div className="my-2 border-t border-border" />
                    <Link href="/marketplace">
                      <Button variant="ghost" className="w-full justify-start gap-3 h-11 rounded-lg">
                        <Target className="h-5 w-5 text-muted-foreground" />
                        Procházet tržiště
                      </Button>
                    </Link>
                    <Link href="/sell">
                      <Button variant="ghost" className="w-full justify-start gap-3 h-11 rounded-lg">
                        <Plus className="h-5 w-5 text-muted-foreground" />
                        Přidat inzerát
                      </Button>
                    </Link>
                    <div className="my-2 border-t border-border" />
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start gap-3 h-11 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleSignOut}
                      disabled={isLoggingOut}
                    >
                      {isLoggingOut ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <LogOut className="h-5 w-5" />
                      )}
                      Odhlásit se
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/marketplace">
                      <Button variant="ghost" className="w-full justify-start gap-3 h-11 rounded-lg">
                        <Target className="h-5 w-5 text-muted-foreground" />
                        Procházet tržiště
                      </Button>
                    </Link>
                    <Link href="/sell">
                      <Button variant="ghost" className="w-full justify-start gap-3 h-11 rounded-lg">
                        <Plus className="h-5 w-5 text-muted-foreground" />
                        Přidat inzerát
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>

            {/* Vyhledávání – na konci menu (pb-20 = nad spodní navigací) */}
            <div className="shrink-0 border-t border-border bg-muted/20 px-4 py-4 pb-20">
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Hledat</p>
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Šipky, terče, příslušenství…"
                  className="pl-10 h-11 bg-background border-border rounded-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={(e) => e.target.select()}
                />
              </form>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Auth Dialog */}
      <AuthDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} />
    </header>
  )
}
