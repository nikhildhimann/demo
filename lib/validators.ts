import { z } from "zod";
import { PropertyStatus, PropertyType } from "@prisma/client";

export const propertySchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  slug: z.string().min(3).optional(),
  description: z.string().min(20, "Description must be at least 20 characters"),
  price: z.coerce.number().positive("Price must be a positive number").max(100000000000, "Price is too large"),
  purpose: z.enum(["BUY", "RENT", "SELL"]).optional().default("BUY"),
  status: z.nativeEnum(PropertyStatus),
  type: z.nativeEnum(PropertyType),
  bedrooms: z.coerce.number().int().nonnegative(),
  bathrooms: z.coerce.number().int().nonnegative(),
  area: z.coerce.number().positive().optional(),
  size: z.coerce.number().positive("Size is required"),
  location: z.string().min(2, "Location is required").optional().default(""),
  address: z.string().min(5),
  city: z.string().min(2, "Location is required"),
  state: z.string().optional().default(""),
  zip: z.string().optional().default(""),
  zipCode: z.string().optional().default(""),
  country: z.string().optional().default(""),
  amenities: z.array(z.string()),
  featured: z.boolean().default(false),
  images: z.array(
    z.object({
      url: z.string().url(),
      publicId: z.string().optional(),
      order: z.coerce.number().int().default(0),
    })
  ).min(1, "At least one image is required").max(6, "Maximum 6 images are allowed"),
});

export const enquirySchema = z.object({
  name: z.string().min(2, "Name is required").max(120),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(7, "Phone number is required").max(25).regex(/^[0-9+()\-\s]+$/, "Invalid phone number"),
  message: z.string().min(10, "Message must be at least 10 characters").max(1000),
  propertyId: z.string().cuid().optional().or(z.literal("")),
  budget: z.string().max(80).optional().or(z.literal("")),
  preferredLocation: z.string().max(120).optional().or(z.literal("")),
  purpose: z.enum(["BUY", "RENT", "SELL"]).optional(),
  preferredType: z.string().max(40).optional().or(z.literal("")),
  source: z.enum(["homepage", "property_detail", "chatbot", "book_viewing", "price_guide", "whatsapp_click", "contact_page", "property_card", "seller_appraisal"]).optional(),
  preferredContactTime: z.string().max(120).optional(),
  website: z.string().max(0).optional().or(z.literal("")),
  company: z.string().max(0).optional().or(z.literal("")),
  url: z.string().max(0).optional().or(z.literal("")),
  fax: z.string().max(0).optional().or(z.literal("")),
});

export const enquiryStatusSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "INTERESTED", "SITE_VISIT", "NEGOTIATION", "CONVERTED", "LOST", "SPAM"]).optional(),
  priority: z.enum(["HOT", "WARM", "COLD"]).optional(),
  notes: z.string().max(5000).optional(),
  followUpDate: z.string().datetime().nullable().optional().or(z.literal("")),
});

export const chatbotLeadSchema = z.object({
  name: z.string().min(2, "Name is required").max(120),
  phone: z.string().min(7, "Phone number is required").max(25).regex(/^[0-9+()\-\s]+$/, "Invalid phone number"),
  interestType: z.string().min(2).max(40),
  location: z.string().min(2).max(120),
  budget: z.string().min(2).max(80),
  propertyType: z.string().min(2).max(40),
  message: z.string().max(500).optional().default(""),
  source: z.string().max(40).optional().default("chatbot"),
  priority: z.enum(["HOT", "WARM", "COLD"]).optional(),
});
