'use client'

import Link from 'next/link'
import Image from 'next/image'
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
                    <div className="relative h-10 w-10 shrink-0 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center">
                      {profile?.avatar_url ? (
                        <Image
                          src={profile.avatar_url}
                          alt={profile?.name ?? 'Profil'}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <User className="h-5 w-5 text-primary" />
                      )}
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
            className="w-11/12"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="flex flex-col gap-6 pt-6 pl-3 pr-3">
              {isLoggedIn ? (
                <div className="flex items-center gap-3 pl-4">
                  <div className="relative h-12 w-12 shrink-0 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile?.name ?? 'Profil'}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <User className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{profile?.name || 'Uživatel'}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
              ) : (
                <div className="px-4">
                  <Button 
                    className="w-full gap-2" 
                    onClick={() => setIsAuthDialogOpen(true)}
                  >
                    <User className="h-4 w-4" />
                    Přihlásit se / Registrace
                  </Button>
                </div>
              )}
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Hledat..."
                  className="pl-10 bg-secondary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={(e) => {
                    e.target.select()
                  }}
                />
              </form>
              <nav className="flex flex-col gap-2 px-0">
                <Link href="/marketplace">
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Target className="h-4 w-4" />
                    Procházet tržiště
                  </Button>
                </Link>
                <Link href="/sell">
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Plus className="h-4 w-4" />
                    Přidat inzerát
                  </Button>
                </Link>
                {isLoggedIn && (
                  <>
                    <Link href="/listings">
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <Package className="h-4 w-4" />
                        Moje inzeráty
                      </Button>
                    </Link>
                    <Link href="/messages">
                      <Button variant="ghost" className="w-full justify-start gap-2 relative">
                        <MessageCircle className="h-4 w-4" />
                        Zprávy
                        {unreadMessagesCount > 0 && (
                          <Badge variant="default" className="ml-auto h-5 min-w-5 rounded-full border border-black px-1 text-xs">
                            {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                          </Badge>
                        )}
                      </Button>
                    </Link>
                    <Link href="/dashboard">
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <Settings className="h-4 w-4" />
                        Nastavení
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                      onClick={handleSignOut}
                      disabled={isLoggingOut}
                    >
                      {isLoggingOut ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="h-4 w-4" />
                      )}
                      Odhlásit se
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
