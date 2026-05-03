"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Mail, Phone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/data/siteConfig";

const AGENTS = [
  {
    id: 1,
    name: "Alex Rivera",
    role: "Senior Real Estate Agent",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80",
    email: siteConfig.email,
    phone: siteConfig.phone,
    specialty: "Luxury Villas",
  },
  {
    id: 2,
    name: "Sarah Chen",
    role: "Property Consultant",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    email: siteConfig.email,
    phone: siteConfig.phone,
    specialty: "Downtown Penthouses",
  },
  {
    id: 3,
    name: "Marcus Johnson",
    role: "Commercial Real Estate Broker",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80",
    email: siteConfig.email,
    phone: siteConfig.phone,
    specialty: "Commercial Spaces",
  },
  {
    id: 4,
    name: "Elena Rodriguez",
    role: "Real Estate Agent",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
    email: siteConfig.email,
    phone: siteConfig.phone,
    specialty: "Suburban Homes",
  },
  {
    id: 5,
    name: "Michael Chang",
    role: "Investment Advisor",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
    email: siteConfig.email,
    phone: siteConfig.phone,
    specialty: "Real Estate Investments",
  },
  {
    id: 6,
    name: "Priya Patel",
    role: "Luxury Property Expert",
    image: "https://images.unsplash.com/photo-1598550874175-4d0ef436c909?auto=format&fit=crop&w=400&q=80",
    email: siteConfig.email,
    phone: siteConfig.phone,
    specialty: "Premium Estates",
  },
];

export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-20 font-sans">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4"
          >
            Meet Our Experts
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-500"
          >
            The {siteConfig.brandName} team is dedicated to helping you find your dream property.
          </motion.p>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {AGENTS.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-100 transition-all duration-300 group"
            >
              {/* Image Container */}
              <div className="relative h-72 w-full overflow-hidden">
                <Image
                  src={agent.image}
                  alt={agent.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Agent Details */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-slate-900 mb-1">{agent.name}</h3>
                  <p className="text-primary font-medium">{agent.role}</p>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-3 text-slate-500 text-sm">
                    <span className="bg-slate-50 p-2 rounded-lg">
                      <Phone className="w-4 h-4 text-primary" />
                    </span>
                    {agent.phone}
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 text-sm">
                    <span className="bg-slate-50 p-2 rounded-lg">
                      <Mail className="w-4 h-4 text-primary" />
                    </span>
                    {agent.email}
                  </div>
                </div>

                <Button className="w-full rounded-xl transition-all shadow-md group-hover:shadow-lg" asChild>
                  <a href={`mailto:${agent.email}`}>
                    Contact {agent.name.split(' ')[0]} <ExternalLink className="w-4 h-4 ml-2" />
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
