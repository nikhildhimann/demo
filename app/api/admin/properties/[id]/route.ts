import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { normalizePropertyInput } from "@/lib/property-admin";
import { revalidatePath } from "next/cache";

async function assertAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
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
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { id } = await params;
    const body = await req.json();

    // Quick update mode for status/featured toggles from list view
    if (
      body &&
      typeof body === "object" &&
      Object.keys(body).every((key) => key === "status" || key === "featured")
    ) {
      const property = await prisma.property.update({
        where: { id },
        data: {
          status: body.status,
          featured: typeof body.featured === "boolean" ? body.featured : undefined,
        } as any,
        include: { images: true },
      });

      revalidatePath("/");
      revalidatePath("/properties");
      revalidatePath(`/properties/${property.slug}`);
      return NextResponse.json(property);
    }

    const data = normalizePropertyInput(body);

    const property = await prisma.$transaction(async (tx) => {
      await tx.image.deleteMany({ where: { propertyId: id } });

      return tx.property.update({
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
          country: data.country,
          amenities: data.amenities,
          featured: data.featured,
          deletedAt: null,
          images: {
            create: data.images.map((image, index) => ({
              url: image.url,
              publicId: image.publicId || "manual",
              order: image.order || index,
            })),
          },
        } as any,
        include: { images: true },
      });
    });

    revalidatePath("/");
    revalidatePath("/properties");
    revalidatePath(`/properties/${property.slug}`);
    return NextResponse.json(property);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", issues: error.errors }, { status: 400 });
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
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

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
