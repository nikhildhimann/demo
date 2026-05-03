"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, Mail, Calendar, UserCheck } from "lucide-react";
import { ContactModal } from "./ContactModal";
import { formatPrice } from "@/lib/utils";
import { siteConfig } from "@/data/siteConfig";

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
}

export function AgentCard({ property, agent }: AgentCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleWhatsApp = () => {
    const message = `Hi Stackron Real Estate, I am interested in this property: "${property.title}" located at ${property.address}.`;
    const url = `https://wa.me/919464402648?text=${encodeURIComponent(message)}`;
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
          <p className="text-sm font-medium text-slate-500">Real Estate Company</p>
        </div>
      </div>

      {/* Contact Quick Links */}
      <div className="grid grid-cols-1 gap-2.5">
        <Button 
          variant="outline" 
          className="h-11 w-full justify-start border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50 hover:text-slate-900" 
          onClick={() => window.location.href = `tel:${agent.phone}`}
        >
          <Phone className="mr-3 h-4 w-4 text-blue-600" />
          <span className="font-medium">{agent.phone}</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-11 w-full justify-start border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50 hover:text-slate-900" 
          onClick={handleWhatsApp}
        >
          <MessageCircle className="mr-3 h-4 w-4 text-emerald-500" />
          <span className="font-medium">WhatsApp</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-11 w-full justify-start border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50 hover:text-slate-900" 
          onClick={() => window.location.href = `mailto:${agent.email}`}
        >
          <Mail className="mr-3 h-4 w-4 text-rose-500" />
          <span className="font-medium">Email Agent</span>
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 space-y-3">
        <Button 
          className="h-11 w-full bg-slate-900 font-bold text-white hover:bg-slate-800" 
          onClick={() => setIsModalOpen(true)}
        >
          Enquire Now
        </Button>
        <Button 
          variant="outline" 
          className="h-11 w-full border-slate-200 bg-slate-50 font-bold text-slate-700 hover:bg-slate-100"
        >
          <Calendar className="mr-2 h-4 w-4" />
          Schedule a Visit
        </Button>
        <Button 
          className="h-11 w-full bg-emerald-500 font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600" 
          onClick={handleWhatsApp}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          WhatsApp Agent
        </Button>
      </div>

      <ContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        property={property}
      />
    </div>
  );
}
