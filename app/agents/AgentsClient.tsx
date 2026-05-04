"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ExternalLink, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PublicSiteSettings } from "@/types/settings";

const AGENTS = [
  {
    id: 1,
    name: "Lead Agent",
    role: "Senior Property Consultant",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80",
    specialty: "Residential Properties",
  },
  {
    id: 2,
    name: "Property Advisor",
    role: "Buyer & Tenant Specialist",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    specialty: "Property Search",
  },
  {
    id: 3,
    name: "Commercial Consultant",
    role: "Commercial Property Specialist",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80",
    specialty: "Commercial Spaces",
  },
];

export function AgentsClient({ settings }: { settings: PublicSiteSettings }) {
  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-20 font-sans">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
            Meet Our Experts
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-lg text-slate-500">
            The {settings.businessName} team is dedicated to helping you move confidently.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -5 }}
              className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl"
            >
              <div className="relative h-72 w-full overflow-hidden">
                <Image src={agent.image} alt={agent.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <h3 className="mb-1 text-2xl font-bold text-slate-900">{agent.name}</h3>
                  <p className="font-medium text-primary">{agent.role}</p>
                </div>

                <div className="mb-6 space-y-2">
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span className="rounded-lg bg-slate-50 p-2">
                      <Phone className="w-4 h-4 text-primary" />
                    </span>
                    {settings.phone || "Phone not configured"}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span className="rounded-lg bg-slate-50 p-2">
                      <Mail className="w-4 h-4 text-primary" />
                    </span>
                    {settings.email || "Email not configured"}
                  </div>
                </div>

                <Button className="w-full rounded-xl shadow-md transition-all group-hover:shadow-lg" asChild>
                  <a href={settings.email ? `mailto:${settings.email}` : "/contact"}>
                    Contact Team <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
