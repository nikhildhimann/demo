import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: `Terms & Conditions | ${settings.businessName}`,
    description: `Terms and conditions for using ${settings.businessName}.`,
  };
}

export default async function TermsPage() {
  const settings = await getSiteSettings();
  return (
    <InfoPage
      eyebrow="Terms"
      title="Terms & Conditions"
      description={`Please review these terms before using ${settings.businessName} property services.`}
      settings={settings}
      sections={[
        {
          title: "Property Information",
          body: "Property prices, availability, amenities, and images are subject to verification and may change without prior notice.",
        },
        {
          title: "Enquiries",
          body: "Submitting an enquiry allows our team to contact you by phone, email, or messaging platforms regarding your property requirement.",
        },
        {
          title: "No Financial Advice",
          body: "Information on this website is for property discovery and communication only. Buyers should perform independent due diligence before any transaction.",
        },
      ]}
    />
  );
}
