import type { Metadata } from "next";
import Link from "next/link";
import { Clock, MapPinned, ShieldCheck, UserRoundCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: `About ${settings.businessName}`,
    description: `${settings.businessName} provides professional real estate services.`,
    alternates: {
      canonical: `${settings.siteUrl}/about`,
    },
  };
}

export default async function AboutPage() {
  const settings = await getSiteSettings();
  return (
    <main className="min-h-screen bg-slate-50 pt-28 pb-20 relative z-10">
      <section className="container mx-auto px-4">
        <div className="relative z-10 overflow-hidden rounded-[2rem] border border-slate-200 bg-white text-slate-950 shadow-sm">
          <div className="grid lg:grid-cols-2">
            <div className="p-8 md:p-14 space-y-6">
              <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">About {settings.businessName}</p>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">About {settings.businessName}</h1>
              <p className="text-lg text-slate-600 leading-relaxed">
                {settings.defaultSeoDescription || settings.tagline || `${settings.businessName} provides reliable property services for buyers, sellers, tenants, and owners.`}
              </p>
              <p className="text-lg text-slate-600 leading-relaxed">
                Our mission is to help property owners maximize returns while ensuring tenants have a smooth and comfortable rental experience.
              </p>
              <Button size="lg" className="rounded-full bg-slate-900 text-white hover:bg-slate-800" asChild>
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
            <div className="min-h-[360px] bg-[url('https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200')] bg-cover bg-center" />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-4 gap-6">
            {[
            { icon: ShieldCheck, title: "Professional Management", text: "Expert property management services to maximize your returns." },
            { icon: MapPinned, title: "Local Market Knowledge", text: `Deep understanding of ${settings.city || "local"} property market trends and pricing.` },
            { icon: Clock, title: "Fast Maintenance", text: "Quick response times for all property maintenance needs." },
            { icon: UserRoundCheck, title: "Tenant Screening", text: "Thorough screening process to find reliable tenants." },
          ].map((item) => (
            <div key={item.title} className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm">
              <item.icon className="h-8 w-8 text-primary mb-5" />
              <h2 className="font-bold text-xl mb-2 text-slate-900">{item.title}</h2>
              <p className="text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
