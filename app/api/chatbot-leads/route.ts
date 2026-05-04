import { NextRequest, NextResponse } from "next/server"; // IDE trigger
import { chatbotLeadSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { hasSpamTrap } from "@/lib/api-security";
import { getNotificationRecipient, sendLeadNotification } from "@/lib/email";
import { getSiteSettings } from "@/lib/settings";
import { upsertLeadFromPublicForm } from "@/lib/leads";

type LeadData = {
  name: string;
  phone: string;
  interestType: string;
  location: string;
  budget: string;
  propertyType: string;
  message?: string;
  source?: string;
  priority?: string;
};

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ").replace(/[<>]/g, "");
}

function normalizeLeadInput(data: LeadData) {
  return {
    name: normalizeText(data.name),
    phone: normalizeText(data.phone),
    interestType: normalizeText(data.interestType),
    location: normalizeText(data.location),
    budget: normalizeText(data.budget),
    propertyType: normalizeText(data.propertyType),
    message: data.message ? normalizeText(data.message) : "",
    source: data.source ? normalizeText(data.source) : "chatbot",
    priority: data.priority,
  };
}

export async function POST(req: NextRequest) {
  try {
    const limiter = rateLimit(req, 10, 60 * 60 * 1000);
    if (!limiter.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many requests. Please try again later.",
          retryAfter: limiter.retryAfter,
        },
        { status: 429 }
      );
    }

    const json = await req.json();
    if (hasSpamTrap(json)) {
      return NextResponse.json({ success: true });
    }

    const parsed = chatbotLeadSchema.parse(json);
    const normalized = normalizeLeadInput(parsed);

    const leadMessage = normalized.message ||
      `Chatbot Lead\nType: ${normalized.interestType}\nLocation: ${normalized.location}\nBudget: ${normalized.budget}\nProperty Type: ${normalized.propertyType}`;

    const { enquiry } = await upsertLeadFromPublicForm({
      name: normalized.name,
      phone: normalized.phone,
      message: leadMessage,
      source: "chatbot",
      budget: normalized.budget,
      preferredLocation: normalized.location,
      preferredType: normalized.propertyType,
      purpose: normalized.interestType,
      priority: normalized.priority,
    }) as any;

    const settings = await getSiteSettings();

    await sendLeadNotification(getNotificationRecipient(settings.email), {
      leadName: enquiry.name,
      phone: enquiry.phone,
      email: enquiry.email,
      message: enquiry.message,
      propertyTitle: "Chatbot enquiry",
      budget: enquiry.budget,
      location: enquiry.preferredLocation,
      source: enquiry.source,
      submittedAt: enquiry.createdAt,
      adminUrl: `${settings.siteUrl}/admin/enquiries`,
    });

    return NextResponse.json({
      success: true,
      enquiryId: enquiry.id,
    });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid lead data",
          issues: error.issues,
        },
        { status: 400 }
      );
    }

    console.error("[CHATBOT_LEADS_POST]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
