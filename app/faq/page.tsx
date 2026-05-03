import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";
import { siteConfig } from "@/data/siteConfig";

export const metadata: Metadata = {
  title: `FAQ | ${siteConfig.brandName}`,
  description: `Frequently asked questions about ${siteConfig.brandName} property services.`,
};

export default function FaqPage() {
  return (
    <InfoPage
      eyebrow="FAQ"
      title="Frequently Asked Questions"
      description="Quick answers for buyers, sellers, tenants, and property owners."
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
