import type { Metadata } from "next";
import { siteConfig } from "@/data/siteConfig";
import ContactClient from "@/components/contact/ContactClient";

export const metadata: Metadata = {
  title: `Contact ${siteConfig.brandName} | Real Estate Enquiries`,
  description: `Contact ${siteConfig.brandName} for buying, selling, renting, or listing premium real estate.`,
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || ""}/contact`,
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
