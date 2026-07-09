import { NextResponse } from "next/server";
import { clearStaffSession } from "@/lib/auth";

export async function POST(request: Request) {
  await clearStaffSession().catch(() => null);

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto}://${host}` : request.url;

  return NextResponse.redirect(new URL("/staff/login", origin), 303);
}
