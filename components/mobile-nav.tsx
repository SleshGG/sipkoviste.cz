'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Home, Store, Plus, MessageCircle, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

const AuthDialog = dynamic(() => import('@/components/auth-dialog').then((m) => m.AuthDialog), { ssr: false })

const navItems = [
  { href: '/', icon: Home, label: 'Domů' },
  { href: '/marketplace', icon: Store, label: 'Tržiště' },
  { href: '/sell', icon: Plus, label: 'Prodat', primary: true },
  { href: '/messages', icon: MessageCircle, label: 'Zprávy', showBadge: true },
  { href: '/profile/me', icon: User, label: 'Profil' },
]

export function MobileNav() {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  const fetchUnread = async (userId: string) => {
    const supabase = createClient()
    const [msgRes, notifRes] = await Promise.all([
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', userId).eq('is_read', false),
      supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false),
    ])
    if (!msgRes.error && !notifRes.error) {
      setUnreadCount((msgRes.count ?? 0) + (notifRes.count ?? 0))
    }
  }

  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)
  useEffect(() => {
    let isMounted = true
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return
      setIsLoggedIn(!!session?.user)
      if (!session?.user) return
      fetchUnread(session.user.id)
      const ch = supabase
        .channel('mobile-nav-unread')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => fetchUnread(session.user.id))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` }, () => fetchUnread(session.user.id))
        .subscribe()
      channelRef.current = ch
    })
    return () => {
      isMounted = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [pathname])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href.split('?')[0]))
          const Icon = item.icon

          if (item.primary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-4"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/25">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-[10px] mt-1 text-primary font-medium">{item.label}</span>
              </Link>
            )
          }

          const badgeCount = item.showBadge ? unreadCount : 0
          const isProfile = item.href === '/profile/me'
          const shouldShowAuth = isProfile && isLoggedIn === false
          
          if (shouldShowAuth) {
            return (
              <button
                key={item.href}
                onClick={() => setIsAuthDialogOpen(true)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 relative',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            )
          }
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 relative',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {badgeCount > 0 && (
                  <Badge className="absolute -right-2 -top-2 h-4 w-4 min-w-4 rounded-full p-0 text-[10px] flex items-center justify-center">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
      <AuthDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} />
    </nav>
  )
}
