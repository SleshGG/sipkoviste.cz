'use client'

import React from "react"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Target, Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password,
    })
    
    if (error) {
      setError(error.message === 'Invalid login credentials' 
        ? 'Neplatne prihlasovaci udaje' 
        : error.message)
      setIsLoading(false)
      return
    }
    
    console.log('[v0] Login successful, user:', data.user?.email)
    
    setIsLoading(false)
    setShowSuccess(true)
    
    setTimeout(() => {
      setShowSuccess(false)
      onOpenChange(false)
      setLoginForm({ email: '', password: '' })
      window.location.reload() // Force full reload to update auth state
    }, 1500)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Hesla se neshoduji')
      setIsLoading(false)
      return
    }

    if (registerForm.password.length < 8) {
      setError('Heslo musi mit alespon 8 znaku')
      setIsLoading(false)
      return
    }
    
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email: registerForm.email,
      password: registerForm.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          name: registerForm.name,
        },
      },
    })
    
    if (error) {
      setError(error.message)
      setIsLoading(false)
      return
    }
    
    console.log('[v0] Registration successful, user:', data.user?.email)
    
    setIsLoading(false)
    setShowSuccess(true)
    
    setTimeout(() => {
      setShowSuccess(false)
      onOpenChange(false)
      setRegisterForm({ name: '', email: '', password: '', confirmPassword: '' })
    }, 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md p-0 gap-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center py-16 px-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-4"
              >
                <Target className="h-8 w-8 text-primary" />
              </motion.div>
              <h3 className="text-lg font-semibold mb-1">
                {activeTab === 'login' ? 'Prihlaseni uspesne!' : 'Ucet vytvoren!'}
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                {activeTab === 'login'
                  ? 'Vitejte zpet v Sipkoviste.cz'
                  : 'Potvrdte svuj email pro aktivaci uctu'}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Header */}
              <div className="p-6 pb-4 text-center border-b border-border">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
                    <Target className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>
                <DialogHeader>
                  <DialogTitle className="text-xl sm:text-2xl">Vitejte v Sipkoviste.cz</DialogTitle>
                  <DialogDescription className="text-sm">
                    Prihlaste se nebo si vytvorte ucet pro pristup k trzisti
                  </DialogDescription>
                </DialogHeader>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mx-6 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'login' | 'register'); setError(null); }} className="w-full">
                <TabsList className="w-full rounded-none border-b border-border bg-transparent h-12">
                  <TabsTrigger
                    value="login"
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-full"
                  >
                    Prihlaseni
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-full"
                  >
                    Registrace
                  </TabsTrigger>
                </TabsList>

                {/* Login Form */}
                <TabsContent value="login" className="mt-0 p-6">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-sm">E-mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="vas@email.cz"
                          className="pl-10"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password" className="text-sm">Heslo</Label>
                        <button
                          type="button"
                          className="text-xs text-primary hover:underline"
                        >
                          Zapomenute heslo?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Zadejte heslo"
                          className="pl-10 pr-10"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-11" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Prihlasuji...
                        </>
                      ) : (
                        'Prihlasit se'
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* Register Form */}
                <TabsContent value="register" className="mt-0 p-6">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name" className="text-sm">Jmeno</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-name"
                          type="text"
                          placeholder="Jan Novak"
                          className="pl-10"
                          value={registerForm.name}
                          onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="text-sm">E-mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="vas@email.cz"
                          className="pl-10"
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="text-sm">Heslo</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Minimalne 8 znaku"
                          className="pl-10 pr-10"
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                          required
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-confirm" className="text-sm">Potvrzeni hesla</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-confirm"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Zopakujte heslo"
                          className="pl-10"
                          value={registerForm.confirmPassword}
                          onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-11" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Vytvarim ucet...
                        </>
                      ) : (
                        'Vytvorit ucet'
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      Vytvorenim uctu souhlasim s{' '}
                      <button type="button" className="text-primary hover:underline">
                        podminkami pouziti
                      </button>{' '}
                      a{' '}
                      <button type="button" className="text-primary hover:underline">
                        zasadami ochrany osobnich udaju
                      </button>
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
