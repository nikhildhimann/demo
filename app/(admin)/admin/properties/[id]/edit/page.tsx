import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { PropertyForm } from "@/components/admin/PropertyForm";

export const dynamic = "force-dynamic";

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
    include: { images: { orderBy: { order: "asc" } } },
  });

  if (!property) notFound();

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Property</h1>
        <p className="text-muted-foreground">Update listing details, images, featured placement, and status.</p>
      </div>
      <PropertyForm property={property} />
    </div>
  );
}
