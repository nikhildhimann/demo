"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, Store, MapPin, Calendar, MessageCircle } from "lucide-react";
import { z } from "zod";

const sellerFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(7, "Phone is required").regex(/^[0-9+\-()\s]+$/, "Invalid phone format"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().min(5, "Property address/location is required"),
  propertyType: z.string().min(2, "Property type is required"),
  expectedPrice: z.string().min(2, "Expected price is required"),
  timeline: z.string().min(2, "Selling timeline is required"),
  message: z.string().optional(),
});

type SellerFormData = z.infer<typeof sellerFormSchema>;

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

export function SellerForm() {
  const [formData, setFormData] = useState<SellerFormData>({
    name: "",
    phone: "",
    email: "",
    address: "",
    propertyType: "",
    expectedPrice: "",
    timeline: "",
    message: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof SellerFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState("");
  const [successWhatsAppUrl, setSuccessWhatsAppUrl] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof SellerFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setApiError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError("");
    setSuccessWhatsAppUrl("");
    setErrors({});

    try {
      const validated = sellerFormSchema.parse(formData);

      const messageContent = `Seller Appraisal Request\nProperty Address: ${validated.address}\nProperty Type: ${validated.propertyType}\nExpected Price: ${validated.expectedPrice}\nTimeline: ${validated.timeline}\n\nAdditional Details: ${validated.message || "None"}`;

      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: validated.name,
          email: validated.email,
          phone: validated.phone,
          message: messageContent,
          purpose: "SELL",
          source: "seller_appraisal",
          preferredLocation: validated.address,
          preferredType: validated.propertyType,
          budget: validated.expectedPrice,
          preferredContactTime: validated.timeline,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, "Something went wrong."));
      }

      setSuccessWhatsAppUrl(data?.whatsappUrl || "");
      setIsSuccess(true);
      setFormData({ name: "", phone: "", email: "", address: "", propertyType: "", expectedPrice: "", timeline: "", message: "" });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const newErrors: any = {};
        err.issues.forEach((e) => {
          if (e.path[0]) newErrors[e.path[0]] = e.message;
        });
        setErrors(newErrors);
      } else {
        setApiError(err.message || "Failed to submit request.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 rounded-3xl bg-emerald-50 py-16 px-6 text-center shadow-inner">
        <CheckCircle className="h-16 w-16 text-emerald-500" />
        <h3 className="text-2xl font-bold text-slate-900">Appraisal Request Sent!</h3>
        <p className="max-w-md text-slate-600">
          Thank you! Our local area expert has received your details and will contact you within 24 hours to discuss your property valuation.
        </p>
        {successWhatsAppUrl && (
          <Button asChild className="mt-2 bg-emerald-600 text-white hover:bg-emerald-700">
            <a href={successWhatsAppUrl} target="_blank" rel="noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" />
              Continue on WhatsApp
            </a>
          </Button>
        )}
        <Button onClick={() => setIsSuccess(false)} variant="outline" className="mt-4">
          Submit Another Property
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {apiError && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-800">
          {apiError}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-slate-700">Full Name *</label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" disabled={isSubmitting} />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone Number *</label>
          <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 234 567 8900" disabled={isSubmitting} />
          {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address (Optional)</label>
        <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" disabled={isSubmitting} />
        {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="address" className="text-sm font-medium text-slate-700">Property Address / Area *</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <Input id="address" name="address" value={formData.address} onChange={handleChange} placeholder="123 Main St, New York, NY" className="pl-10" disabled={isSubmitting} />
        </div>
        {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <label htmlFor="propertyType" className="text-sm font-medium text-slate-700">Property Type *</label>
          <div className="relative">
            <Store className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input id="propertyType" name="propertyType" value={formData.propertyType} onChange={handleChange} placeholder="Apartment, House..." className="pl-10" disabled={isSubmitting} />
          </div>
          {errors.propertyType && <p className="text-xs text-red-500">{errors.propertyType}</p>}
        </div>
        
        <div className="space-y-2">
          <label htmlFor="expectedPrice" className="text-sm font-medium text-slate-700">Expected Price *</label>
          <Input id="expectedPrice" name="expectedPrice" value={formData.expectedPrice} onChange={handleChange} placeholder="e.g. 800,000" disabled={isSubmitting} />
          {errors.expectedPrice && <p className="text-xs text-red-500">{errors.expectedPrice}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="timeline" className="text-sm font-medium text-slate-700">Selling Timeline *</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input id="timeline" name="timeline" value={formData.timeline} onChange={handleChange} placeholder="ASAP, 3 Months..." className="pl-10" disabled={isSubmitting} />
          </div>
          {errors.timeline && <p className="text-xs text-red-500">{errors.timeline}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-medium text-slate-700">Additional Details (Optional)</label>
        <Textarea 
          id="message" 
          name="message" 
          value={formData.message} 
          onChange={handleChange} 
          placeholder="Any recent renovations, unique features, or questions you have?" 
          className="min-h-[100px]"
          disabled={isSubmitting} 
        />
      </div>

      <Button type="submit" size="lg" className="w-full h-12 rounded-xl bg-slate-900 font-semibold text-white shadow-lg hover:bg-slate-800" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Submitting...
          </>
        ) : (
          "Get Free Property Appraisal"
        )}
      </Button>
      <p className="text-center text-xs text-slate-500">
        By submitting this form, you agree to be contacted by our real estate experts.
      </p>
    </form>
  );
}
