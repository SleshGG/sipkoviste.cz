import type { MetadataRoute } from 'next'
import { getProductIdsForSitemap } from '@/lib/supabase/database'

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl()
  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/marketplace`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/sell`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/podminky`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/soukromi`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/cookies`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/podpora`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ]
  const ids = await getProductIdsForSitemap()
  const productPages: MetadataRoute.Sitemap = ids.map((id) => ({
    url: `${base}/product/${id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))
  return [...staticPages, ...productPages]
}
