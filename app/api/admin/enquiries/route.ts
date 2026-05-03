import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { enquiryStatusSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");
    const skip = (page - 1) * limit;

    const [enquiries, total] = await Promise.all([
      prisma.enquiry.findMany({
        include: {
          property: {
            select: { title: true, slug: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.enquiry.count(),
    ]);

    return NextResponse.json({
      enquiries,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalCount: total,
    });
  } catch (error) {
    console.error("[ADMIN_ENQUIRIES_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
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
      data: { status: validatedData.status },
    });

    return NextResponse.json(updatedEnquiry);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(error.errors, { status: 400 });
    }
    console.error("[ADMIN_ENQUIRIES_PATCH]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
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
  } catch (error) {
    console.error("[ADMIN_ENQUIRIES_DELETE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
