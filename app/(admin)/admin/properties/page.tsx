import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { AdminPropertiesClient } from "@/components/admin/AdminPropertiesClient";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminPropertiesPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ status?: string; featured?: string }> 
}) {
  await requireAdmin();
  const { status, featured } = await searchParams;

  const where: any = { deletedAt: null };
  if (status) where.status = status;
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
