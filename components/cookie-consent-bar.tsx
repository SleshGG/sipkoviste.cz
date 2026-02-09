'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Analytics } from '@vercel/analytics/next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const CONSENT_KEY = 'sipkoviste-cookie-consent'

export function CookieConsentBar() {
  const [consent, setConsent] = useState<boolean | null>(null)

  useEffect(() => {
    setConsent(typeof window !== 'undefined' && localStorage.getItem(CONSENT_KEY) === 'accepted')
  }, [])

  const accept = () => {
    if (typeof window === 'undefined') return
    localStorage.setItem(CONSENT_KEY, 'accepted')
    setConsent(true)
  }

  // Neukazovat nic pred hydrataci, pak neukazovat bar pri souhlasu
  if (consent === null) return null
  if (consent === true) return <Analytics />

  return (
    <div
      role="dialog"
      aria-label="Souhlas s cookies"
      className={cn(
        'fixed bottom-20 left-4 z-[70] w-[calc(100%-2rem)] max-w-lg rounded-lg border border-border bg-background/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80',
        'sm:bottom-5 sm:left-5'
      )}
    >
      <div className="flex flex-col gap-5 p-5 sm:gap-6 sm:p-6">
        <p className="text-sm leading-relaxed text-muted-foreground">
          I náš web potřebuje správný úchop. Používáme cookies, aby se vám u nás dobře házelo a abychom věděli,
          jestli trefujeme vaše preference do černého. Anonymní analytiku zapneme, jen když nám k tomu dáte 180!{' '}
          <Link href="/soukromi" className="text-primary underline underline-offset-2 hover:no-underline">
            Pravidla hry (Ochrana soukromí)
          </Link>
        </p>
        <Button onClick={accept} size="sm" className="shrink-0 self-start">
          Jasná trefa! (Přijmout)
        </Button>
      </div>
    </div>
  )
}
