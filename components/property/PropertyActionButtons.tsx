"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Heart, Check } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import type { SavedProperty } from "@/hooks/useWishlist";

interface PropertyActionButtonsProps {
  property: SavedProperty;
}

export function PropertyActionButtons({ property }: PropertyActionButtonsProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [copied, setCopied] = useState(false);
  const isHearted = isInWishlist(property.id);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: `Check out this property: ${property.title}`,
          url: url,
        });
        return;
      } catch (err) {
        // Fallback to copy if share is cancelled or fails
      }
    }
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <div className="flex items-center gap-3 w-full md:w-auto">
      <Button 
        onClick={handleShare}
        variant="outline" 
        className="h-12 flex-1 rounded-full border-slate-300 bg-white px-6 text-slate-800 shadow-sm hover:bg-slate-100 md:flex-none"
      >
        {copied ? <Check className="w-5 h-5 mr-2 text-emerald-600" /> : <Share2 className="w-5 h-5 mr-2" />}
        {copied ? "Copied!" : "Share"}
      </Button>
      <Button 
        onClick={() => toggleWishlist(property)}
        variant="outline" 
        className={`h-12 flex-1 rounded-full border-slate-300 bg-white px-6 shadow-sm md:flex-none transition-colors ${
          isHearted 
            ? "text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-200 bg-rose-50" 
            : "text-slate-800 hover:bg-slate-100"
        }`}
      >
        <Heart className={`w-5 h-5 mr-2 transition-transform ${isHearted ? "fill-rose-600 scale-110" : ""}`} /> 
        {isHearted ? "Saved" : "Save"}
      </Button>
    </div>
  );
}
