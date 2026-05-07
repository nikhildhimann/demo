import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const MAX_QUERY_LENGTH = 80;
const MAX_SUGGESTIONS = 8;

function cleanQuery(value: string | null) {
  return (value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_QUERY_LENGTH);
}

function addSuggestion(suggestions: string[], seen: Set<string>, value: string | null | undefined, query: string) {
  const text = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  if (!text || !text.toLowerCase().includes(query.toLowerCase())) return;

  const key = text.toLowerCase();
  if (seen.has(key)) return;

  seen.add(key);
  suggestions.push(text);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = cleanQuery(searchParams.get("q"));

    if (query.length < 2) {
      return NextResponse.json([]);
    }

    const properties = await prisma.property.findMany({
      where: {
        deletedAt: null,
        status: { not: "DRAFT" },
        OR: [
          { location: { contains: query, mode: "insensitive" } },
          { city: { contains: query, mode: "insensitive" } },
          { suburb: { contains: query, mode: "insensitive" } },
          { address: { contains: query, mode: "insensitive" } },
          { state: { contains: query, mode: "insensitive" } },
        ],
      } as any,
      select: {
        location: true,
        city: true,
        suburb: true,
        address: true,
        state: true,
      } as any,
      orderBy: { createdAt: "desc" } as any,
      take: 30,
    });

    const suggestions: string[] = [];
    const seen = new Set<string>();

    for (const property of properties) {
      addSuggestion(suggestions, seen, (property as any).location, query);
      addSuggestion(suggestions, seen, (property as any).city, query);
      addSuggestion(suggestions, seen, (property as any).suburb, query);
      addSuggestion(suggestions, seen, (property as any).address, query);
      addSuggestion(suggestions, seen, (property as any).state, query);

      if (suggestions.length >= MAX_SUGGESTIONS) break;
    }

    return NextResponse.json(suggestions.slice(0, MAX_SUGGESTIONS));
  } catch (error) {
    console.error("[LOCATION_SUGGEST]", error);
    return NextResponse.json([]);
  }
}
