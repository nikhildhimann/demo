import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: `Privacy Policy | ${settings.businessName}`,
    description: `Privacy policy for ${settings.businessName}.`,
  };
}

export default async function PrivacyPolicyPage() {
  const settings = await getSiteSettings();
  return (
    <InfoPage
      eyebrow="Privacy"
      title="Privacy Policy"
      description={`${settings.businessName} respects client privacy and handles enquiries with care.`}
      settings={settings}
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
