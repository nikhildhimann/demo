"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, Mail } from "lucide-react";
import { ContactModal } from "./ContactModal";
import { formatPrice } from "@/lib/utils";
import type { PublicSiteSettings } from "@/types/settings";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

interface StickyContactBarProps {
  property: {
    id: string;
    title: string;
    image: string;
    address: string;
    price: number;
    phone?: string;
  };
  settings: PublicSiteSettings;
}

export function StickyContactBar({ property, settings }: StickyContactBarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState<"property_detail" | "book_viewing">("property_detail");

  const handleWhatsApp = () => {
    const message = `Hi, I'm interested in "${property.title}" (${formatPrice(property.price, settings.currency)}) located at ${property.address}. Source: whatsapp_click. ${window.location.href}`;
    const url = buildWhatsAppUrl(settings.whatsappNumber || property.phone || "", message);
    if (!url) return;
    window.open(url, "_blank");
  };

  const handleCall = () => {
    const phone = property.phone || settings.phone;
    if (phone) window.location.href = `tel:${phone}`;
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t md:hidden flex gap-2">
        <Button
          variant="outline"
          className="flex-1 bg-green-600 hover:bg-green-700 text-white border-none"
          onClick={handleWhatsApp}
          disabled={!settings.whatsappNumber && !property.phone}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          WhatsApp
        </Button>
        <Button
          variant="outline"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-none"
          onClick={handleCall}
          disabled={!property.phone && !settings.phone}
        >
          <Phone className="mr-2 h-4 w-4" />
          Call
        </Button>
        <Button className="flex-1" onClick={() => {
          setModalSource("property_detail");
          setIsModalOpen(true);
        }}>
          <Mail className="mr-2 h-4 w-4" />
          Enquire
        </Button>
      </div>

      <ContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        property={property}
        settings={settings}
        source={modalSource}
      />
    </>
  );
}
