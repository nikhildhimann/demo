import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { enquiryStatusSchema } from "@/lib/validators";
import { getNotificationRecipient, sendEmail } from "@/lib/email";
import { getSiteSettings } from "@/lib/settings";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = enquiryStatusSchema.parse(body);
    const { notes, priority, followUpDate } = validatedData;

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
        priority: priority !== undefined ? priority : undefined,
        notes: notes !== undefined ? notes : undefined,
        followUpDate: followUpDate === "" || followUpDate === null ? null : followUpDate ? new Date(followUpDate) : undefined,
      } as any,
      include: {
        property: {
          select: { id: true, title: true, slug: true, city: true, location: true, type: true, purpose: true, price: true } as any,
        },
      },
    });

    const settings = await getSiteSettings();

    await sendEmail({
      to: getNotificationRecipient(settings.email),
      subject: `Lead Updated: ${existingEnquiry.name}`,
      text: [
        `Lead status updated for ${existingEnquiry.name}`,
        `Property: ${(existingEnquiry as any).property?.title || "General enquiry"}`,
        `New Status: ${validatedData.status}`,
        `Priority: ${priority || (existingEnquiry as any).priority}`,
        `Follow Up: ${followUpDate || (existingEnquiry as any).followUpDate?.toISOString() || "None"}`,
        `Admin Notes: ${notes || "None"}`,
        `Admin dashboard: ${settings.siteUrl}/admin/enquiries`,
      ].join("\n"),
    });

    return NextResponse.json(updatedEnquiry);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(error.issues, { status: 400 });
    }
    console.error("[ADMIN_ENQUIRY_PATCH]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 401 });
    }

    await prisma.enquiry.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("[ADMIN_ENQUIRY_DELETE]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
