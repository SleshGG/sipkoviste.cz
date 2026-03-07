import type { Metadata } from 'next'
import { connection } from 'next/server'
import { Barlow } from 'next/font/google'
import { Toaster } from 'sonner'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { defaultOgImage, defaultOgImageUrl } from '@/lib/site-config'
import { ClientLayoutChunks } from '@/components/client-layout-chunks'
import './globals.css'

const barlow = Barlow({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
})

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await connection()
  const fbAppId = process.env.NEXT_PUBLIC_FB_APP_ID

  return (
    <html lang="cs" suppressHydrationWarning>
      <head>
        {fbAppId && <meta property="fb:app_id" content={fbAppId} />}
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <>
            <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
          </>
        )}
      </head>
      <body className={`${barlow.className} antialiased`} suppressHydrationWarning>
        {children}
        <Toaster position="top-center" richColors closeButton />
        <SpeedInsights />
        <ClientLayoutChunks />
      </body>
    </html>
  )
}
