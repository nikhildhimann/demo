import { HomeClient } from "@/components/home/HomeClient";
import { getFeaturedProperties, toPropertyCardData } from "@/lib/property-data";
import { getSiteSettings } from "@/lib/settings";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: settings.defaultSeoTitle || settings.businessName,
    description: settings.defaultSeoDescription || settings.tagline,
    alternates: {
      canonical: settings.siteUrl,
    },
  };
}

export default async function Home() {
  const [featuredProperties, settings] = await Promise.all([
    getFeaturedProperties(3),
    getSiteSettings(),
  ]);

  const businessSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: settings.businessName,
    image: settings.logoUrl || settings.siteUrl + "/favicon.ico",
    "@id": settings.siteUrl,
    url: settings.siteUrl,
    telephone: settings.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address,
      addressLocality: settings.city,
      addressRegion: settings.state,
      addressCountry: settings.country,
    },
    priceRange: "$$",
  };

  return (
    <>
      <JsonLd data={businessSchema} />
      <HomeClient featuredProperties={featuredProperties.map(toPropertyCardData)} settings={settings} />
    </>
  );
}
