import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";
import { siteConfig } from "@/data/siteConfig";

export const metadata: Metadata = {
  title: `Privacy Policy | ${siteConfig.brandName}`,
  description: `Privacy policy for ${siteConfig.brandName}.`,
};

export default function PrivacyPolicyPage() {
  return (
    <InfoPage
      eyebrow="Privacy"
      title="Privacy Policy"
      description={`${siteConfig.brandName} respects client privacy and handles enquiries with care.`}
      sections={[
        {
          title: "Information We Collect",
          body: "We collect information submitted through forms, including name, phone number, email, property interest, and message details.",
        },
        {
          title: "How We Use Information",
          body: "We use enquiry details to contact clients, recommend suitable properties, schedule visits, and improve the property search experience.",
        },
        {
          title: "Data Protection",
          body: "Your details are handled carefully and used only to support your property enquiry and communication with our team.",
        },
      ]}
    />
  );
}
