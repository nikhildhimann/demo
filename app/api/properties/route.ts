import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { normalizePropertyInput } from "@/lib/property-admin";
import { revalidatePath } from "next/cache";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Filters
    const status = searchParams.get("status") as any;
    const type = searchParams.get("type") as any;
    const city = searchParams.get("city");
    const featured = searchParams.get("featured") === "true";
    const minRaw = searchParams.get("min") || searchParams.get("minPrice");
    const maxRaw = searchParams.get("max") || searchParams.get("maxPrice");
    const minPrice = minRaw ? parseFloat(minRaw) : undefined;
    const maxPrice = maxRaw ? parseFloat(maxRaw) : undefined;
    const search = searchParams.get("search");
    const location = searchParams.get("location");
    const bedrooms = searchParams.get("bedrooms");
    const sort = searchParams.get("sort");

    const where: any = {
      deletedAt: null,
      status: { not: "DRAFT" },
    };

    if (status) where.status = status;
    if (type) where.type = type;
    const locationQuery = location || city;
    if (locationQuery) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { city: { contains: locationQuery, mode: "insensitive" } },
            { address: { contains: locationQuery, mode: "insensitive" } },
            { state: { contains: locationQuery, mode: "insensitive" } },
          ],
        },
      ];
    }
    if (bedrooms) where.bedrooms = { gte: parseInt(bedrooms) };
    if (featured) where.featured = true;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = minPrice;
      if (maxPrice) where.price.lte = maxPrice;
    }
    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
            { address: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    const orderBy =
      sort === "price_asc"
        ? { price: "asc" as const }
        : sort === "price_desc"
          ? { price: "desc" as const }
          : { createdAt: "desc" as const };

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          images: {
            orderBy: { order: "asc" },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);

    return NextResponse.json({
      properties,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalCount: total,
    });
  } catch (error) {
    console.error("[PROPERTIES_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const validatedData = normalizePropertyInput(body);

    const property = await prisma.property.create({
      data: {
        title: validatedData.title,
        slug: validatedData.slug,
        description: validatedData.description,
        price: validatedData.price,
        status: validatedData.status,
        type: validatedData.type,
        bedrooms: validatedData.bedrooms,
        bathrooms: validatedData.bathrooms,
        area: validatedData.area,
        size: validatedData.size,
        address: validatedData.address,
        city: validatedData.city,
        state: validatedData.state,
        zip: validatedData.zip,
        country: validatedData.country,
        amenities: validatedData.amenities,
        featured: validatedData.featured,
        authorId: (session.user as any).id,
        images: {
          create: validatedData.images.map((img: any, index: number) => ({
            url: img.url,
            publicId: img.publicId,
            order: img.order || index,
          })),
        },
      },
      include: {
        images: true,
      },
    });

    revalidatePath("/");
    revalidatePath("/properties");

    return NextResponse.json(property);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(error.errors, { status: 400 });
    }
    console.error("[PROPERTIES_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
