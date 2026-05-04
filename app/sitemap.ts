import { MetadataRoute } from 'next'
import prisma from "@/lib/prisma"
import { getSiteSettings } from "@/lib/settings"

export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSiteSettings();
  const baseUrl = settings.siteUrl;

  const properties = await prisma.property.findMany({
    where: { deletedAt: null, status: { not: "DRAFT" } },
    select: { slug: true, updatedAt: true, city: true, type: true },
  }).catch(() => {
    return []
  })

  const propertyUrls = properties.map((p) => ({
    url: `${baseUrl}/properties/${p.slug}`,
    lastModified: p.updatedAt,
  }))

  const cities = Array.from(new Set(properties.map(p => p.city.toLowerCase().replace(/\s+/g, '-'))));
  const cityUrls = cities.map((city) => ({
    url: `${baseUrl}/properties/in/${city}`,
    lastModified: new Date(),
  }))

  const cityTypes = Array.from(new Set(properties.map(p => `${p.city.toLowerCase().replace(/\s+/g, '-')}/${p.type.toLowerCase().replace(/\s+/g, '-')}`)));
  const cityTypeUrls = cityTypes.map((cityType) => ({
    url: `${baseUrl}/properties/in/${cityType}`,
    lastModified: new Date(),
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/properties`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
    },
    ...cityUrls,
    ...cityTypeUrls,
    ...propertyUrls,
  ]
}
