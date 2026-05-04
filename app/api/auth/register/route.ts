import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Public registration is disabled. Only admin accounts are supported." },
    { status: 404 }
  );
}

export async function GET() {
  return NextResponse.json(
    { error: "Public registration is disabled. Only admin accounts are supported." },
    { status: 404 }
  );
}
