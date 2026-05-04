import { PropertiesClient } from "@/components/properties/PropertiesClient";
import { getProperties, toPropertyCardData } from "@/lib/property-data";
import { getSiteSettings } from "@/lib/settings";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: `Explore Available Properties | ${settings.businessName}`,
    description: `Browse verified properties with expert guidance from ${settings.businessName}. Filter by location, budget, type, and bedrooms.`,
    alternates: {
      canonical: `${settings.siteUrl}/properties`,
    },
  };
}

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
    purpose: typeof params.purpose === "string" ? params.purpose : isLegacyBuyType ? "BUY" : isLegacyRentType ? "RENT" : "",
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
    bathrooms: typeof params.bathrooms === "string" ? params.bathrooms : "",
    featured: typeof params.featured === "string" ? params.featured : "",
    favorites: typeof params.favorites === "string" ? params.favorites : "",
    sort: typeof params.sort === "string" ? params.sort : "latest",
  };
  const [properties, settings] = await Promise.all([
    getProperties({ ...initialFilters, limit: "100" }),
    getSiteSettings(),
  ]);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: settings.siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Properties",
        item: `${settings.siteUrl}/properties`,
      },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <PropertiesClient initialProperties={properties.map(toPropertyCardData)} initialFilters={initialFilters} settings={settings} />
    </>
  );
}
