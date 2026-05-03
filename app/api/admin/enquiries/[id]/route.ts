import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { enquiryStatusSchema } from "@/lib/validators";
import { sendEnquiryNotification } from "@/lib/email";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const validatedData = enquiryStatusSchema.parse(body);
    const { notes } = body;

    const existingEnquiry = await prisma.enquiry.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!existingEnquiry) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const updatedEnquiry = await prisma.enquiry.update({
      where: { id },
      data: { 
        status: validatedData.status,
        notes: notes !== undefined ? notes : undefined,
      },
    });

    // Notify Admin of the change (Auditing)
    await sendEnquiryNotification({
      to: process.env.ADMIN_EMAIL,
      subject: `Lead Updated: ${existingEnquiry.name}`,
      body: `
        Lead status updated for ${existingEnquiry.name}
        Property: ${existingEnquiry.property?.title || "General enquiry"}
        New Status: ${validatedData.status}
        Admin Notes: ${notes || "None"}
      `,
    });

    return NextResponse.json(updatedEnquiry);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(error.errors, { status: 400 });
    }
    console.error("[ADMIN_ENQUIRY_PATCH]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await prisma.enquiry.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[ADMIN_ENQUIRY_DELETE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
