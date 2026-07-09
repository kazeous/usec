import { NextResponse } from "next/server";
import { verifyCaptchaPlaceholder } from "@/lib/captcha";
import { prisma } from "@/lib/db";
import { normalizeRegistrationPayload } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedResult = (() => {
    try {
      return { ok: true as const, value: normalizeRegistrationPayload(body) };
    } catch (error) {
      return { ok: false as const, error };
    }
  })();

  if (!parsedResult.ok) {
    return NextResponse.json({ error: "Registration form is incomplete or invalid." }, { status: 400 });
  }

  const parsed = parsedResult.value;
  const captcha = await verifyCaptchaPlaceholder(parsed.captchaToken);

  if (!captcha.ok) {
    return NextResponse.json({ error: captcha.reason ?? "Captcha verification failed." }, { status: 400 });
  }

  try {
    const setting = await prisma.registrationSetting.findUnique({
      where: {
        game: parsed.game
      }
    });

    if (!setting?.isOpen) {
      return NextResponse.json({ error: "Registration is closed for this game." }, { status: 403 });
    }

    const registration = await prisma.registration.create({
      data: {
        game: parsed.game,
        mode: parsed.mode,
        studentId: parsed.studentId,
        universityName: parsed.universityName,
        fullName: parsed.fullName,
        email: parsed.email.toLowerCase(),
        discord: parsed.discord,
        teamName: parsed.teamName,
        teammates: parsed.teammates,
        captchaProvider: captcha.provider
      }
    });

    return NextResponse.json({ id: registration.id, status: registration.status }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Registration storage is not available." }, { status: 503 });
  }
}
