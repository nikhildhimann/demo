import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/settings";
import { SellerForm } from "@/components/property/SellerForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: `Sell Property | ${settings.businessName}`,
    description: `List your property with ${settings.businessName} and get expert support to sell faster.`,
  };
}

export default async function SellPropertyPage() {
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

          <div className="mt-10">
            <SellerForm />
          </div>
        </div>
      </div>
    </div>
  );
}
