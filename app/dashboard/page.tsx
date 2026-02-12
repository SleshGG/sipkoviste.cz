'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Header } from '@/components/header'
import { MobileNav } from '@/components/mobile-nav'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Settings,
  User,
  Bell,
  Shield,
  ChevronRight,
  Loader2,
  Camera,
  Package,
  Monitor,
  AlertTriangle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  updateProfileAction,
  updatePasswordAction,
  deactivateAccountAction,
  deleteAccountAction,
  signOut,
} from '@/lib/supabase/actions'
import { uploadProductImage } from '@/lib/supabase/upload'
import { formatMemberSince } from '@/lib/utils'
import type { Profile } from '@/lib/supabase/types'

function DashboardContent() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [formName, setFormName] = useState('')
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState(false)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleChangePassword = async () => {
    setPasswordError('')
    if (newPassword.length < 8) {
      setPasswordError('Nové heslo musí mít alespoň 8 znaků.')
      return
    }
    if (newPassword !== newPasswordConfirm) {
      setPasswordError('Hesla se neshodují.')
      return
    }
    setIsChangingPassword(true)
    const result = await updatePasswordAction(currentPassword, newPassword)
    setIsChangingPassword(false)
    if (result.error) {
      setPasswordError(result.error)
      return
    }
    setPasswordDialogOpen(false)
    setCurrentPassword('')
    setNewPassword('')
    setNewPasswordConfirm('')
  }

  const handleDeactivate = async () => {
    setIsDeactivating(true)
    const result = await deactivateAccountAction()
    setIsDeactivating(false)
    if (result.error) return
    setDeactivateDialogOpen(false)
    router.push('/')
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'SMAZAT') {
      setDeleteError('Pro potvrzení napište SMAZAT.')
      return
    }
    setDeleteError('')
    setIsDeleting(true)
    const result = await deleteAccountAction(deletePassword)
    setIsDeleting(false)
    if (result.error) {
      setDeleteError(result.error)
      return
    }
    setDeleteDialogOpen(false)
    router.push('/')
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
          <Link href="/profile/me">
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
                          Členem od {formatMemberSince(profile?.member_since)}
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
                    <div className="border-t border-border mt-0 pt-6">
                      <h4 className="font-medium mb-4">Předvolby zobrazení</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-sm sm:text-base">Online status</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Zobrazovat ostatním, kdy jste online (zelená tečka u jména)
                            </p>
                          </div>
                          <Switch
                            checked={profile?.show_online_status !== false}
                            onCheckedChange={(checked) => {
                              updateProfileAction({ show_online_status: checked }).then((res) => {
                                if (res.data) setProfile(res.data)
                              })
                            }}
                            className="shrink-0"
                          />
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
                      <button
                        type="button"
                        onClick={() => setPasswordDialogOpen(true)}
                        className="w-full flex items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-left"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-sm sm:text-base">Změnit heslo</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Aktualizovat heslo k účtu
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                      </button>
                      <div className="w-full flex items-start justify-between gap-3 p-3 sm:p-4 rounded-lg border border-border bg-secondary/30">
                        <div className="min-w-0 flex items-center gap-2">
                          <Monitor className="h-5 w-5 text-muted-foreground shrink-0" />
                          <div>
                            <p className="font-medium text-sm sm:text-base">Aktivní relace</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Toto zařízení je přihlášené. Změna hesla odhlásí i ostatní zařízení.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-border mt-6 pt-6">
                      <h4 className="font-medium mb-4 text-destructive text-sm sm:text-base">Nebezpečná zóna</h4>
                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={() => setDeactivateDialogOpen(true)}
                          className="w-full flex items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border border-border hover:bg-destructive/10 hover:border-destructive/50 transition-colors text-left"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-sm sm:text-base">Deaktivovat účet</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Dočasně deaktivovat a odhlásit se
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteDialogOpen(true)}
                          className="w-full flex items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border border-destructive/50 hover:bg-destructive/10 transition-colors text-destructive text-left"
                        >
                          <div className="min-w-0">
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

      {/* Změna hesla */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Změnit heslo</DialogTitle>
            <DialogDescription>Zadejte aktuální heslo a nové heslo (min. 8 znaků).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {passwordError && (
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {passwordError}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="current-password">Aktuální heslo</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nové heslo</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="min. 8 znaků"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password-confirm">Nové heslo znovu</Label>
              <Input
                id="new-password-confirm"
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              Zrušit
            </Button>
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Změnit heslo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deaktivovat účet */}
      <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deaktivovat účet</DialogTitle>
            <DialogDescription>
              Účet bude deaktivován a budete odhlášeni. Pro znovuaktivování nás kontaktujte.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateDialogOpen(false)}>
              Zrušit
            </Button>
            <Button variant="destructive" onClick={handleDeactivate} disabled={isDeactivating}>
              {isDeactivating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Deaktivovat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Smazat účet */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Smazat účet</DialogTitle>
            <DialogDescription>
              Tato akce je nevratná. Smažou se všechna vaše data (profil, inzeráty, zprávy). Pro potvrzení zadejte heslo a napište SMAZAT.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {deleteError && (
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {deleteError}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="delete-password">Heslo</Label>
              <Input
                id="delete-password"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delete-confirm">Napište SMAZAT</Label>
              <Input
                id="delete-confirm"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="SMAZAT"
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Zrušit
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting || deleteConfirm !== 'SMAZAT' || !deletePassword}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Trvale smazat účet'}
            </Button>
          </DialogFooter>
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
