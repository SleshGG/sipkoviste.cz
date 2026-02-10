import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { CookieConsentBar } from '@/components/cookie-consent-bar'
import { LastSeenUpdater } from '@/components/last-seen-updater'
import './globals.css'

const geistSans = Geist({ subsets: ['latin'] })

const siteName = 'Šipkoviště.cz'
const defaultDescription = 'Kupujte a prodávejte prémiové šipky, terče a příslušenství. Největší tržiště pro milovníky šipek v ČR.'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
const ogImageUrl = `${baseUrl.replace(/\/$/, '')}/og-image.png`

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: { default: `${siteName} - Tržiště s Šipkami`, template: `%s | ${siteName}` },
  description: defaultDescription,
  openGraph: {
    type: 'website',
    locale: 'cs_CZ',
    siteName,
    title: `${siteName} - Tržiště s Šipkami`,
    description: defaultDescription,
    url: baseUrl,
    images: [{ url: ogImageUrl, width: 1200, height: 630, alt: siteName, type: 'image/png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} - Tržiště s Šipkami`,
    description: defaultDescription,
    images: [ogImageUrl],
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="cs">
      <body className={`${geistSans.className} antialiased`}>
        {children}
        <LastSeenUpdater />
        <CookieConsentBar />
      </body>
    </html>
  )
}
