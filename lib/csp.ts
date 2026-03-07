/**
 * Content-Security-Policy s nonce pro přísnou ochranu.
 * Nonce se generuje per-request v proxy.
 */

export function buildCspHeader(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development'
  const isProd = process.env.NODE_ENV === 'production'

  // 1. script-src: nonce + strict-dynamic; unsafe-eval POUZE v dev (React error overlay)
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(isDev ? ["'unsafe-eval'"] : []),
  ].join(' ')

  // 2. style-src: unsafe-inline – Next.js, Radix UI a další knihovny generují inline styly
  //    bez nonce; style-src unsafe-inline má menší bezpečnostní dopad než script-src
  const styleSrc = "'self' 'unsafe-inline'"

  // 3. img-src: self, Supabase storage, data: (placeholdery)
  //    blob: file preview; images.unsplash.com – remotePatterns v next.config
  const imgSrc = "'self' https://*.supabase.co data: blob: https://images.unsplash.com"

  const parts = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    `style-src ${styleSrc}`,
    `img-src ${imgSrc}`,
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ]

  if (isProd) {
    parts.push("upgrade-insecure-requests")
  }

  return parts.join('; ')
}
