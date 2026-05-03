import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { AdminPropertiesClient } from "@/components/admin/AdminPropertiesClient";

export const dynamic = "force-dynamic";

export default async function AdminPropertiesPage() {
  await requireAdmin();

  const properties = await prisma.property.findMany({
    include: { images: { orderBy: { order: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });

  return <AdminPropertiesClient properties={properties} />;
}
