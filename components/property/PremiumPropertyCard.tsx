"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bed, Bath, Square, MapPin, Heart, MessageCircle, Eye } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { siteConfig } from "@/data/siteConfig";

interface PremiumPropertyCardProps {
  property: {
    id: string;
    title: string;
    slug: string;
    address: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    area: number;
    image: string;
    status: string;
    type: string;
  };
}

export function PremiumPropertyCard({ property }: PremiumPropertyCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const statusLabel = (property.status || "AVAILABLE").toLowerCase();
  const typeLabel = (property.type || "PROPERTY").toLowerCase();
  
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: siteConfig.currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(property.price);
  
  const isHearted = isInWishlist(property.id);
  
  const statusColors = {
    available: "bg-emerald-500 text-white",
    sold: "bg-rose-500 text-white", 
    rented: "bg-blue-500 text-white",
    pending: "bg-amber-500 text-white",
  };
  
  const statusColor = statusColors[statusLabel as keyof typeof statusColors] || statusColors.available;

  const whatsappMessage = `Hi! I'm interested in this property:

${property.title}
${property.address}
${formattedPrice}

Please provide more details.`;
  
  const whatsappUrl = `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      whileHover={{
        y: -8,
        scale: 1.01,
      }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition-shadow duration-500 hover:shadow-[0_28px_70px_rgba(15,23,42,0.18)]"
    >
      <Link
        href={`/properties/${property.slug}`}
        className="relative block aspect-[4/3] min-h-[240px] overflow-hidden bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        aria-label={`View details for ${property.title}`}
      >
          <Image
            src={property.image}
            alt={property.title}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />

        <div className="absolute left-4 top-4 z-10">
          <Badge className={`${statusColor} rounded-full border border-white/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] shadow-lg backdrop-blur-md`}>
            {statusLabel}
          </Badge>
        </div>

        <div className="absolute bottom-4 left-4 right-4 z-10 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-200">{typeLabel}</p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight text-white drop-shadow-sm">{formattedPrice}</p>
          </div>
        </div>
      </Link>

      <button
        onClick={(event) => {
          event.stopPropagation();
          toggleWishlist(property);
        }}
        aria-label={isHearted ? "Remove from favorites" : "Add to favorites"}
        className={`absolute right-4 top-4 z-20 rounded-full p-2.5 backdrop-blur-md transition-all duration-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
          isHearted
            ? "bg-rose-500 text-white shadow-lg shadow-rose-500/35"
            : "border border-white/30 bg-black/35 text-white hover:bg-black/45"
        }`}
      >
        <Heart className={`h-4 w-4 transition-transform duration-200 ${isHearted ? "fill-white scale-110" : ""}`} />
      </button>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="space-y-3">
          <h3 className="line-clamp-2 min-h-[3.25rem] text-xl font-bold leading-tight tracking-tight text-slate-950 transition-colors group-hover:text-slate-700">
            {property.title}
          </h3>

          <div className="flex items-start gap-2 text-slate-600">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <span className="line-clamp-1 text-sm font-medium">{property.address}</span>
          </div>
        </div>

        <div className="my-5 grid grid-cols-3 gap-2 border-y border-slate-100 py-4">
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
            <Bed className="h-4 w-4 shrink-0 text-slate-800" />
            <div className="min-w-0">
              <p className="text-sm font-bold leading-none text-slate-950">{property.bedrooms}</p>
              <p className="mt-1 text-[11px] font-medium text-slate-500">Beds</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
            <Bath className="h-4 w-4 shrink-0 text-slate-800" />
            <div className="min-w-0">
              <p className="text-sm font-bold leading-none text-slate-950">{property.bathrooms}</p>
              <p className="mt-1 text-[11px] font-medium text-slate-500">Baths</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
            <Square className="h-4 w-4 shrink-0 text-slate-800" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-none text-slate-950">{property.area}</p>
              <p className="mt-1 text-[11px] font-medium text-slate-500">Area</p>
            </div>
          </div>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-3">
          <Button
            className="h-11 rounded-xl bg-slate-900 font-semibold text-white shadow-sm shadow-slate-950/10 hover:bg-slate-800 focus-visible:ring-emerald-500"
            asChild
          >
            <Link href={`/properties/${property.slug}`}>
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Link>
          </Button>

          <Button
            className="h-11 rounded-xl border border-emerald-500 bg-emerald-500 font-semibold text-white shadow-sm shadow-emerald-500/20 hover:border-emerald-600 hover:bg-emerald-600 focus-visible:ring-emerald-500/50"
            asChild
          >
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
