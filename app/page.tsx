import { HomeClient } from "@/components/home/HomeClient";
import { getFeaturedProperties, toPropertyCardData } from "@/lib/property-data";
import { siteConfig } from "@/data/siteConfig";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: siteConfig.seoTitle,
  description: siteConfig.seoDescription,
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || undefined,
  },
};

export default async function Home() {
  const featuredProperties = await getFeaturedProperties(6);

  return <HomeClient featuredProperties={featuredProperties.map(toPropertyCardData)} />;
}
