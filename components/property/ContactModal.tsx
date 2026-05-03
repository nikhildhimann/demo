"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, MessageCircle } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { siteConfig } from "@/data/siteConfig";

const enquirySchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(10, "Valid phone number is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  interested: z.boolean().optional(),
});

type EnquiryFormValues = z.infer<typeof enquirySchema>;

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: {
    id: string;
    title: string;
    image: string;
    address: string;
    price: number;
  };
}

export function ContactModal({ isOpen, onClose, property }: ContactModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: siteConfig.currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(property.price);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      interested: true,
      message: `I'm interested in "${property.title}" located at ${property.address}. Please provide more details.`,
    },
  });

  const onSubmit = async (data: EnquiryFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          propertyId: property.id,
        }),
      });

      if (response.ok) {
        toast.success("Thanks! Our agent will contact you within 10 minutes.");
        reset();
        
        // Auto-close after 3 seconds as requested
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to send enquiry.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhatsAppEnquiry = () => {
    const whatsappMessage = `Hi! I'm interested in this property:

🏠 *${property.title}*
📍 ${property.address}
💰 ${formattedPrice}

I would like to know more details about this property. Please contact me soon.

Thank you!`;
    
    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/919464402648?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white text-slate-950 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enquire About This Property</DialogTitle>
          <DialogDescription>
            Fill out the form below and our agent will contact you shortly.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4 flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="relative h-16 w-16 overflow-hidden rounded-md">
            <Image
              src={property.image}
              alt={property.title}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h4 className="font-semibold text-sm line-clamp-1">{property.title}</h4>
            <p className="text-xs text-slate-600">{property.address}</p>
            <p className="text-sm font-bold text-primary">
              {formattedPrice}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              {...register("name")}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-[10px] text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-[10px] text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+1 234 567 890"
                {...register("phone")}
                disabled={isLoading}
              />
              {errors.phone && (
                <p className="text-[10px] text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Tell us what you're looking for..."
              className="min-h-[80px] resize-none"
              {...register("message")}
              disabled={isLoading}
            />
            {errors.message && (
              <p className="text-[10px] text-destructive">{errors.message.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="interested" defaultChecked {...register("interested")} />
            <label
              htmlFor="interested"
              className="text-xs font-medium leading-none text-slate-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I&apos;m interested in this property
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
              onClick={handleWhatsAppEnquiry}
              disabled={isLoading}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
            <Button type="submit" className="w-full bg-slate-900 text-white hover:bg-slate-800" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
