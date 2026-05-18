import { requireAdmin } from "@/lib/admin";
import { PropertyForm, type PropertyFormValue } from "@/components/admin/PropertyForm";
import { getSiteSettings } from "@/lib/settings";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const validPropertyTypes = ["APARTMENT", "HOUSE", "VILLA", "TOWNHOUSE", "COMMERCIAL", "LAND", "PLOT"] as const;

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function parseExpectedPrice(value?: string | null) {
  if (!value) return 0;
  const normalized = value.toLowerCase().replace(/,/g, "");
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*(m|mil|million|k|thousand)?/);
  if (!match) return 0;

  const amount = Number.parseFloat(match[1]);
  if (!Number.isFinite(amount)) return 0;
  const suffix = match[2];
  if (suffix === "m" || suffix === "mil" || suffix === "million") return Math.round(amount * 1000000);
  if (suffix === "k" || suffix === "thousand") return Math.round(amount * 1000);
  return Math.round(amount);
}

function mapPropertyType(value?: string | null): PropertyFormValue["type"] {
  const normalized = (value || "").toUpperCase().replace(/[^A-Z]/g, "_");
  if ((validPropertyTypes as readonly string[]).includes(normalized)) return normalized;
  if (normalized.includes("UNIT") || normalized.includes("APARTMENT")) return "APARTMENT";
  if (normalized.includes("TOWN")) return "TOWNHOUSE";
  if (normalized.includes("COMMERCIAL") || normalized.includes("SHOP") || normalized.includes("OFFICE")) return "COMMERCIAL";
  if (normalized.includes("LAND")) return "LAND";
  if (normalized.includes("PLOT")) return "PLOT";
  if (normalized.includes("VILLA")) return "VILLA";
  if (normalized.includes("HOUSE") || normalized.includes("HOME")) return "HOUSE";
  return "HOUSE";
}

function extractCity(location: string) {
  const parts = location.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 2];
  return location.trim();
}

function buildDraftDescription(lead: {
  budget: string | null;
  preferredContactTime: string | null;
  preferredLocation: string | null;
  interestLocation: string | null;
  preferredType: string | null;
  interestPropertyType: string | null;
}) {
  const location = lead.preferredLocation || lead.interestLocation || "Sydney property";
  const type = lead.preferredType || lead.interestPropertyType || "Property";
  return [
    "Draft listing prepared from a seller appraisal lead.",
    "Review the original CRM lead before publishing.",
    "",
    `Location: ${location}`,
    `Property type: ${type}`,
    lead.budget ? `Expected price: ${lead.budget}` : "",
    lead.preferredContactTime ? `Seller timeline: ${lead.preferredContactTime}` : "",
  ].filter(Boolean).join("\n");
}

async function getSellerLeadPrefill(leadId?: string): Promise<PropertyFormValue | undefined> {
  if (!leadId) return undefined;

  const lead = await prisma.enquiry.findUnique({
    where: { id: leadId },
    select: {
      source: true,
      budget: true,
      preferredLocation: true,
      preferredType: true,
      interestLocation: true,
      interestPropertyType: true,
      preferredContactTime: true,
    },
  });

  if (!lead || lead.source !== "seller_appraisal") return undefined;

  const location = lead.preferredLocation || lead.interestLocation || "Sydney Property";
  const title = `Draft Listing - ${location}`;
  const city = extractCity(location);

  return {
    title,
    slug: slugify(title),
    price: parseExpectedPrice(lead.budget),
    purpose: "SELL",
    location,
    city,
    address: location,
    type: mapPropertyType(lead.preferredType || lead.interestPropertyType),
    bedrooms: 0,
    bathrooms: 0,
    size: 0,
    area: 0,
    description: buildDraftDescription(lead),
    amenities: [],
    images: [],
    featured: false,
    status: "DRAFT",
    state: "NSW",
    zip: "",
    zipCode: "",
    country: "Australia",
  };
}

export default async function NewPropertyPage({ searchParams }: { searchParams?: Promise<{ leadId?: string | string[] }> }) {
  await requireAdmin();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const [settings, prefilledProperty] = await Promise.all([
    getSiteSettings(),
    getSellerLeadPrefill(firstParam(resolvedSearchParams.leadId)),
  ]);

  return (
    <div className="p-8 w-full space-y-8 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Property</h1>
        <p className="text-muted-foreground">Create a new listing for the public property catalogue.</p>
      </div>
      <PropertyForm
        property={prefilledProperty}
        currency={settings.currency}
        prefillNotice={prefilledProperty ? "Prefilled from seller appraisal lead. Review details and add images before saving." : undefined}
      />
    </div>
  );
}
