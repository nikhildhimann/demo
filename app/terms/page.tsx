import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";
import { siteConfig } from "@/data/siteConfig";

export const metadata: Metadata = {
  title: `Terms & Conditions | ${siteConfig.brandName}`,
  description: `Terms and conditions for using ${siteConfig.brandName}.`,
};

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Terms"
      title="Terms & Conditions"
      description={`Please review these terms before using ${siteConfig.brandName} property services.`}
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
