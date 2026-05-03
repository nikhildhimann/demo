import prisma from "@/lib/prisma";

function isDatabaseConnectionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("ENOTFOUND") || message.includes("tenant/user") || message.includes("Can't reach database");
}

function logDatabaseError(scope: string, error: unknown) {
  if (process.env.NEXT_PUBLIC_DEBUG_DB !== "true") {
    return;
  }

  if (isDatabaseConnectionError(error)) {
    console.warn(`[${scope}] Database connection failed. Check DATABASE_URL in .env.`);
    return;
  }

  console.warn(`[${scope}]`, error);
}

export const propertyInclude = {
  images: {
    orderBy: { order: "asc" as const },
  },
  author: {
    select: {
      name: true,
      email: true,
      image: true,
      phone: true,
    },
  },
};

export type PropertyWithRelations = Awaited<ReturnType<typeof getPropertyBySlug>>;

export type PropertyCardData = {
  id: string;
  title: string;
  slug: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  size?: number | null;
  image: string;
  status: string;
  type: string;
};

const fallbackImage =
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800";

export function toPropertyCardData(property: {
  id: string;
  title: string;
  slug: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  size?: number | null;
  status: string;
  type: string;
  images?: { url: string }[];
}): PropertyCardData {
  return {
    id: property.id,
    title: property.title,
    slug: property.slug,
    address: property.address,
    price: property.price,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    area: property.size || property.area,
    image: property.images?.[0]?.url || fallbackImage,
    status: property.status || "AVAILABLE",
    type: property.type || "PROPERTY",
  };
}

export async function getFeaturedProperties(limit = 3) {
  try {
    return await prisma.property.findMany({
      where: {
        deletedAt: null,
        featured: true,
      },
      include: propertyInclude,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch (error) {
    logDatabaseError("FEATURED_PROPERTIES", error);
    return [];
  }
}

export async function getProperties(filters: {
  search?: string;
  city?: string;
  location?: string;
  type?: string;
  status?: string;
  featured?: string;
  min?: string;
  max?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  sort?: string;
  limit?: string;
} = {}) {
  const limit = Number.parseInt(filters.limit || "50", 10);
  const where: any = {
    deletedAt: null,
    status: { not: "DRAFT" },
  };

  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;
  if (filters.featured === "true") where.featured = true;
  const location = filters.location || filters.city;
  if (location) {
    where.OR = [
      { city: { contains: location, mode: "insensitive" } },
      { address: { contains: location, mode: "insensitive" } },
      { state: { contains: location, mode: "insensitive" } },
    ];
  }
  if (filters.bedrooms) where.bedrooms = { gte: Number.parseInt(filters.bedrooms, 10) };

  const minPriceRaw = filters.min || filters.minPrice;
  const maxPriceRaw = filters.max || filters.maxPrice;
  const minPrice = minPriceRaw ? Number.parseFloat(minPriceRaw) : undefined;
  const maxPrice = maxPriceRaw ? Number.parseFloat(maxPriceRaw) : undefined;
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = minPrice;
    if (maxPrice) where.price.lte = maxPrice;
  }

  if (filters.search) {
    const searchConditions = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { city: { contains: filters.search, mode: "insensitive" } },
      { address: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
    where.AND = [...(where.AND || []), { OR: searchConditions }];
  }

  const orderBy =
    filters.sort === "price_asc"
      ? { price: "asc" as const }
      : filters.sort === "price_desc"
        ? { price: "desc" as const }
        : { createdAt: "desc" as const };

  try {
    return await prisma.property.findMany({
      where,
      include: propertyInclude,
      orderBy,
      take: Number.isFinite(limit) ? limit : 50,
    });
  } catch (error) {
    logDatabaseError("PROPERTIES", error);
    return [];
  }
}

export async function getPropertyBySlug(slug: string) {
  try {
    return await prisma.property.findFirst({
      where: {
        slug,
        deletedAt: null,
        status: { not: "DRAFT" },
      },
      include: propertyInclude,
    });
  } catch (error) {
    logDatabaseError("PROPERTY_BY_SLUG", error);
    return null;
  }
}

export async function getRelatedProperties(property: {
  id: string;
  city: string;
  type: string;
  price: number;
}, limit = 3) {
  const budgetSpread = property.price * 0.35;

  try {
    return await prisma.property.findMany({
      where: {
        id: { not: property.id },
        deletedAt: null,
        status: { not: "DRAFT" },
        OR: [
          { city: { equals: property.city, mode: "insensitive" } },
          { type: property.type as any },
          {
            price: {
              gte: Math.max(0, property.price - budgetSpread),
              lte: property.price + budgetSpread,
            },
          },
        ],
      },
      include: propertyInclude,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: limit,
    });
  } catch (error) {
    logDatabaseError("RELATED_PROPERTIES", error);
    return [];
  }
}
