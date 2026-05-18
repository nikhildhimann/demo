"use client";

import { useEffect, useRef, useState } from "react";
import type { PropertyCardData } from "@/lib/property-data";
import type { PublicSiteSettings } from "@/types/settings";
import { PremiumPropertyCard } from "@/components/property/PremiumPropertyCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, MapPin, Building, ShieldCheck, Star, TrendingUp, Users, Clock, Quote, MessageCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

export function HomeClient({ featuredProperties, settings }: { featuredProperties: PropertyCardData[]; settings: PublicSiteSettings }) {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [type, setType] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const locationWrapperRef = useRef<HTMLDivElement>(null);
  const whatsappHref = buildWhatsAppUrl(settings.whatsappNumber, "Hi, I am interested in your real estate services.");

  useEffect(() => {
    const query = location.trim();

    if (query.length < 2) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      setActiveSuggestionIndex(-1);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/locations/suggest?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        const suggestions = Array.isArray(data) ? data.filter((item) => typeof item === "string") : [];
        setLocationSuggestions(suggestions);
        setShowLocationSuggestions(suggestions.length > 0);
        setActiveSuggestionIndex(suggestions.length > 0 ? 0 : -1);
      } catch (error: any) {
        if (error.name !== "AbortError") {
          setLocationSuggestions([]);
          setShowLocationSuggestions(false);
          setActiveSuggestionIndex(-1);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!locationWrapperRef.current?.contains(event.target as Node)) {
        setShowLocationSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectLocationSuggestion = (suggestion: string) => {
    setLocation(suggestion);
    setLocationSuggestions([]);
    setShowLocationSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  const handleLocationKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setShowLocationSuggestions(false);
      setActiveSuggestionIndex(-1);
      return;
    }

    if (!showLocationSuggestions || locationSuggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestionIndex((current) => (current + 1) % locationSuggestions.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestionIndex((current) => (current <= 0 ? locationSuggestions.length - 1 : current - 1));
    }

    if (event.key === "Enter" && activeSuggestionIndex >= 0) {
      event.preventDefault();
      selectLocationSuggestion(locationSuggestions[activeSuggestionIndex]);
    }
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const searchParams = new URLSearchParams();
    if (location.trim()) searchParams.set("location", location.trim());
    if (type && type !== "ALL") searchParams.set("type", type);
    if (minBudget) searchParams.set("min", minBudget);
    if (maxBudget) searchParams.set("max", maxBudget);
    router.push(`/properties${searchParams.toString() ? `?${searchParams.toString()}` : ""}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative min-h-[90dvh] flex items-center justify-center text-white pt-12 md:pt-20">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000"
            alt={`${settings.businessName} featured home`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background/90" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 mt-8 md:mt-0">
          <div className="max-w-3xl space-y-8">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-6">
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span>Verified listings. Expert guidance. Fast support.</span>
              </motion.div>

              <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] max-w-4xl">
                {settings.defaultSeoTitle || settings.businessName}
              </motion.h1>

              <motion.p variants={fadeIn} className="max-w-2xl text-xl font-medium text-slate-100 md:text-2xl">
                {settings.tagline || settings.defaultSeoDescription}
              </motion.p>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-10 bg-white rounded-2xl p-4 shadow-2xl w-full max-w-7xl"
              onSubmit={handleSearch}
            >
              <div className="flex flex-col md:flex-row gap-3">
                <div ref={locationWrapperRef} className="relative flex-[1.5]">
                  <div className="flex items-center px-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-300 focus-within:border-slate-300 focus-within:ring-1 focus-within:ring-slate-300 transition-all">
                    <MapPin className="w-5 h-5 text-slate-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      placeholder="Location"
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      onFocus={() => setShowLocationSuggestions(locationSuggestions.length > 0)}
                      onKeyDown={handleLocationKeyDown}
                      className="w-full min-w-0 border-none bg-transparent py-3 text-slate-950 outline-none placeholder:text-slate-500 focus:ring-0 md:py-4"
                      autoComplete="off"
                    />
                  </div>

                  {showLocationSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-slate-950 shadow-xl">
                      {locationSuggestions.map((suggestion, index) => (
                        <button
                          key={suggestion}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectLocationSuggestion(suggestion)}
                          className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors ${index === activeSuggestionIndex ? "bg-slate-100 text-slate-950" : "hover:bg-slate-50"}`}
                        >
                          <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="truncate">{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex-1 flex items-center px-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-300 focus-within:border-slate-300 focus-within:ring-1 focus-within:ring-slate-300 transition-all">
                  <input
                    type="number"
                    placeholder="Min Budget"
                    value={minBudget}
                    onChange={(event) => setMinBudget(event.target.value)}
                    className="w-full min-w-0 border-none bg-transparent py-3 text-slate-950 outline-none placeholder:text-slate-500 focus:ring-0 md:py-4"
                  />
                </div>
                <div className="flex-1 flex items-center px-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-300 focus-within:border-slate-300 focus-within:ring-1 focus-within:ring-slate-300 transition-all">
                  <input
                    type="number"
                    placeholder="Max Budget"
                    value={maxBudget}
                    onChange={(event) => setMaxBudget(event.target.value)}
                    className="w-full min-w-0 border-none bg-transparent py-3 text-slate-950 outline-none placeholder:text-slate-500 focus:ring-0 md:py-4"
                  />
                </div>
                <div className="flex-1 flex items-center bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-300 focus-within:border-slate-300 focus-within:ring-1 focus-within:ring-slate-300 transition-all">
                  <Select value={type} onValueChange={(value) => setType(value)}>
                    <SelectTrigger className="w-full border-none bg-transparent py-3 text-slate-950 outline-none focus:ring-0 md:py-4 h-auto shadow-none">
                      <div className="flex items-center">
                        <Building className="w-5 h-5 text-slate-400 mr-2 shrink-0" />
                        <SelectValue placeholder="Property" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      <SelectItem value="ALL">All Types</SelectItem>
                      <SelectItem value="HOUSE">House</SelectItem>
                      <SelectItem value="APARTMENT">Apartment</SelectItem>
                      <SelectItem value="VILLA">Villa</SelectItem>
                      <SelectItem value="TOWNHOUSE">Townhouse</SelectItem>
                      <SelectItem value="LAND">Land</SelectItem>
                      <SelectItem value="PLOT">Plot</SelectItem>
                      <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" size="lg" className="md:w-auto w-full rounded-xl text-lg h-[52px] md:h-auto px-8 shadow-lg shadow-primary/25 shrink-0">
                  <Search className="w-5 h-5 mr-2 shrink-0" />
                  Search
                </Button>
              </div>
            </motion.form>

            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="rounded-full px-8 h-14" asChild>
                <Link href="/properties?purpose=RENT&status=AVAILABLE">View Rentals</Link>
              </Button>
              <Button size="lg" variant="secondary" className="rounded-full px-8 h-14" asChild>
                <Link href="/contact">Contact Us</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-8 text-slate-950">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            ["500+", "Happy Clients"],
            ["120+", "Properties Sold"],
            ["18+", "Locations Covered"],
            ["10 min", "Avg Response Time"],
          ].map(([value, label]) => (
            <div key={label} className="border-l border-slate-200 pl-4">
              <p className="text-3xl font-extrabold">{value}</p>
              <p className="text-sm font-medium text-slate-600">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-slate-50 py-20 text-slate-950 sm:py-24">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
            className="relative z-10 mb-12 flex flex-col items-start justify-between gap-6 md:mb-14 md:flex-row md:items-end"
          >
            <div className="max-w-2xl">
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.24em] text-emerald-600">Curated listings</p>
              <h2 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">Featured Properties</h2>
              <p className="text-lg text-slate-600">Handpicked homes and investment-ready properties in top locations.</p>
            </div>
            <Button variant="outline" size="lg" className="group hidden rounded-full border-slate-300 bg-white px-8 text-slate-800 hover:bg-slate-100 hover:text-slate-950 md:flex" asChild>
              <Link href="/properties">
                Browse Properties
                <motion.span className="ml-2 group-hover:translate-x-1 transition-transform">→</motion.span>
              </Link>
            </Button>
          </motion.div>

          {featuredProperties.length > 0 ? (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="relative z-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
            >
              {featuredProperties.map((property) => (
                <motion.div key={property.id} variants={fadeIn}>
                  <PremiumPropertyCard property={property} settings={settings} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="relative z-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
              No featured properties are published yet.
            </div>
          )}

          <div className="mt-12 text-center md:hidden">
            <Button size="lg" className="w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800" asChild>
              <Link href="/properties">Explore All Properties</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-50 relative">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Us</h2>
            <p className="text-slate-600">Trusted support from search to closing.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: ShieldCheck, title: "Professional Property Management", desc: "Expert management services to maximize your property returns." },
              { icon: Users, title: "Reliable Tenant Screening", desc: "Thorough screening process to find the perfect tenants." },
              { icon: TrendingUp, title: "Fast Maintenance Support", desc: "Quick response and professional maintenance services." },
              { icon: Clock, title: "Local Market Expertise", desc: `Deep knowledge of ${settings.city || "local"} property market trends.` },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.5 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white relative z-10">
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-sm font-bold uppercase tracking-widest text-primary">About {settings.businessName}</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">About Us</h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              {settings.defaultSeoDescription || settings.tagline || `${settings.businessName} helps property owners, buyers, tenants, and sellers move forward with reliable guidance.`}
            </p>
            <Button size="lg" className="rounded-full" asChild>
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
          <div className="rounded-[2rem] overflow-hidden border border-slate-100 shadow-2xl shadow-slate-200">
            <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200" alt="Premium living room" className="h-[520px] w-full object-cover" loading="lazy" />
          </div>
        </div>
      </section>

      <section className="py-24 bg-white relative">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-bold uppercase tracking-widest text-primary mb-2">Our Services</p>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900">Property Management Services</h2>
            <p className="text-slate-600 mt-4">Comprehensive solutions for property owners, buyers, sellers, and tenants{settings.city ? ` in ${settings.city}` : ""}.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              "Property Management",
              "Rental Listings", 
              "Tenant Management",
              "Property Maintenance",
              "3D Virtual Tours",
              "Real Estate Consulting",
            ].map((service, i) => (
              <motion.div
                key={service}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-slate-50 p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
                  <Building className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">{service}</h3>
                <p className="text-slate-600 leading-relaxed">Professional {service.toLowerCase()} solutions tailored to your needs.</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mb-12">
            <p className="text-sm font-bold uppercase tracking-widest text-primary mb-2">Testimonials</p>
            <h2 className="text-4xl font-bold text-slate-900">What Our Clients Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              ["Found my home quickly with great support.", "Home Buyer"],
              ["Professional team and smooth experience.", "Property Seller"],
              ["Highly recommend for buying and selling.", "Investor"],
            ].map(([quote, author]) => (
              <div key={quote} className="rounded-3xl bg-white border border-slate-100 p-8 shadow-sm">
                <Quote className="h-8 w-8 text-primary mb-6" />
                <p className="text-slate-700 leading-relaxed mb-6">“{quote}”</p>
                <p className="font-bold text-slate-900">{author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-white py-24">
        <div className="absolute inset-x-0 top-0 h-px bg-slate-200" />
        <div className="container mx-auto px-4 relative z-10 text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mb-6 text-4xl font-bold text-slate-950 md:text-5xl">Ready to Find Your Perfect Property?</h2>
            <p className="mx-auto mb-10 max-w-2xl text-xl font-medium text-slate-600">
              Tell us what you need. We will guide you to the right property.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-14 rounded-full bg-slate-900 px-8 text-lg font-bold text-white shadow-xl hover:bg-slate-800" asChild>
                <Link href="/properties">Browse Properties</Link>
              </Button>
              {whatsappHref && (
                <Button size="lg" variant="outline" className="h-14 rounded-full border-emerald-400 bg-emerald-600 px-8 text-lg font-bold text-white hover:border-emerald-500 hover:bg-emerald-700" asChild>
                  <a href={whatsappHref} target="_blank" rel="noreferrer">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Talk on WhatsApp
                  </a>
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
