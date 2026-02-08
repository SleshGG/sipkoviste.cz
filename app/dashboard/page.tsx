'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Header } from '@/components/header'
import { MobileNav } from '@/components/mobile-nav'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Settings,
  User,
  Bell,
  Shield,
  ChevronRight,
  Loader2,
  Camera,
  Package,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { updateProfileAction } from '@/lib/supabase/actions'
import { uploadProductImage } from '@/lib/supabase/upload'
import type { Profile } from '@/lib/supabase/types'

function DashboardContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [formName, setFormName] = useState('')
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setIsLoading(false)
        return
      }
      setUserEmail(user.email || '')
      const profileResult = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profileResult.data) {
        setProfile(profileResult.data)
        setFormName(profileResult.data.name || '')
      }
      setIsLoading(false)
    })
  }, [])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingAvatar(true)

    const result = await uploadProductImage(file)

    if (result.error) {
      console.log('[v0] Avatar upload error:', result.error)
      setIsUploadingAvatar(false)
      return
    }

    if (result.url) {
      const profileResult = await updateProfileAction({ avatar_url: result.url })
      if (!profileResult.error && profileResult.data) {
        setProfile(profileResult.data)
      }
    }

    setIsUploadingAvatar(false)
    // Reset file input
    if (avatarInputRef.current) {
      avatarInputRef.current.value = ''
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    setSaveSuccess(false)

    const result = await updateProfileAction({ name: formName })

    if (!result.error && result.data) {
      setProfile(result.data)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    }

    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
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
            <h1 className="text-2xl md:text-3xl font-bold mb-1">Nastavení</h1>
            <p className="text-muted-foreground">Profil, oznámení a zabezpečení účtu</p>
          </div>
          <Link href="/listings">
            <Button variant="outline" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Moje inzeráty</span>
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Profile Settings */}
                <Card className="border-border bg-card lg:col-span-1">
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <User className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Nastavení profilu</h3>
                    </div>
                    <div className="flex flex-col items-center gap-4 mb-6">
                      <div className="relative group">
                        {profile?.avatar_url ? (
                          <Image
                            src={profile.avatar_url}
                            alt="Avatar"
                            width={96}
                            height={96}
                            className="h-24 w-24 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="h-12 w-12 text-primary" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={isUploadingAvatar}
                          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          {isUploadingAvatar ? (
                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                          ) : (
                            <Camera className="h-6 w-6 text-white" />
                          )}
                        </button>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleAvatarUpload}
                        />
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{profile?.name || 'Uživatel'}</p>
                        <p className="text-sm text-muted-foreground">
                          {'Člen od '}
                          {profile?.member_since
                            ? (profile.member_since.length === 4 && /^\d{4}$/.test(profile.member_since)
                              ? `1.1.${profile.member_since}`
                              : (() => {
                                  const d = new Date(profile.member_since)
                                  return Number.isNaN(d.getTime()) ? profile.member_since : `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`
                                })())
                            : ''}
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Zobrazované jméno</Label>
                        <Input
                          id="name"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={userEmail} disabled className="opacity-70" />
                        <p className="text-xs text-muted-foreground">E-mail nelze změnit</p>
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
              <div className="flex items-center justify-end gap-3 mt-6">
                {saveSuccess && (
                  <motion.span
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-green-600"
                  >
                    Zmeny ulozeny
                  </motion.span>
                )}
                <Button size="lg" onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Ukladam...
                    </>
                  ) : (
                    'Ulozit zmeny'
                  )}
                </Button>
              </div>
        </motion.div>
      </main>

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
