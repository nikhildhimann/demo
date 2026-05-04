import { Suspense } from "react";
import "./globals.css"
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AssistantLoader } from "@/components/AssistantLoader";
import ScrollToTop from "@/components/ScrollToTop";
import { getSiteSettings } from "@/lib/settings";

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    title: settings.defaultSeoTitle || settings.businessName,
    description: settings.defaultSeoDescription || settings.tagline,
    keywords: "real estate, properties for sale, rental properties, property enquiries",
    icons: {
      icon: settings.faviconUrl || "/favicon.ico",
      shortcut: settings.faviconUrl || "/favicon.ico",
      apple: settings.faviconUrl || "/favicon.ico",
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: settings.siteUrl,
      siteName: settings.businessName,
    },
    twitter: {
      card: "summary_large_image",
      title: settings.businessName,
      description: settings.defaultSeoDescription || settings.tagline,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const settings = await getSiteSettings();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased flex flex-col")}>
        <Providers>
          <Suspense fallback={null}>
            <ScrollToTop />
          </Suspense>
          <Navbar settings={settings} />
          <div className="flex-1">
            {children}
          </div>
          <Footer settings={settings} />
          <AssistantLoader settings={settings} />
          <Toaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  )
}
