import { type Prisma } from "@prisma/client";
const LeadPriority = {
  HOT: "HOT",
  WARM: "WARM",
  COLD: "COLD"
} as const;
type LeadPriority = typeof LeadPriority[keyof typeof LeadPriority];
type LeadStatus = "NEW" | "CONTACTED" | "INTERESTED" | "SITE_VISIT" | "NEGOTIATION" | "CONVERTED" | "LOST" | "SPAM";
import prisma from "@/lib/prisma";

type LeadInput = {
  name: string;
  phone: string;
  email?: string | null;
  message?: string | null;
  propertyId?: string | null;
  source?: string | null;
  budget?: string | null;
  preferredLocation?: string | null;
  preferredType?: string | null;
  purpose?: string | null;
  preferredContactTime?: string | null;
  priority?: string | null;
};

function clean(value?: string | null) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, "");
}

export function assignLeadPriority(input: LeadInput) {
  const hasPropertyOrBudget = Boolean(input.propertyId || clean(input.budget));
  const isViewingRequest = input.source === "book_viewing";
  const hasContact = Boolean(clean(input.phone));
  const hasMessage = Boolean(clean(input.message));
  const hasEmail = Boolean(clean(input.email));

  if (hasContact && hasPropertyOrBudget && isViewingRequest) return LeadPriority.HOT;
  if (hasContact && hasPropertyOrBudget) return LeadPriority.HOT;
  if (hasContact && (hasEmail || hasMessage)) return LeadPriority.WARM;
  return LeadPriority.COLD;
}

function buildDuplicateNote(input: LeadInput, existingSource?: string | null) {
  const timestamp = new Date().toISOString();
  return [
    `Duplicate lead update (${timestamp})`,
    `Source: ${clean(input.source) || "website"}`,
    existingSource ? `Previous source: ${existingSource}` : "",
    input.purpose ? `Purpose: ${input.purpose}` : "",
    input.preferredType ? `Preferred type: ${input.preferredType}` : "",
    input.preferredLocation ? `Preferred location: ${input.preferredLocation}` : "",
    input.budget ? `Budget: ${input.budget}` : "",
    input.message ? `Message: ${input.message}` : "",
  ].filter(Boolean).join("\n");
}

export async function upsertLeadFromPublicForm(input: LeadInput) {
  const phone = normalizePhone(input.phone);
  const email = clean(input.email);
  const priority = (clean(input.priority) as LeadPriority) || assignLeadPriority({ ...input, phone });
  const duplicateWhere: Prisma.EnquiryWhereInput[] = [{ phone }];

  if (email) {
    duplicateWhere.push({ email });
  }

  const existing = await prisma.enquiry.findFirst({
    where: {
      OR: duplicateWhere,
    },
    orderBy: { updatedAt: "desc" },
  });

  const data = {
    name: clean(input.name) || "Website Lead",
    email,
    phone,
    message: clean(input.message),
    propertyId: clean(input.propertyId),
    source: clean(input.source) || "website",
    budget: clean(input.budget),
    preferredLocation: clean(input.preferredLocation),
    preferredType: clean(input.preferredType),
    interestType: clean(input.purpose),
    interestLocation: clean(input.preferredLocation),
    interestBudget: clean(input.budget),
    interestPropertyType: clean(input.preferredType),
    preferredContactTime: clean(input.preferredContactTime),
    priority,
  };

  if (!existing) {
    const enquiry = await prisma.enquiry.create({ data });
    return { enquiry, isDuplicate: false };
  }

  const duplicateNote = buildDuplicateNote(input, existing.source);
  const notes = [existing.notes, duplicateNote].filter(Boolean).join("\n\n");

  const enquiry = await prisma.enquiry.update({
    where: { id: existing.id },
    data: {
      name: data.name || existing.name,
      email: data.email || existing.email,
      phone: data.phone || existing.phone,
      message: data.message || existing.message,
      propertyId: data.propertyId || existing.propertyId,
      source: data.source,
      budget: data.budget || (existing as any).budget,
      preferredLocation: data.preferredLocation || (existing as any).preferredLocation,
      preferredType: data.preferredType || (existing as any).preferredType,
      interestType: data.interestType || (existing as any).interestType,
      interestLocation: data.interestLocation || (existing as any).interestLocation,
      interestBudget: data.interestBudget || (existing as any).interestBudget,
      interestPropertyType: data.interestPropertyType || (existing as any).interestPropertyType,
      preferredContactTime: data.preferredContactTime || (existing as any).preferredContactTime,
      priority,
      notes,
    } as any,
  });

  return { enquiry, isDuplicate: true };
}

