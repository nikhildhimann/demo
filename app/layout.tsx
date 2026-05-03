import { Suspense } from "react";
import "./globals.css"
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { siteConfig } from "@/data/siteConfig";
import { AssistantLoader } from "@/components/AssistantLoader";
import ScrollToTop from "@/components/ScrollToTop";

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: siteConfig.seoTitle,
  description: siteConfig.seoDescription,
  keywords: "real estate, luxury villas, apartments for sale, rent property",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.siteUrl,
    siteName: siteConfig.brandName,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.brandName,
    description: siteConfig.seoDescription,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased flex flex-col")}>
        <Providers>
          <Suspense fallback={null}>
            <ScrollToTop />
          </Suspense>
          <Navbar />
          <div className="flex-1">
            {children}
          </div>
          <Footer />
          <AssistantLoader />
          <Toaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  )
}
