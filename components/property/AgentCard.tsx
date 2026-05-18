"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, Mail, Calendar, UserCheck } from "lucide-react";
import { ContactModal } from "./ContactModal";
import type { PublicSiteSettings } from "@/types/settings";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

interface AgentCardProps {
  property: {
    id: string;
    title: string;
    image: string;
    address: string;
    price: number;
    phone?: string;
  };
  agent: {
    name: string;
    image?: string;
    phone: string;
    email: string;
  };
  settings: PublicSiteSettings;
}

export function AgentCard({ property, agent, settings }: AgentCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState<"property_detail" | "book_viewing" | "price_guide">("property_detail");
  const phone = agent.phone?.trim();
  const email = agent.email?.trim();

  const handleWhatsApp = () => {
    const message = `Hi ${settings.businessName}, I am interested in this property: "${property.title}" located at ${property.address}. Source: whatsapp_click.`;
    const url = buildWhatsAppUrl(settings.whatsappNumber || phone || "", message);
    if (!url) return;
    window.open(url, "_blank");
  };

  return (
    <div className="w-full h-auto space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-lg">
      <h3 className="text-xl font-bold tracking-tight">Ready to take the next step?</h3>
      
      {/* Agent Block */}
      <div className="flex items-center gap-4 py-2">
        <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
          {agent.image ? (
            <img src={agent.image} alt={agent.name} className="h-full w-full object-cover" />
          ) : (
            <UserCheck className="h-7 w-7 text-slate-400" />
          )}
        </div>
        <div>
          <h4 className="font-bold text-slate-900">{agent.name}</h4>
          <p className="text-sm font-medium text-slate-500">{settings.tagline || "Real estate team"}</p>
        </div>
      </div>

      {/* Contact Quick Links */}
      <div className="grid grid-cols-1 gap-2.5">
        <Button 
          variant="outline" 
          className="h-11 w-full justify-start border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50 hover:text-slate-900" 
          onClick={() => {
            if (phone) window.location.href = `tel:${phone}`;
          }}
          disabled={!phone}
        >
          <Phone className="mr-3 h-4 w-4 text-blue-600" />
          <span className="font-medium">{phone || "Phone not configured"}</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-11 w-full justify-start border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50 hover:text-slate-900" 
          onClick={handleWhatsApp}
          disabled={!settings.whatsappNumber && !phone}
        >
          <MessageCircle className="mr-3 h-4 w-4 text-emerald-500" />
          <span className="font-medium">WhatsApp</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-11 w-full justify-start border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50 hover:text-slate-900" 
          onClick={() => {
            if (email) window.location.href = `mailto:${email}`;
          }}
          disabled={!email}
        >
          <Mail className="mr-3 h-4 w-4 text-rose-500" />
          <span className="font-medium">{email ? "Email Agent" : "Email not configured"}</span>
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 space-y-3">
        <Button 
          className="h-11 w-full bg-slate-900 font-bold text-white hover:bg-slate-800" 
          onClick={() => {
            setModalSource("property_detail");
            setIsModalOpen(true);
          }}
        >
          Enquire Now
        </Button>
        <Button 
          variant="outline" 
          className="h-11 w-full border-slate-200 bg-slate-50 font-bold text-slate-700 hover:bg-slate-100"
          onClick={() => {
            setModalSource("book_viewing");
            setIsModalOpen(true);
          }}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Book Inspection
        </Button>
        <Button 
          variant="outline" 
          className="h-11 w-full border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50"
          onClick={() => {
            setModalSource("price_guide");
            setIsModalOpen(true);
          }}
        >
          Request Price Guide
        </Button>
        <Button 
          className="h-11 w-full bg-emerald-500 font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600" 
          onClick={handleWhatsApp}
          disabled={!settings.whatsappNumber && !phone}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          WhatsApp Agent
        </Button>
      </div>

      <ContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        property={property}
        settings={settings}
        source={modalSource}
      />
    </div>
  );
}
