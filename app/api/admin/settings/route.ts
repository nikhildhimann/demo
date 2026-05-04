import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getSiteSettings, settingsInputSchema } from "@/lib/settings";

async function assertAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  const session = await assertAdmin();
  if (!session) return NextResponse.json({ error: "Admin access required" }, { status: 401 });

  const settings = await getSiteSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const session = await assertAdmin();
  if (!session) return NextResponse.json({ error: "Admin access required" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = settingsInputSchema.parse(body);

    const existing = await prisma.siteSettings.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    const settings = existing
      ? await prisma.siteSettings.update({
          where: { id: existing.id },
          data: parsed,
        })
      : await prisma.siteSettings.create({
          data: {
            id: "default",
            ...parsed,
          },
        });

    revalidatePath("/", "layout");

    return NextResponse.json({ ok: true, settings });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 400 });
    }
    console.error("[ADMIN_SETTINGS_PATCH]", error);
    return NextResponse.json({ error: "Unable to save settings" }, { status: 500 });
  }
}
