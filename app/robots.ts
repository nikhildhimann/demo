import { MetadataRoute } from 'next'
import { getSiteSettings } from "@/lib/settings"

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings();
  const baseUrl = settings.siteUrl;
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/admin/', '/api/auth/', '/login', '/register', '/dashboard'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
