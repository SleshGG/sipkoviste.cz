import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const geistSans = Geist({ subsets: ['latin'] })

const siteName = 'Šipkoviště.cz'
const defaultDescription = 'Kupujte a prodávejte prémiové šipky, terče a příslušenství. Největší tržiště pro milovníky šipek v ČR.'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')),
  title: { default: `${siteName} - Tržiště s Šipkami`, template: `%s | ${siteName}` },
  description: defaultDescription,
  generator: 'v0.app',
  openGraph: {
    type: 'website',
    locale: 'cs_CZ',
    siteName,
    title: `${siteName} - Tržiště s Šipkami`,
    description: defaultDescription,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} - Tržiště s Šipkami`,
    description: defaultDescription,
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
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
        <Analytics />
      </body>
    </html>
  )
}
