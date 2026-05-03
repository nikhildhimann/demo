"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/data/siteConfig";

export function WhatsAppButton() {
  const handleWhatsApp = () => {
    const url = `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent("Hi, I am interested in your real estate services.")}`;
    window.open(url, "_blank");
  };

  return (
    <Button
      onClick={handleWhatsApp}
      className="fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 bg-green-500 hover:bg-green-600 shadow-2xl transition-all hover:scale-110 active:scale-95"
      size="icon"
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="h-8 w-8 text-white" />
    </Button>
  );
}
