import { MetadataRoute } from 'next'
import { getSiteSettings } from "@/lib/settings"

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSiteSettings();
  return {
    name: settings.businessName,
    short_name: settings.businessName,
    description: settings.defaultSeoDescription || settings.tagline,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f172a',
    icons: [
      {
        src: settings.faviconUrl || '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
