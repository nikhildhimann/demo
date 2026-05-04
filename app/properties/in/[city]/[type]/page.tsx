import { PropertiesClient } from "@/components/properties/PropertiesClient";
import { getProperties, toPropertyCardData } from "@/lib/property-data";
import { getSiteSettings } from "@/lib/settings";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ city: string, type: string }> }): Promise<Metadata> {
  const { city, type } = await params;
  const settings = await getSiteSettings();
  const formattedCity = city.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const formattedType = type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return {
    title: `${formattedType} in ${formattedCity} | ${settings.businessName}`,
    description: `Browse verified ${formattedType.toLowerCase()} in ${formattedCity}. Expert guidance from ${settings.businessName}.`,
    alternates: {
      canonical: `${settings.siteUrl}/properties/in/${city}/${type}`,
    },
  };
}

export default async function CityTypePropertiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ city: string, type: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { city, type } = await params;
  const resolvedSearchParams = await searchParams;
  const formattedCity = city.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const uppercaseType = type.toUpperCase();

  const initialFilters = {
    search: typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : "",
    location: formattedCity,
    purpose: typeof resolvedSearchParams.purpose === "string" ? resolvedSearchParams.purpose : "",
    type: uppercaseType,
    status: typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : "",
    min: typeof resolvedSearchParams.min === "string" ? resolvedSearchParams.min : "",
    max: typeof resolvedSearchParams.max === "string" ? resolvedSearchParams.max : "",
    bedrooms: typeof resolvedSearchParams.bedrooms === "string" ? resolvedSearchParams.bedrooms : "",
    bathrooms: typeof resolvedSearchParams.bathrooms === "string" ? resolvedSearchParams.bathrooms : "",
    featured: typeof resolvedSearchParams.featured === "string" ? resolvedSearchParams.featured : "",
    favorites: typeof resolvedSearchParams.favorites === "string" ? resolvedSearchParams.favorites : "",
    sort: typeof resolvedSearchParams.sort === "string" ? resolvedSearchParams.sort : "latest",
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
      {
        "@type": "ListItem",
        position: 3,
        name: `Properties in ${formattedCity}`,
        item: `${settings.siteUrl}/properties/in/${city}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: uppercaseType,
        item: `${settings.siteUrl}/properties/in/${city}/${type}`,
      },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <PropertiesClient 
        initialProperties={properties.map(toPropertyCardData)} 
        initialFilters={initialFilters} 
        settings={settings} 
        title={`${uppercaseType} in ${formattedCity}`}
      />
    </>
  );
}
