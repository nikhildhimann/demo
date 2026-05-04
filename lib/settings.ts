import "server-only";
import { z } from "zod";
import prisma from "@/lib/prisma";
import type { PublicSiteSettings } from "@/types/settings";

function cleanText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
}

function cleanMultiline(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/[<>]/g, "").replace(/\r\n/g, "\n").trim();
}

function cleanPhone(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/[^\d+()\-\s]/g, "").replace(/\s+/g, " ").trim();
}

function cleanWhatsAppNumber(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/\D/g, "");
}

function cleanUrl(value: unknown) {
  const text = cleanText(value);
  if (!text) return "";

  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function envSiteUrl() {
  return cleanUrl(process.env.NEXT_PUBLIC_SITE_URL) || cleanUrl(process.env.NEXTAUTH_URL);
}

function isMissingSettingsTable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? (error as { code?: unknown }).code : undefined;
  return code === "P2021";
}

export const settingsInputSchema = z.object({
  businessName: z.string().min(2).max(120).transform(cleanText),
  tagline: z.string().max(220).optional().default("").transform(cleanText),
  phone: z.string().max(40).optional().default("").transform(cleanPhone),
  whatsappNumber: z.string().max(40).optional().default("").transform(cleanWhatsAppNumber),
  email: z.string().email().optional().or(z.literal("")).default(""),
  address: z.string().max(240).optional().default("").transform(cleanText),
  city: z.string().max(100).optional().default("").transform(cleanText),
  state: z.string().max(100).optional().default("").transform(cleanText),
  country: z.string().max(100).optional().default("").transform(cleanText),
  logoUrl: z.string().optional().default("").transform(cleanUrl),
  faviconUrl: z.string().optional().default("").transform(cleanUrl),
  primaryDomain: z.string().optional().default("").transform(cleanUrl),
  facebookUrl: z.string().optional().default("").transform(cleanUrl),
  twitterUrl: z.string().optional().default("").transform(cleanUrl),
  instagramUrl: z.string().optional().default("").transform(cleanUrl),
  linkedinUrl: z.string().optional().default("").transform(cleanUrl),
  youtubeUrl: z.string().optional().default("").transform(cleanUrl),
  defaultSeoTitle: z.string().max(160).optional().default("").transform(cleanText),
  defaultSeoDescription: z.string().max(300).optional().default("").transform(cleanMultiline),
});

export type SettingsInput = z.infer<typeof settingsInputSchema>;

const localFallbackSettings: SettingsInput = {
  businessName: "Real Estate Business",
  tagline: "Find, sell, and manage properties with expert support.",
  phone: "",
  whatsappNumber: "",
  email: "hello@example.com",
  address: "",
  city: "",
  state: "",
  country: "",
  logoUrl: "",
  faviconUrl: "",
  primaryDomain: envSiteUrl(),
  facebookUrl: "",
  twitterUrl: "",
  instagramUrl: "",
  linkedinUrl: "",
  youtubeUrl: "",
  defaultSeoTitle: "Real Estate Business | Properties for Buy, Rent and Sell",
  defaultSeoDescription: "A dynamic real estate website for listings, enquiries, and lead growth.",
};

function toPublicSettings(settings: SettingsInput): PublicSiteSettings {
  const displayAddress = [settings.address, settings.city, settings.state, settings.country].filter(Boolean).join(", ");
  const siteUrl = settings.primaryDomain || envSiteUrl() || "http://localhost:3000";

  return {
    ...settings,
    currency: "USD",
    businessHours: "Business hours",
    displayAddress,
    mapLocation: displayAddress || settings.city || settings.country,
    siteUrl,
    socialLinks: {
      facebook: settings.facebookUrl,
      twitter: settings.twitterUrl,
      instagram: settings.instagramUrl,
      linkedin: settings.linkedinUrl,
      youtube: settings.youtubeUrl,
    },
  };
}

function mapDbSettings(settings: NonNullable<Awaited<ReturnType<typeof prisma.siteSettings.findFirst>>>): SettingsInput {
  return settingsInputSchema.parse({
    businessName: settings.businessName,
    tagline: settings.tagline || "",
    phone: settings.phone || "",
    whatsappNumber: settings.whatsappNumber || "",
    email: settings.email || "",
    address: settings.address || "",
    city: settings.city || "",
    state: settings.state || "",
    country: settings.country || "",
    logoUrl: settings.logoUrl || "",
    faviconUrl: settings.faviconUrl || "",
    primaryDomain: settings.primaryDomain || "",
    facebookUrl: settings.facebookUrl || "",
    twitterUrl: settings.twitterUrl || "",
    instagramUrl: settings.instagramUrl || "",
    linkedinUrl: settings.linkedinUrl || "",
    youtubeUrl: settings.youtubeUrl || "",
    defaultSeoTitle: settings.defaultSeoTitle || "",
    defaultSeoDescription: settings.defaultSeoDescription || "",
  });
}

export async function getSiteSettings(): Promise<PublicSiteSettings> {
  try {
    const settings = await prisma.siteSettings.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (settings) {
      return toPublicSettings(mapDbSettings(settings));
    }
  } catch (error) {
    if (process.env.NODE_ENV === "production" && !isMissingSettingsTable(error)) {
      console.error("[SETTINGS_DB_ERROR]", error);
    }
  }

  return toPublicSettings(localFallbackSettings);
}

export function buildWhatsAppUrl(whatsappNumber: string, message = "") {
  const phone = cleanWhatsAppNumber(whatsappNumber);
  if (!phone) return "";
  return `https://wa.me/${phone}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

export function buildTelUrl(phone: string) {
  const value = cleanPhone(phone);
  return value ? `tel:${value}` : "";
}

export function buildMailUrl(email: string) {
  const value = cleanText(email);
  return value ? `mailto:${value}` : "";
}
