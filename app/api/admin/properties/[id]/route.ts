import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { normalizePropertyInput } from "@/lib/property-admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const quickPropertyUpdateSchema = z.object({
  status: z.enum(["AVAILABLE", "SOLD", "RENTED", "DRAFT"]).optional(),
  featured: z.boolean().optional(),
}).refine((data) => data.status !== undefined || data.featured !== undefined, {
  message: "At least one field is required",
});

async function assertAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await assertAdmin();
    if (!session) return NextResponse.json({ error: "Admin access required" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    // Quick update mode for status/featured toggles from list view
    if (
      body &&
      typeof body === "object" &&
      Object.keys(body).every((key) => key === "status" || key === "featured")
    ) {
      const data = quickPropertyUpdateSchema.parse(body);
      const existingProperty = await prisma.property.findUnique({
        where: { id },
        select: { status: true },
      });

      if (!existingProperty) {
        return new NextResponse("Not Found", { status: 404 });
      }

      const nextStatus = data.status || existingProperty.status;

      if (data.featured === true && nextStatus !== "AVAILABLE") {
        return NextResponse.json({ error: "Only available properties can be featured." }, { status: 400 });
      }

      const property = await prisma.property.update({
        where: { id },
        data: {
          status: data.status,
          featured: nextStatus === "AVAILABLE" ? data.featured : false,
        },
        include: { images: true },
      });

      revalidatePath("/");
      revalidatePath("/properties");
      revalidatePath(`/properties/${property.slug}`);
      return NextResponse.json(property);
    }

    const data = normalizePropertyInput(body);
    const featured = data.status === "AVAILABLE" ? data.featured : false;

    const property = await prisma.property.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        price: data.price,
        purpose: data.purpose,
        status: data.status,
        type: data.type,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        area: data.area,
        size: data.size,
        location: data.location || data.city,
        address: data.address,
        city: data.city,
        state: data.state,
        zip: data.zip,
        zipCode: data.zipCode,
        country: data.country,
        amenities: data.amenities,
        featured,
        images: {
          deleteMany: {},
          create: data.images.map((image, index) => ({
            url: image.url,
            publicId: (image as any).publicId || "legacy-image-" + Date.now() + "-" + index,
            order: image.order || index,
          })),
        },
      },
      include: { images: true },
    });

    revalidatePath("/");
    revalidatePath("/properties");
    revalidatePath(`/properties/${property.slug}`);
    return NextResponse.json(property);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 400 });
    }
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A property with this slug already exists." }, { status: 409 });
    }
    console.error("[ADMIN_PROPERTY_PATCH]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await assertAdmin();
    if (!session) return NextResponse.json({ error: "Admin access required" }, { status: 401 });

    const { id } = await params;
    const property = await prisma.property.update({
      where: { id },
      data: { deletedAt: new Date(), featured: false },
    });

    revalidatePath("/");
    revalidatePath("/properties");
    revalidatePath(`/properties/${property.slug}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[ADMIN_PROPERTY_DELETE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
