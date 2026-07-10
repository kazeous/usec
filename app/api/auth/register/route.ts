import { NextResponse } from "next/server";
import { verifyTurnstileToken } from "@/lib/captcha";
import { apiErrorResponse, assertSameOrigin, ApiError } from "@/lib/http";
import { submitStaffApplication } from "@/lib/staff-accounts";
import { staffApplicationSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = staffApplicationSchema.parse(await request.json().catch(() => null));
    const captcha = await verifyTurnstileToken(input.captchaToken);
    if (!captcha.ok) throw new ApiError(captcha.reason ?? "Captcha verification failed.");
    const application = await submitStaffApplication(input);
    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
