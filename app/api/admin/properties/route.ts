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

export async function GET() {
  const session = await assertAdmin();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const properties = await prisma.property.findMany({
    include: { images: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ properties });
}

export async function POST(req: NextRequest) {
  try {
    const session = await assertAdmin();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const data = normalizePropertyInput(await req.json());
    const property = await prisma.property.create({
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
        authorId: (session.user as any).id,
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

    revalidatePath("/");
    revalidatePath("/properties");
    return NextResponse.json(property, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", issues: error.errors }, { status: 400 });
    }
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A property with this slug already exists." }, { status: 409 });
    }
    console.error("[ADMIN_PROPERTIES_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
