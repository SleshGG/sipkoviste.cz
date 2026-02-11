/** Sdílená konfigurace pro metadata, OG obrázky. Importuj při tvorbě metadata. */

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

/** Kanonická URL výchozího OG obrázku (homepage, stránky bez vlastního obrázku). */
export const defaultOgImageUrl = `${baseUrl.replace(/\/$/, '')}/og-image.png?v=2`

/** Objekt pro openGraph.images – použij vždy, když stránka není produkt s vlastním obrázkem. */
export const defaultOgImage = {
  url: defaultOgImageUrl,
  secureUrl: defaultOgImageUrl.startsWith('https') ? defaultOgImageUrl : undefined,
  width: 1200,
  height: 630,
  alt: 'Šipkoviště.cz',
  type: 'image/png' as const,
}
