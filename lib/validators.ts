import { z } from "zod";
import { EnquiryStatus, PropertyStatus, PropertyType } from "@prisma/client";

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
  country: z.string().optional().default(""),
  amenities: z.array(z.string()),
  featured: z.boolean().default(false),
  images: z.array(
    z.object({
      url: z.string().url(),
      publicId: z.string().optional().default("manual"),
      order: z.coerce.number().int().default(0),
    })
  ).min(1, "At least one image is required").max(6, "Maximum 6 images are allowed"),
});

export const enquirySchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(7, "Phone number is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  propertyId: z.string().optional().or(z.literal("")),
  preferredContactTime: z.string().optional(),
});

export const enquiryStatusSchema = z.object({
  status: z.nativeEnum(EnquiryStatus),
  notes: z.string().optional(),
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
});
