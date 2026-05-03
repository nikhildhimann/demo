"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, Mail } from "lucide-react";
import { ContactModal } from "./ContactModal";
import { siteConfig } from "@/data/siteConfig";
import { formatPrice } from "@/lib/utils";

interface StickyContactBarProps {
  property: {
    id: string;
    title: string;
    image: string;
    address: string;
    price: number;
    phone?: string;
  };
}

export function StickyContactBar({ property }: StickyContactBarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleWhatsApp = () => {
    const message = `Hi, I'm interested in "${property.title}" (${formatPrice(property.price, siteConfig.currency)}) located at ${property.address}. ${window.location.href}`;
    const phone = (property.phone || siteConfig.whatsapp).replace(/\D/g, "");
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const handleCall = () => {
    window.location.href = `tel:${property.phone || siteConfig.phone}`;
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t md:hidden flex gap-2">
        <Button
          variant="outline"
          className="flex-1 bg-green-600 hover:bg-green-700 text-white border-none"
          onClick={handleWhatsApp}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          WhatsApp
        </Button>
        <Button
          variant="outline"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-none"
          onClick={handleCall}
        >
          <Phone className="mr-2 h-4 w-4" />
          Call
        </Button>
        <Button className="flex-1" onClick={() => setIsModalOpen(true)}>
          <Mail className="mr-2 h-4 w-4" />
          Enquire
        </Button>
      </div>

      <ContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        property={property}
      />
    </>
  );
}
