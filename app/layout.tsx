import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { CookieConsentBar } from '@/components/cookie-consent-bar'
import { LastSeenUpdater } from '@/components/last-seen-updater'
import { defaultOgImage, defaultOgImageUrl } from '@/lib/site-config'
import './globals.css'

const geistSans = Geist({ subsets: ['latin'] })

const siteName = 'Šipkoviště'
const defaultDescription = 'Kupujte a prodávejte prémiové šipky, terče a příslušenství. Největší tržiště pro milovníky šipek v ČR.'

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: { default: `${siteName} - Tržiště s šipkami a příslušenstvím`, template: `%s | ${siteName}` },
  description: defaultDescription,
  openGraph: {
    type: 'website',
    locale: 'cs_CZ',
    siteName,
    title: `${siteName} - Tržiště s šipkami a příslušenstvím`,
    description: defaultDescription,
    url: baseUrl,
    images: [defaultOgImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} - Tržiště s šipkami a příslušenstvím`,
    description: defaultDescription,
    images: [defaultOgImageUrl],
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const fbAppId = process.env.NEXT_PUBLIC_FB_APP_ID

  return (
    <html lang="cs">
      <head>
        {fbAppId && <meta property="fb:app_id" content={fbAppId} />}
      </head>
      <body className={`${geistSans.className} antialiased`}>
        {children}
        <LastSeenUpdater />
        <CookieConsentBar />
      </body>
    </html>
  )
}
