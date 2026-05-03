import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { chatbotLeadSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";

type LeadData = {
  name: string;
  phone: string;
  interestType: string;
  location: string;
  budget: string;
  propertyType: string;
  message?: string;
  source?: string;
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
    const parsed = chatbotLeadSchema.parse(json);
    const normalized = normalizeLeadInput(parsed);

    const leadMessage = normalized.message ||
      `Chatbot Lead\nType: ${normalized.interestType}\nLocation: ${normalized.location}\nBudget: ${normalized.budget}\nProperty Type: ${normalized.propertyType}`;

    const enquiry = await prisma.enquiry.create({
      data: {
        name: normalized.name,
        phone: normalized.phone,
        message: leadMessage,
        source: normalized.source,
        interestType: normalized.interestType,
        interestLocation: normalized.location,
        interestBudget: normalized.budget,
        interestPropertyType: normalized.propertyType,
      } as any,
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
