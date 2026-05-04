import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/settings";
import ContactClient from "@/components/contact/ContactClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: `Contact ${settings.businessName} | Real Estate Enquiries`,
    description: `Contact ${settings.businessName} for buying, selling, renting, or listing real estate.`,
    alternates: {
      canonical: `${settings.siteUrl}/contact`,
    },
  };
}

export default async function ContactPage() {
  const settings = await getSiteSettings();
  return <ContactClient settings={settings} />;
}
