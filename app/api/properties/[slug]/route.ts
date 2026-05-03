import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const property = await prisma.property.findFirst({
      where: { 
        slug,
        deletedAt: null,
        status: { not: "DRAFT" },
      },
      include: {
        images: {
          orderBy: { order: "asc" },
        },
        author: {
          select: {
            name: true,
            email: true,
            image: true,
            phone: true,
          },
        },
      },
    });

    if (!property) {
      return new NextResponse("Property not found", { status: 404 });
    }

    return NextResponse.json(property);
  } catch (error) {
    console.error("[PROPERTY_BY_SLUG_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
