import { MetadataRoute } from 'next'
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

  const properties = await prisma.property.findMany({
    where: { deletedAt: null, status: { not: "DRAFT" } },
    select: { slug: true, updatedAt: true },
  }).catch(() => {
    return []
  })

  const propertyUrls = properties.map((p) => ({
    url: `${baseUrl}/properties/${p.slug}`,
    lastModified: p.updatedAt,
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
    ...propertyUrls,
  ]
}
