import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";

const validLeadStatuses = ["NEW", "CONTACTED", "INTERESTED", "SITE_VISIT", "NEGOTIATION", "CONVERTED", "LOST", "SPAM"] as const;
const validLeadPriorities = ["HOT", "WARM", "COLD"] as const;
const activeFollowUpStatus = { notIn: ["CONVERTED", "LOST", "SPAM"] };
const validFollowUpFilters = ["due", "today", "overdue"] as const;

function csvEscape(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function isAllowedValue<T extends readonly string[]>(value: string | null, allowed: T): value is T[number] {
  return Boolean(value && (allowed as readonly string[]).includes(value));
}

function buildLeadWhere(searchParams: URLSearchParams, dates: ReturnType<typeof getLeadDateWindow>) {
  const leadId = searchParams.get("leadId");
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const source = searchParams.get("source");
  const propertyId = searchParams.get("propertyId");
  const date = searchParams.get("date");
  const followUp = searchParams.get("followUp");
  const search = searchParams.get("search");
  const where: any = {};

  if (leadId && leadId !== "all") where.id = leadId;
  if (isAllowedValue(status, validLeadStatuses)) where.status = status;
  if (isAllowedValue(priority, validLeadPriorities)) where.priority = priority;
  if (source && source !== "all") where.source = source;
  if (propertyId && propertyId !== "all") where.propertyId = propertyId;

  if (followUp === "due") {
    where.followUpDate = { lte: dates.now };
    where.status = activeFollowUpStatus;
  } else if (followUp === "today") {
    where.followUpDate = { gte: dates.startOfToday, lte: dates.endOfToday };
    where.status = activeFollowUpStatus;
  } else if (followUp === "overdue") {
    where.followUpDate = { lt: dates.startOfToday };
    where.status = activeFollowUpStatus;
  } else if (date && date !== "all") {
    const start = new Date(dates.now);
    if (date === "today") start.setHours(0, 0, 0, 0);
    if (date === "week") start.setDate(dates.now.getDate() - 7);
    if (date === "month") start.setMonth(dates.now.getMonth() - 1);
    if (["today", "week", "month"].includes(date)) where.createdAt = { gte: start };
  }
  if (search) {
    (where as any).OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { message: { contains: search, mode: "insensitive" } },
      { property: { title: { contains: search, mode: "insensitive" } } },
    ];
  }

  return where;
}

function getLeadOrderBy(searchParams: URLSearchParams) {
  return isAllowedValue(searchParams.get("followUp"), validFollowUpFilters)
    ? ({ followUpDate: "asc" } as const)
    : ({ createdAt: "desc" } as const);
}

function getLeadDateWindow() {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  return { now, startOfToday, endOfToday };
}

function isTransactionStartTimeout(error: unknown) {
  return error instanceof Error && error.message.includes("Unable to start a transaction in the given time");
}

async function runPrismaRead<T>(operation: () => Promise<T>, label: string, attempts = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransactionStartTimeout(error) || attempt === attempts) break;
      await new Promise((resolve) => setTimeout(resolve, 200 * attempt));
    }
  }

  console.error(`[ADMIN_ENQUIRIES_${label}]`, lastError);
  throw lastError;
}

async function optionalPrismaRead<T>(operation: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await runPrismaRead(operation, label);
  } catch {
    return fallback;
  }
}

async function getLeadStats(where: any, dates: ReturnType<typeof getLeadDateWindow>) {
  const total = await optionalPrismaRead(() => prisma.enquiry.count({ where }), 0, "COUNT_STATS_TOTAL");
  const newLeads = await optionalPrismaRead(() => prisma.enquiry.count({ where: { ...where, status: "NEW" } }), 0, "COUNT_NEW");
  const hot = await optionalPrismaRead(() => prisma.enquiry.count({ where: { ...where, priority: "HOT" } }), 0, "COUNT_HOT");
  const converted = await optionalPrismaRead(() => prisma.enquiry.count({ where: { ...where, status: "CONVERTED" } }), 0, "COUNT_CONVERTED");
  const lost = await optionalPrismaRead(() => prisma.enquiry.count({ where: { ...where, status: "LOST" } }), 0, "COUNT_LOST");
  const followUpsDue = await optionalPrismaRead(
    () => prisma.enquiry.count({
      where: {
        ...where,
        followUpDate: { lte: dates.now },
        status: activeFollowUpStatus,
      } as any,
    }),
    0,
    "COUNT_FOLLOW_UPS_DUE"
  );
  const todayFollowUps = await optionalPrismaRead(
    () => prisma.enquiry.count({
      where: {
        ...where,
        followUpDate: { gte: dates.startOfToday, lte: dates.endOfToday },
        status: activeFollowUpStatus,
      } as any,
    }),
    0,
    "COUNT_TODAY_FOLLOW_UPS"
  );

  return {
    total,
    new: newLeads,
    hot,
    converted,
    lost,
    followUpsDue,
    todayFollowUps,
  };
}

function adminErrorResponse(error: any, fallback: string) {
  console.error("[ADMIN_ENQUIRIES_GET]", error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const exportCsv = searchParams.get("export") === "csv";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "25"), 100);
    const skip = (page - 1) * limit;
    const dates = getLeadDateWindow();
    const where = buildLeadWhere(searchParams, dates);
    const orderBy = getLeadOrderBy(searchParams);

    if (exportCsv) {
      const leads = await prisma.enquiry.findMany({
        where,
        include: { property: { select: { title: true, slug: true, city: true, type: true, purpose: true, price: true } as any } },
        orderBy,
        take: 5000,
      });
      const headers = ["Created", "Updated", "Name", "Phone", "Email", "Status", "Priority", "Source", "Property", "Budget", "Preferred Location", "Preferred Type", "Follow Up", "Message", "Notes"];
      const rows = leads.map((lead) => [
        (lead as any).createdAt.toISOString(),
        (lead as any).updatedAt.toISOString(),
        lead.name,
        lead.phone,
        lead.email,
        lead.status,
        (lead as any).priority,
        lead.source,
        (lead as any).property?.title || "General enquiry",
        (lead as any).budget,
        (lead as any).preferredLocation,
        (lead as any).preferredType,
        (lead as any).followUpDate?.toISOString() || "",
        lead.message,
        (lead as any).notes,
      ]);
      const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    const enquiries = await runPrismaRead(
      () => prisma.enquiry.findMany({
        where,
        include: {
          property: {
            select: { id: true, title: true, slug: true, city: true, location: true, type: true, purpose: true, price: true } as any,
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      "FIND_MANY"
    );
    const total = await optionalPrismaRead(() => prisma.enquiry.count({ where }), enquiries.length, "COUNT_TOTAL");
    const stats = await getLeadStats({}, dates);
    const sources = await optionalPrismaRead(() => prisma.enquiry.findMany({ distinct: ["source"], select: { source: true }, orderBy: { source: "asc" } }), [], "FIND_SOURCES");
    const properties = await optionalPrismaRead(
      () => prisma.property.findMany({
        where: { deletedAt: null, status: { not: "DRAFT" } } as any,
        select: { id: true, title: true, slug: true, city: true, location: true, type: true, purpose: true, price: true } as any,
        orderBy: { title: "asc" } as any,
        take: 500,
      }),
      [],
      "FIND_PROPERTIES"
    );
    const todayFollowUps = await optionalPrismaRead(
      () => prisma.enquiry.findMany({
        where: {
          followUpDate: { gte: dates.startOfToday, lte: dates.endOfToday },
          status: { notIn: ["CONVERTED", "LOST", "SPAM"] },
        } as any,
        select: { id: true, name: true, phone: true, followUpDate: true, status: true } as any,
        orderBy: { followUpDate: "asc" } as any,
        take: 8,
      }),
      [],
      "FIND_TODAY_FOLLOW_UPS"
    );
    const overdueFollowUps = await optionalPrismaRead(
      () => prisma.enquiry.findMany({
        where: {
          followUpDate: { lt: dates.startOfToday },
          status: { notIn: ["CONVERTED", "LOST", "SPAM"] },
        } as any,
        select: { id: true, name: true, phone: true, followUpDate: true, status: true } as any,
        orderBy: { followUpDate: "asc" } as any,
        take: 8,
      }),
      [],
      "FIND_OVERDUE_FOLLOW_UPS"
    );
    const settings = await getSiteSettings();

    return NextResponse.json({
      enquiries,
      stats,
      sources: sources.map((item) => item.source).filter(Boolean),
      properties,
      todayFollowUps,
      overdueFollowUps,
      whatsappNumber: settings.whatsappNumber,
      businessName: settings.businessName,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalCount: total,
    });
  } catch (error: any) {
    return adminErrorResponse(error, "Unable to load leads right now. Please refresh in a moment.");
  }
}
