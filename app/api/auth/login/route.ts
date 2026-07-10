import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createStaffSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiErrorResponse, assertSameOrigin, ApiError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = await request.json().catch(() => null);
    const email = String(body?.email ?? "").toLowerCase().trim();
    const password = String(body?.password ?? "");
    if (!email || !password) throw new ApiError("Email and password are required.");
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const key = createHash("sha256").update(`${ip}:${email}`).digest("hex");
    const windowStart = new Date(Date.now() - 15 * 60 * 1000);
    const failures = await prisma.loginAttempt.count({ where: { key, success: false, createdAt: { gte: windowStart } } });
    if (failures >= 5) throw new ApiError("Too many failed attempts. Try again in 15 minutes.", 429, "rate_limited");
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      await prisma.loginAttempt.create({ data: { key, success: false } });
      throw new ApiError("Invalid staff credentials.", 401, "invalid_credentials");
    }
    await prisma.loginAttempt.deleteMany({ where: { key } });
    if (user.accountStatus === "pending") {
      throw new ApiError("Your staff application is still waiting for administrator approval.", 403, "approval_pending");
    }
    if (user.accountStatus === "rejected") {
      throw new ApiError("Your staff application was rejected. You may update and resubmit it.", 403, "account_rejected");
    }
    await createStaffSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) { return apiErrorResponse(error); }
}
