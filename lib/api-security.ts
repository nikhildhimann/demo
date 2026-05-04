import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function requireAdminApi() {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "ADMIN") {
    return {
      session: null,
      response: NextResponse.json({ error: "Admin access required" }, { status: 401 }),
    };
  }

  return { session, response: null };
}

export function hasSpamTrap(body: unknown) {
  if (!body || typeof body !== "object") return false;
  const data = body as Record<string, unknown>;
  return ["website", "company", "url", "fax"].some((key) => {
    const value = data[key];
    return typeof value === "string" && value.trim().length > 0;
  });
}
