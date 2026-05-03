import { PropertiesClient } from "@/components/properties/PropertiesClient";
import { getProperties, toPropertyCardData } from "@/lib/property-data";
import { siteConfig } from "@/data/siteConfig";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Explore Available Properties | ${siteConfig.brandName}`,
  description: `Browse verified properties with expert guidance from ${siteConfig.brandName}. Filter by location, budget, type, and bedrooms.`,
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || ""}/properties`,
  },
};

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawType = typeof params.type === "string" ? params.type : "";
  const normalizedType = rawType.toUpperCase();
  const isLegacyBuyType = normalizedType === "BUY";
  const isLegacyRentType = normalizedType === "RENT";

  const initialFilters = {
    search: typeof params.search === "string" ? params.search : "",
    location: typeof params.location === "string" ? params.location : typeof params.city === "string" ? params.city : "",
    type: isLegacyBuyType || isLegacyRentType ? "" : rawType,
    status:
      typeof params.status === "string"
        ? params.status
        : isLegacyBuyType
          ? "AVAILABLE"
          : isLegacyRentType
            ? "RENTED"
            : "",
    min: typeof params.min === "string" ? params.min : typeof params.minPrice === "string" ? params.minPrice : "",
    max: typeof params.max === "string" ? params.max : typeof params.maxPrice === "string" ? params.maxPrice : "",
    bedrooms: typeof params.bedrooms === "string" ? params.bedrooms : "",
    featured: typeof params.featured === "string" ? params.featured : "",
    favorites: typeof params.favorites === "string" ? params.favorites : "",
    sort: typeof params.sort === "string" ? params.sort : "latest",
  };
  const properties = await getProperties({ ...initialFilters, limit: "100" });

  return <PropertiesClient initialProperties={properties.map(toPropertyCardData)} initialFilters={initialFilters} />;
}
