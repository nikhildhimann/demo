"use client";

import { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, MessageCircle } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import type { PublicSiteSettings } from "@/types/settings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const enquirySchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(7, "Valid phone number is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  budget: z.string().optional(),
  preferredLocation: z.string().optional(),
  purpose: z.enum(["BUY", "RENT", "SELL"]),
  preferredType: z.string().optional(),
});

type EnquiryFormValues = z.infer<typeof enquirySchema>;

type ApiIssue = {
  message?: string;
  path?: (string | number)[];
};

function getApiErrorMessage(data: any, fallback: string) {
  if (Array.isArray(data?.issues) && data.issues.length > 0) {
    return data.issues
      .map((issue: ApiIssue) => {
        const field = issue.path?.[0] ? `${issue.path[0]}: ` : "";
        return `${field}${issue.message || "Invalid value"}`;
      })
      .join("\n");
  }

  return data?.error || fallback;
}

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: {
    id: string;
    title: string;
    image: string;
    address: string;
    price: number;
    purpose?: string;
    type?: string;
    location?: string | null;
  };
  settings: PublicSiteSettings;
  source?: "property_detail" | "book_viewing" | "price_guide" | "property_card" | "contact_page";
  title?: string;
}

const sourceCopy = {
  property_detail: {
    title: "Enquire About This Property",
    description: "Share your details and our team will guide you through pricing, availability, and next steps.",
    message: "Please provide more details about this property.",
  },
  book_viewing: {
    title: "Book Inspection",
    description: "Would you like to inspect this property?",
    message: "I would like to book an inspection for this property. Please share available inspection times.",
  },
  price_guide: {
    title: "Request Price Guide",
    description: "Get current pricing, payment details, and comparable property guidance.",
    message: "Please send me the latest price guide and buying/rental details for this property.",
  },
  property_card: {
    title: "Enquire Now",
    description: "Send your requirement and our team will respond with the right next step.",
    message: "Please provide more details about this property.",
  },
  contact_page: {
    title: "Send Your Requirement",
    description: "Share your requirement and our team will contact you shortly.",
    message: "Please help me with my real estate requirement.",
  },
};

export function ContactModal({ isOpen, onClose, property, settings, source = "property_detail", title }: ContactModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [successWhatsAppUrl, setSuccessWhatsAppUrl] = useState("");
  const [selectedPurpose, setSelectedPurpose] = useState((property.purpose as "BUY" | "RENT" | "SELL") || "BUY");
  const [preferredContactTime, setPreferredContactTime] = useState("");
  const copy = sourceCopy[source] || sourceCopy.property_detail;
  const defaultMessage = `I'm interested in "${property.title}" located at ${property.address}. ${copy.message}`;
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: settings.currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(property.price);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      purpose: (property.purpose as "BUY" | "RENT" | "SELL") || "BUY",
      preferredType: property.type || "",
      preferredLocation: property.location || "",
      budget: "",
      message: defaultMessage,
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    setSuccessWhatsAppUrl("");
    setPreferredContactTime("");
    setValue("message", defaultMessage);
  }, [defaultMessage, isOpen, setValue]);

  const onSubmit = async (data: EnquiryFormValues) => {
    setIsLoading(true);
    try {
      const inspectionTime = preferredContactTime.trim();
      const message =
        source === "book_viewing" && inspectionTime
          ? `${data.message}\n\nPreferred inspection time: ${inspectionTime}`
          : data.message;
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          message,
          preferredContactTime: inspectionTime || undefined,
          propertyId: property.id,
          source,
        }),
      });

      if (response.ok) {
        const result = await response.json().catch(() => null);
        setSuccessWhatsAppUrl(result?.whatsappUrl || "");
        toast.success(result?.duplicateUpdated ? "Thanks! We updated your existing enquiry." : "Thanks! Our agent will contact you within 10 minutes.");
        reset();
        setPreferredContactTime("");
        setSelectedPurpose((property.purpose as "BUY" | "RENT" | "SELL") || "BUY");
      } else {
        const result = await response.json().catch(() => null);
        toast.error(getApiErrorMessage(result, "Something went wrong. Please try again."));
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

${property.title}
${property.address}
${formattedPrice}

I would like to know more details about this property. Please contact me soon.

Thank you!`;
    
    const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber, whatsappMessage);
    if (!whatsappUrl) return;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white text-slate-950 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title || copy.title}</DialogTitle>
          <DialogDescription>
            {copy.description}
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4 flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="relative h-16 w-16 overflow-hidden rounded-md">
            <Image
              src={property.image}
              alt={property.title}
              fill
              className="object-cover"
              unoptimized
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

          {source === "book_viewing" && (
            <div className="space-y-1">
              <Label htmlFor="preferredContactTime">Preferred inspection time</Label>
              <Input
                id="preferredContactTime"
                placeholder="e.g. Saturday morning, after 5pm, or next open home"
                value={preferredContactTime}
                onChange={(event) => setPreferredContactTime(event.target.value)}
                disabled={isLoading}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Purpose</Label>
              <Select value={selectedPurpose} onValueChange={(value) => {
                const purpose = value as "BUY" | "RENT" | "SELL";
                setSelectedPurpose(purpose);
                setValue("purpose", purpose);
              }}>
                <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUY">Buy</SelectItem>
                  <SelectItem value="RENT">Rent</SelectItem>
                  <SelectItem value="SELL">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="preferredType">Type</Label>
              <Input id="preferredType" placeholder="Apartment, Villa..." {...register("preferredType")} disabled={isLoading} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="budget">Budget</Label>
              <Input id="budget" placeholder="Optional" {...register("budget")} disabled={isLoading} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="preferredLocation">Preferred Location</Label>
              <Input id="preferredLocation" placeholder="Area / city" {...register("preferredLocation")} disabled={isLoading} />
            </div>
          </div>

          {successWhatsAppUrl && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              Enquiry saved. You can also continue on WhatsApp for a faster response.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
              onClick={() => {
                if (successWhatsAppUrl) {
                  window.open(successWhatsAppUrl, "_blank");
                  return;
                }
                handleWhatsAppEnquiry();
              }}
              disabled={isLoading || !settings.whatsappNumber}
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
