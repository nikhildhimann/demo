import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { enquirySchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { getNotificationRecipient, sendLeadNotification } from "@/lib/email";
import { getSiteSettings } from "@/lib/settings";
import { hasSpamTrap } from "@/lib/api-security";
import { upsertLeadFromPublicForm } from "@/lib/leads";

export async function GET() {
  return NextResponse.json({ error: "Public enquiry lookup is disabled." }, { status: 404 });
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
    if (hasSpamTrap(body)) {
      return NextResponse.json({ success: true, message: "Thanks! Our agent will contact you soon." });
    }

    const validatedData = enquirySchema.parse(body);

    const property = validatedData.propertyId
      ? await prisma.property.findUnique({ where: { id: validatedData.propertyId } })
      : null;

    if (validatedData.propertyId && !property) {
      return new NextResponse("Property not found", { status: 404 });
    }

    const { enquiry, isDuplicate } = await upsertLeadFromPublicForm({
      name: validatedData.name,
      email: validatedData.email || null,
      phone: validatedData.phone,
      message: validatedData.message,
      preferredContactTime: validatedData.preferredContactTime,
      propertyId: validatedData.propertyId || null,
      source: validatedData.source || (property ? "property_detail" : "contact_page"),
      budget: validatedData.budget || null,
      preferredLocation: validatedData.preferredLocation || property?.location || property?.city || null,
      preferredType: validatedData.preferredType || property?.type || null,
      purpose: validatedData.purpose || property?.purpose || null,
    });

    const settings = await getSiteSettings();

    await sendLeadNotification(getNotificationRecipient(settings.email), {
      leadName: enquiry.name,
      phone: enquiry.phone,
      email: enquiry.email,
      message: enquiry.message,
      propertyTitle: property?.title || "General enquiry",
      propertyUrl: property ? `${settings.siteUrl}/properties/${property.slug}` : null,
      budget: enquiry.budget,
      location: property?.location || property?.city || null,
      source: enquiry.source,
      submittedAt: enquiry.createdAt,
      adminUrl: `${settings.siteUrl}/admin/enquiries`,
    });

    return NextResponse.json({ 
      success: true, 
      message: "Thanks! Our agent will contact you within 10 minutes.",
      enquiryId: enquiry.id,
      duplicateUpdated: isDuplicate,
      whatsappUrl: settings.whatsappNumber
        ? `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(`Hi ${settings.businessName}, I submitted an enquiry${property ? ` for ${property.title}` : ""}. Please help me with the next step.`)}`
        : "",
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Please check your enquiry details.", issues: error.issues || error.errors }, { status: 400 });
    }
    console.error("[ENQUIRIES_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
