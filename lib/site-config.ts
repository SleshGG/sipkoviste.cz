/** Sdílená konfigurace pro metadata, OG obrázky. Importuj při tvorbě metadata. */

/** Fixní produkční URL – vždy pro og:image, aby FB/crawler neměl build-specific URL. */
const productionUrl = 'https://www.sipkoviste.cz'

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

/** Kanonická URL výchozího OG obrázku – vždy produkční, ne preview deployment. */
export const defaultOgImageUrl = `${productionUrl}/og-image.png`

/** Objekt pro openGraph.images – použij vždy, když stránka není produkt s vlastním obrázkem. */
export const defaultOgImage = {
  url: defaultOgImageUrl,
  secureUrl: defaultOgImageUrl.startsWith('https') ? defaultOgImageUrl : undefined,
  width: 1200,
  height: 630,
  alt: 'Šipkoviště',
  type: 'image/png' as const,
}
