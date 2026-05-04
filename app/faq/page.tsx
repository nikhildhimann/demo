import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: `FAQ | ${settings.businessName}`,
    description: `Frequently asked questions about ${settings.businessName} property services.`,
  };
}

export default async function FaqPage() {
  const settings = await getSiteSettings();
  return (
    <InfoPage
      eyebrow="FAQ"
      title="Frequently Asked Questions"
      description="Quick answers for buyers, sellers, tenants, and property owners."
      settings={settings}
      sections={[
        {
          title: "How quickly will an agent contact me?",
          body: "After you submit an enquiry, our goal is to contact you within 10 minutes during business hours.",
        },
        {
          title: "Can I list my property?",
          body: "Yes. Use the contact page or List Property button and share basic property details. The team will review and guide you.",
        },
        {
          title: "Are property prices final?",
          body: "Prices shown are indicative and depend on availability, negotiation, taxes, and final agreement terms.",
        },
      ]}
    />
  );
}
