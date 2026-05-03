import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { siteConfig } from "@/data/siteConfig";
import { getPropertyBySlug, getRelatedProperties, toPropertyCardData } from "@/lib/property-data";
import { AgentCard } from "@/components/property/AgentCard";
import { StickyContactBar } from "@/components/property/StickyContactBar";
import { PremiumPropertyCard } from "@/components/property/PremiumPropertyCard";
import { MapEmbed } from "@/components/MapEmbed";
import { Badge } from "@/components/ui/badge";
import { Bed, Bath, Hash, MapPin, CheckCircle2, CalendarDays, PhoneCall, Share2, Heart, Map } from "lucide-react";
import { ImageGallery } from "@/components/property/ImageGallery";
import { EmiCalculator } from "@/components/property/EmiCalculator";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: siteConfig.currency,
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 0,
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);

  if (!property) {
    return { title: `Property Not Found | ${siteConfig.brandName}` };
  }

  const canonical = `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || ""}/properties/${property.slug}`;
  const image = property.images[0]?.url;

  return {
    title: `${property.title} | ${siteConfig.brandName}`,
    description: property.description.slice(0, 155),
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title: property.title,
      description: property.description.slice(0, 155),
      url: canonical || undefined,
      images: image ? [{ url: image }] : undefined,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: property.title,
      description: property.description.slice(0, 155),
      images: image ? [image] : undefined,
    },
  };
}

export default async function PropertyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);

  if (!property) {
    notFound();
  }
  const relatedProperties = await getRelatedProperties(property, 3);

  const agent = {
    name: siteConfig.brandName,
    phone: siteConfig.phone,
    email: siteConfig.email,
    image: undefined,
  };

  const propertyForComponents = {
    id: property.id,
    title: property.title,
    image: property.images[0]?.url || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800",
    address: property.address,
    price: property.price,
    phone: agent.phone,
  };
  const displaySize = property.size || property.area;

  const mapQuery = [property.address, property.city, property.state, property.country].filter(Boolean).join(", ");
  const baseUrl = process.env.NEXTAUTH_URL || "";
  const propertyUrl = `${baseUrl}/properties/${property.slug}`;
  const whatsappMessage = `Hi, I'm interested in "${property.title}" (${currencyFormatter.format(property.price)}) located at ${mapQuery}. ${propertyUrl}`;
  const whatsappUrl = `https://wa.me/${agent.phone.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 pt-24 font-sans md:pb-12">
      <main className="container max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1 uppercase tracking-wider text-xs font-bold border-none">
                {property.status}
              </Badge>
              <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1 uppercase tracking-wider text-xs font-bold">
                {property.type}
              </Badge>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-2">
              {property.title}
            </h1>
            <div className="flex items-center gap-2 font-medium text-slate-600">
              <MapPin className="h-5 w-5" />
              {property.address}, {property.city}, {property.state}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button variant="outline" className="h-12 flex-1 rounded-full border-slate-300 bg-white px-6 text-slate-800 shadow-sm hover:bg-slate-100 md:flex-none">
              <Share2 className="w-5 h-5 mr-2" /> Share
            </Button>
            <Button variant="outline" className="h-12 flex-1 rounded-full border-slate-300 bg-white px-6 text-rose-600 shadow-sm hover:bg-rose-50 hover:text-rose-700 md:flex-none">
              <Heart className="w-5 h-5 mr-2" /> Save
            </Button>
          </div>
        </div>

        <div className="mb-12">
          <ImageGallery images={property.images} title={property.title} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-12">
            <section className="flex flex-col items-start justify-between gap-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:flex-row md:items-center">
              <div>
                <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-slate-600">Price</p>
                <div className="text-4xl font-extrabold text-slate-950 md:text-5xl">{currencyFormatter.format(property.price)}</div>
              </div>
              <div className="flex gap-8 md:gap-12 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-none border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-10">
                <div className="flex flex-col items-start min-w-max">
                  <div className="mb-1 flex items-center gap-2 text-slate-950">
                    <Bed className="h-6 w-6 text-emerald-600" />
                    <span className="text-2xl font-bold">{property.bedrooms}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-500">Beds</span>
                </div>
                <div className="flex flex-col items-start min-w-max">
                  <div className="mb-1 flex items-center gap-2 text-slate-950">
                    <Bath className="h-6 w-6 text-emerald-600" />
                    <span className="text-2xl font-bold">{property.bathrooms}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-500">Baths</span>
                </div>
                <div className="flex flex-col items-start min-w-max">
                  <div className="mb-1 flex items-center gap-2 text-slate-950">
                    <Hash className="h-6 w-6 text-emerald-600" />
                    <span className="text-2xl font-bold">{displaySize}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-500">SqFt</span>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold mb-6 text-slate-900">Description</h2>
              <p className="whitespace-pre-line text-lg leading-relaxed text-slate-700">{property.description}</p>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold mb-6 text-slate-900">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {property.amenities.map((item) => (
                  <div key={item} className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <span className="font-medium text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            <section id="emi-calculator">
              <EmiCalculator propertyPrice={property.price} />
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Location</h2>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <Map className="w-4 h-4" /> {property.city}, {property.state}
                </div>
              </div>
              <MapEmbed query={mapQuery} title={`${property.title} location`} className="h-[400px]" />
            </section>
          </div>

          <div className="lg:col-span-4 max-w-full">
            <aside className="sticky top-24 self-start space-y-6">
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3 text-rose-600 shadow-sm">
                <div className="p-2 bg-rose-100 rounded-full">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-rose-700">Schedule a Visit</p>
                  <p className="text-sm font-medium text-rose-700">Tour this property with expert guidance.</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3 text-blue-600 shadow-sm">
                <div className="p-2 bg-blue-100 rounded-full">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-blue-700">Contact Agent</p>
                  <p className="text-sm font-medium text-blue-700">Get price, availability, and next steps.</p>
                </div>
              </div>

              <AgentCard property={propertyForComponents} agent={agent} />
            </aside>
          </div>
        </div>

        {relatedProperties.length > 0 && (
          <section className="mt-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-primary mb-2">Recommended for you</p>
                <h2 className="text-3xl font-bold text-slate-900">Based on your interest, you may also like</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedProperties.map((related) => (
                <PremiumPropertyCard key={related.id} property={toPropertyCardData(related)} />
              ))}
            </div>
          </section>
        )}
      </main>

      <div className="lg:hidden">
        <StickyContactBar property={propertyForComponents} />
      </div>
    </div>
  );
}
