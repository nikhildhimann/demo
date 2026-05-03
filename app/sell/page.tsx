import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/data/siteConfig";

export const metadata: Metadata = {
  title: `Sell Property | ${siteConfig.brandName}`,
  description: `List your property with ${siteConfig.brandName} and get expert support to sell faster.`,
};

export default function SellPropertyPage() {
  const whatsappHref =
    "https://wa.me/919464402648?text=Hi%20I%20want%20to%20sell%20my%20property.%20Please%20guide%20me.";

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-16">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-12">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">Sell With Confidence</p>
          <h1 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl">Sell Your Property With Expert Support</h1>
          <p className="mb-8 text-slate-600">
            Share your property details with us. Our team will review your listing, suggest the right pricing strategy,
            and connect you with serious buyers.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="rounded-full px-8" asChild>
              <Link href="/contact">List Your Property</Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8" asChild>
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                Talk on WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
