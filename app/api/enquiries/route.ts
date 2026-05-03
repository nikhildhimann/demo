import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { enquirySchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { sendEnquiryNotification } from "@/lib/email";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const enquiries = await prisma.enquiry.findMany({
      where: { email: session.user.email },
      orderBy: { createdAt: "desc" },
      include: {
        property: {
          select: { title: true, slug: true, images: true }
        }
      }
    });

    return NextResponse.json(enquiries);
  } catch (error) {
    console.error("[ENQUIRIES_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const limiter = rateLimit(req, 3, 3600000);
    if (!limiter.success) {
      return new NextResponse(
        JSON.stringify({ 
          error: "Too many enquiries. Please try again after some time.",
          retryAfter: limiter.retryAfter 
        }), 
        { 
          status: 429,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const body = await req.json();
    const validatedData = enquirySchema.parse(body);

    const property = validatedData.propertyId
      ? await prisma.property.findUnique({ where: { id: validatedData.propertyId } })
      : null;

    if (validatedData.propertyId && !property) {
      return new NextResponse("Property not found", { status: 404 });
    }

    const enquiry = await prisma.enquiry.create({
      data: {
        name: validatedData.name,
        email: validatedData.email || null,
        phone: validatedData.phone,
        message: validatedData.message,
        preferredContactTime: validatedData.preferredContactTime,
        propertyId: validatedData.propertyId || null,
        source: property ? `Property Page - ${property.title}` : "Contact Page",
      },
    });

    // Send Notification to Admin
    await sendEnquiryNotification({
      to: process.env.ADMIN_EMAIL,
      subject: `New Lead: ${property?.title || "General enquiry"}`,
      body: `
        New enquiry for: ${property?.title || "General enquiry"}
        Location: ${property?.address || "Not specified"}
        Contact: ${validatedData.name} - ${validatedData.phone} - ${validatedData.email || "No email provided"}
        Message: ${validatedData.message || "No message provided"}
        
        View in Admin Dashboard: ${process.env.NEXTAUTH_URL}/admin/enquiries
      `,
    });

    return NextResponse.json({ 
      success: true, 
      message: "Thanks! Our agent will contact you within 10 minutes.",
      enquiryId: enquiry.id 
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(error.errors, { status: 400 });
    }
    console.error("[ENQUIRIES_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
