"use client";

import { useMemo, useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

type MapEmbedProps = {
  query: string;
  title: string;
  className?: string;
};

export function MapEmbed({ query, title, className = "" }: MapEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const encodedQuery = useMemo(() => encodeURIComponent(query), [query]);
  const embedUrl = `https://maps.google.com/maps?q=${encodedQuery}&output=embed`;
  const openUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-100 ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-100 text-slate-500">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
            <MapPin className="h-7 w-7 text-primary" />
          </div>
          <p className="font-semibold text-slate-700">Loading map...</p>
          <p className="mt-1 text-sm text-slate-500">{query}</p>
        </div>
      )}

      <iframe
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="eager"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={embedUrl}
        title={title}
        onLoad={() => setIsLoaded(true)}
        className={`h-full w-full transition-opacity duration-500 ${isLoaded ? "opacity-100" : "opacity-0"}`}
      />

      <div className="absolute bottom-4 right-4 z-20">
        <Button size="sm" variant="secondary" className="rounded-full shadow-lg" asChild>
          <a href={openUrl} target="_blank" rel="noreferrer">
            Open Map
            <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
    </div>
  );
}
