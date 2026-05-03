"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Mail, Phone, MapPin, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { siteConfig } from "@/data/siteConfig";
import { MapEmbed } from "@/components/MapEmbed";
import { useFormValidation } from "@/hooks/useFormValidation";

export default function ContactClient() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const whatsappUrl = `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent("Hi, I am interested in your real estate services.")}`;

  const validationRules = {
    name: { required: true, minLength: 2 },
    phone: { required: true, phone: true },
    message: { required: true, minLength: 10 }
  };

  const { values, errors, setValue, setTouchedField, validateAll, resetForm } = useFormValidation(
    { name: "", phone: "", message: "" },
    validationRules
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateAll()) {
      setError("Please fix the errors below");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          phone: values.phone,
          message: values.message,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Unable to send enquiry");

      setSuccess("Thanks! Our agent will contact you within 10 minutes.");
      resetForm();
    } catch (err: any) {
      setError(err.message || "Unable to send enquiry. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-20 font-sans">
      <div className="container max-w-7xl mx-auto px-4 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4"
          >
            Get in Touch
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600"
          >
            Call, message, or send your requirement. We will guide you to the next step.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 overflow-hidden">
          
          {/* Contact Information (Left) */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-5 space-y-8"
          >
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-10 text-slate-950 shadow-sm">
              
              <div className="relative z-10 space-y-10">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Contact Information</h2>
                  <p className="text-slate-600">Reach out to us directly or drop by our office.</p>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Phone</h3>
                      <p className="text-slate-700 mt-1 transition-colors cursor-pointer hover:text-slate-950">
                        {siteConfig.phone}
                      </p>
                      <p className="text-slate-500 text-sm mt-1">{siteConfig.businessHours}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Email</h3>
                      <p className="text-slate-700 mt-1 transition-colors cursor-pointer hover:text-slate-950">
                        {siteConfig.email}
                      </p>
                      <p className="text-slate-500 text-sm mt-1">Online support 24/7</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Office</h3>
                      <p className="text-slate-700 mt-1 leading-relaxed">
                        {siteConfig.address}
                      </p>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Quick Link */}
                <div className="pt-8 border-t border-slate-200">
                  <Button className="h-14 w-full rounded-xl bg-emerald-500 text-lg font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] hover:bg-emerald-600" asChild>
                    <a href={whatsappUrl} target="_blank" rel="noreferrer">
                    <MessageCircle className="w-6 h-6 mr-2" />
                    Chat with us on WhatsApp
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Form (Right) */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-7"
          >
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-slate-950 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Send Your Requirement</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      placeholder="John Doe" 
                      required 
                      className={`h-12 bg-white ${errors.name ? 'border-red-500' : ''}`}
                      value={values.name} 
                      onChange={(e) => setValue("name", e.target.value)}
                      onBlur={() => setTouchedField("name")}
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      placeholder="+1 (555) 000-0000" 
                      required 
                      className={`h-12 bg-white ${errors.phone ? 'border-red-500' : ''}`}
                      value={values.phone} 
                      onChange={(e) => setValue("phone", e.target.value)}
                      onBlur={() => setTouchedField("phone")}
                    />
                    {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Tell us how we can help you..." 
                    rows={5} 
                    required 
                    className={`resize-none bg-white ${errors.message ? 'border-red-500' : ''}`}
                    value={values.message}
                    onChange={(e) => setValue("message", e.target.value)}
                    onBlur={() => setTouchedField("message")}
                  />
                  {errors.message && <p className="text-sm text-red-500">{errors.message}</p>}
                </div>

                {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                {success && <p className="text-sm font-medium text-emerald-600">{success}</p>}

                <Button type="submit" className="w-full h-14 text-lg font-bold rounded-xl shadow-md transition-transform hover:scale-[1.01]" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
                  {isLoading ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </div>
          </motion.div>
        </div>

        {/* Map Section */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 w-full h-[500px] rounded-3xl overflow-hidden shadow-sm"
        >
          <MapEmbed query={siteConfig.mapLocation} title="Office Location" className="h-full" />
        </motion.div>
      </div>
    </div>
  );
}
