'use client'

import dynamic from 'next/dynamic'

/** Lazy load – neblokují LCP, běží až po hydrataci */
const CookieConsentBar = dynamic(
  () => import('@/components/cookie-consent-bar').then((m) => m.CookieConsentBar),
  { ssr: false }
)
const LastSeenUpdater = dynamic(
  () => import('@/components/last-seen-updater').then((m) => m.LastSeenUpdater),
  { ssr: false }
)

export function ClientLayoutChunks() {
  return (
    <>
      <LastSeenUpdater />
      <CookieConsentBar />
    </>
  )
}
