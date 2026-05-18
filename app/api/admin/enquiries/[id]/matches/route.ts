import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";

function normalize(value?: string | null) {
  return (value || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function parseBudget(value?: string | null) {
  const text = normalize((value || "").replace(/,/g, ""));
  if (!text) return null;

  const matches = [...text.matchAll(/(\d+(?:\.\d+)?)\s*(m|mil|million|k|thousand)?/g)];
  const amounts = matches
    .map((match) => {
      const amount = Number.parseFloat(match[1]);
      const suffix = match[2];
      if (!Number.isFinite(amount)) return null;
      if (suffix === "m" || suffix === "mil" || suffix === "million") return amount * 1000000;
      if (suffix === "k" || suffix === "thousand") return amount * 1000;
      return amount;
    })
    .filter((amount): amount is number => amount !== null);

  if (!amounts.length) return null;
  return {
    min: text.includes("from") || text.includes("above") || text.includes("over") ? Math.min(...amounts) : null,
    max: Math.max(...amounts),
  };
}

function inferPurpose(lead: {
  interestType?: string | null;
  source?: string | null;
  message?: string | null;
  property?: { purpose?: string | null } | null;
}) {
  const direct = normalize(lead.interestType);
  if (direct.includes("rent")) return "RENT";
  if (direct.includes("buy") || direct.includes("purchase")) return "BUY";
  if (direct.includes("sell") || direct.includes("appraisal")) return "SELL";
  if (lead.property?.purpose) return lead.property.purpose;

  const source = normalize(lead.source);
  if (source.includes("seller") || source.includes("appraisal")) return "SELL";

  const message = normalize(lead.message);
  if (/\brent\b|\brental\b|\blease\b/.test(message)) return "RENT";
  if (/\bbuy\b|\bpurchase\b/.test(message)) return "BUY";
  if (/\bsell\b|\bappraisal\b/.test(message)) return "SELL";

  return null;
}

function matchesLocation(leadLocation: string, propertyLocation: string) {
  if (!leadLocation) return false;
  return propertyLocation.includes(leadLocation) || leadLocation.includes(propertyLocation);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 401 });
    }

    const { id } = await params;
    const lead = await prisma.enquiry.findUnique({
      where: { id },
      include: {
        property: {
          select: { id: true, purpose: true, location: true, suburb: true, city: true, type: true, price: true },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const budget = parseBudget(lead.budget || lead.interestBudget);
    const leadLocation = normalize(lead.preferredLocation || lead.interestLocation || lead.property?.location || lead.property?.suburb || lead.property?.city);
    const leadType = normalize(lead.preferredType || lead.interestPropertyType || lead.property?.type);
    const leadPurpose = inferPurpose(lead);

    const properties = await prisma.property.findMany({
      where: {
        deletedAt: null,
        status: "AVAILABLE",
        ...(lead.propertyId ? { id: { not: lead.propertyId } } : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        type: true,
        purpose: true,
        status: true,
        location: true,
        suburb: true,
        city: true,
        address: true,
        bedrooms: true,
        bathrooms: true,
        featured: true,
        createdAt: true,
        images: {
          select: { url: true },
          orderBy: { order: "asc" },
          take: 1,
        },
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 100,
    });

    const scored = properties
      .map((property) => {
        const reasons: string[] = [];
        let score = 0;
        const propertyLocation = normalize([property.location, property.suburb, property.city, property.address].filter(Boolean).join(" "));
        const propertyType = normalize(property.type);

        if (matchesLocation(leadLocation, propertyLocation)) {
          score += 40;
          reasons.push("Location match");
        }

        if (leadType && (propertyType.includes(leadType) || leadType.includes(propertyType))) {
          score += 25;
          reasons.push("Type match");
        }

        if (budget) {
          const aboveMin = budget.min === null || property.price >= budget.min * 0.9;
          const belowMax = property.price <= budget.max * 1.1;
          if (aboveMin && belowMax) {
            score += 25;
            reasons.push("Budget match");
          }
        }

        if (leadPurpose && property.purpose === leadPurpose) {
          score += 20;
          reasons.push("Purpose match");
        }

        if (property.featured) {
          score += 5;
          reasons.push("Featured");
        }

        return { property, score, reasons };
      })
      .sort((a, b) => b.score - a.score || Number(b.property.featured) - Number(a.property.featured) || b.property.createdAt.getTime() - a.property.createdAt.getTime())
      .slice(0, 6)
      .map(({ property, score, reasons }) => ({
        id: property.id,
        title: property.title,
        slug: property.slug,
        price: property.price,
        type: property.type,
        purpose: property.purpose,
        status: property.status,
        location: property.location,
        suburb: property.suburb,
        city: property.city,
        address: property.address,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        imageUrl: property.images[0]?.url || null,
        score,
        reasons,
      }));

    const settings = await getSiteSettings();
    return NextResponse.json({
      matches: scored,
      siteUrl: settings.siteUrl,
      currency: settings.currency && settings.currency !== "USD" ? settings.currency : "AUD",
    });
  } catch (error) {
    console.error("[ADMIN_ENQUIRY_MATCHES_GET]", error);
    return NextResponse.json({ error: "Could not load matches" }, { status: 500 });
  }
}
