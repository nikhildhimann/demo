import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { AdminPropertiesClient } from "@/components/admin/AdminPropertiesClient";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const propertyStatuses = ["AVAILABLE", "SOLD", "RENTED", "DRAFT"] as const;
const propertyTypes = ["APARTMENT", "HOUSE", "VILLA", "TOWNHOUSE", "COMMERCIAL", "LAND", "PLOT"] as const;
const propertyPurposes = ["BUY", "RENT", "SELL"] as const;

function isAllowedValue<T extends readonly string[]>(value: string | undefined, allowed: T): value is T[number] {
  return Boolean(value && (allowed as readonly string[]).includes(value));
}

export default async function AdminPropertiesPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ status?: string; featured?: string; type?: string; purpose?: string }> 
}) {
  await requireAdmin();
  const { status, featured, type, purpose } = await searchParams;

  const where: any = { deletedAt: null };
  if (isAllowedValue(status, propertyStatuses)) where.status = status;
  if (isAllowedValue(type, propertyTypes)) where.type = type;
  if (isAllowedValue(purpose, propertyPurposes)) where.purpose = purpose;
  if (featured === "true") where.featured = true;

  const [properties, settings] = await Promise.all([
    prisma.property.findMany({
      where,
      include: { images: { orderBy: { order: "asc" } } },
      orderBy: { updatedAt: "desc" },
    }),
    getSiteSettings(),
  ]);

  return <AdminPropertiesClient properties={properties} settings={settings} />;
}
