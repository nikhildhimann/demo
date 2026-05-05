import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { enquiryStatusSchema } from "@/lib/validators";
import { getSiteSettings } from "@/lib/settings";

function csvEscape(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function buildLeadWhere(searchParams: URLSearchParams) {
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const source = searchParams.get("source");
  const propertyId = searchParams.get("propertyId");
  const date = searchParams.get("date");
  const search = searchParams.get("search");
  const where: any = {};

  if (status && status !== "all") where.status = status;
  if (priority && priority !== "all") where.priority = priority;
  if (source && source !== "all") where.source = source;
  if (propertyId && propertyId !== "all") where.propertyId = propertyId;
  if (date && date !== "all") {
    const now = new Date();
    const start = new Date(now);
    if (date === "today") start.setHours(0, 0, 0, 0);
    if (date === "week") start.setDate(now.getDate() - 7);
    if (date === "month") start.setMonth(now.getMonth() - 1);
    where.createdAt = { gte: start };
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

function getLeadDateWindow() {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  return { now, startOfToday, endOfToday };
}

async function getLeadStats(where: any, total: number, dates: ReturnType<typeof getLeadDateWindow>) {
  const activeFollowUpStatus = { notIn: ["CONVERTED", "LOST", "SPAM"] };

  const newLeads = await prisma.enquiry.count({ where: { ...where, status: "NEW" } });
  const hot = await prisma.enquiry.count({ where: { ...where, priority: "HOT" } });
  const converted = await prisma.enquiry.count({ where: { ...where, status: "CONVERTED" } });
  const followUpsDue = await prisma.enquiry.count({
    where: {
      ...where,
      followUpDate: { lte: dates.now },
      status: activeFollowUpStatus,
    } as any,
  });
  const todayFollowUps = await prisma.enquiry.count({
    where: {
      ...where,
      followUpDate: { gte: dates.startOfToday, lte: dates.endOfToday },
      status: activeFollowUpStatus,
    } as any,
  });

  return {
    total,
    new: newLeads,
    hot,
    converted,
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
    const where = buildLeadWhere(searchParams);
    const dates = getLeadDateWindow();

    if (exportCsv) {
      const leads = await prisma.enquiry.findMany({
        where,
        include: { property: { select: { title: true, slug: true, city: true, type: true, purpose: true, price: true } as any } },
        orderBy: { createdAt: "desc" },
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

    const enquiries = await prisma.enquiry.findMany({
      where,
      include: {
        property: {
          select: { id: true, title: true, slug: true, city: true, location: true, type: true, purpose: true, price: true } as any,
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });
    const total = await prisma.enquiry.count({ where });
    const stats = await getLeadStats(where, total, dates);
    const sources = await prisma.enquiry.findMany({ distinct: ["source"], select: { source: true }, orderBy: { source: "asc" } });
    const properties = await prisma.property.findMany({
      where: { deletedAt: null, status: { not: "DRAFT" } } as any,
      select: { id: true, title: true, slug: true, city: true, location: true, type: true, purpose: true, price: true } as any,
      orderBy: { title: "asc" } as any,
      take: 500,
    });
    const todayFollowUps = await prisma.enquiry.findMany({
      where: {
        followUpDate: { gte: dates.startOfToday, lte: dates.endOfToday },
        status: { notIn: ["CONVERTED", "LOST", "SPAM"] },
      } as any,
      select: { id: true, name: true, phone: true, followUpDate: true, status: true } as any,
      orderBy: { followUpDate: "asc" } as any,
      take: 8,
    });
    const overdueFollowUps = await prisma.enquiry.findMany({
      where: {
        followUpDate: { lt: dates.startOfToday },
        status: { notIn: ["CONVERTED", "LOST", "SPAM"] },
      } as any,
      select: { id: true, name: true, phone: true, followUpDate: true, status: true } as any,
      orderBy: { followUpDate: "asc" } as any,
      take: 8,
    });
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

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const enquiryId = searchParams.get("id");

    if (!enquiryId) {
      return new NextResponse("Enquiry ID is required", { status: 400 });
    }

    const body = await req.json();
    const validatedData = enquiryStatusSchema.parse(body);

    const updatedEnquiry = await prisma.enquiry.update({
      where: { id: enquiryId },
      data: { status: validatedData.status } as any,
    });

    return NextResponse.json(updatedEnquiry);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(error.errors, { status: 400 });
    }
    console.error("[ADMIN_ENQUIRIES_PATCH]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const enquiryId = searchParams.get("id");

    if (!enquiryId) {
      return new NextResponse("Enquiry ID is required", { status: 400 });
    }

    await prisma.enquiry.delete({
      where: { id: enquiryId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("[ADMIN_ENQUIRIES_DELETE]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
