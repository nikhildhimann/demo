import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { siteConfig } from "@/data/siteConfig";

const schema = z.object({
  brandName: z.string().min(2),
  phone: z.string().min(7),
  whatsapp: z.string().min(7),
  email: z.string().email(),
  address: z.string().min(5),
  heroTitle: z.string().min(5),
  heroSubtitle: z.string().min(10),
  facebook: z.string().url(),
  twitter: z.string().url(),
  instagram: z.string().url(),
  linkedin: z.string().url(),
});

type SettingsData = z.infer<typeof schema>;

let inMemorySettings: SettingsData = {
  brandName: siteConfig.brandName,
  phone: siteConfig.phone,
  whatsapp: siteConfig.whatsapp,
  email: siteConfig.email,
  address: siteConfig.address,
  heroTitle: siteConfig.heroTitle,
  heroSubtitle: siteConfig.heroSubtitle,
  facebook: siteConfig.socialLinks.facebook,
  twitter: siteConfig.socialLinks.twitter,
  instagram: siteConfig.socialLinks.instagram,
  linkedin: siteConfig.socialLinks.linkedin,
};

async function assertAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  const session = await assertAdmin();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  return NextResponse.json({ settings: inMemorySettings });
}

export async function PATCH(req: NextRequest) {
  const session = await assertAdmin();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const body = await req.json();
    const parsed = schema.parse(body);
    inMemorySettings = parsed;
    return NextResponse.json({ ok: true, settings: inMemorySettings });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to save settings" }, { status: 500 });
  }
}
