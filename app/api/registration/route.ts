import { NextResponse } from "next/server";
import { verifyTurnstileToken } from "@/lib/captcha";
import { prisma } from "@/lib/db";
import { apiErrorResponse, assertSameOrigin, ApiError } from "@/lib/http";
import { normalizeRegistrationPayload } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const parsed = normalizeRegistrationPayload(await request.json().catch(() => null));
    const captcha = await verifyTurnstileToken(parsed.captchaToken);
    if (!captcha.ok) throw new ApiError(captcha.reason ?? "Captcha verification failed.");
    const tournament = await prisma.tournament.findUnique({ where: { id: parsed.tournamentId } });
    const now = new Date();
    if (!tournament || tournament.status !== "registration" || !tournament.registrationOpen || (tournament.registrationClosesAt && tournament.registrationClosesAt <= now)) {
      throw new ApiError("Registration is closed for this tournament.", 403, "registration_closed");
    }
    if (tournament.game !== parsed.game) throw new ApiError("Registration game does not match the tournament.");
    const conflict = await prisma.registrationMember.findFirst({
      where: {
        registration: { tournamentId: tournament.id, status: { not: "rejected" } },
        OR: [
          { studentId: { in: parsed.members.map((member) => member.studentId) } },
          { email: { in: parsed.members.map((member) => member.email) } }
        ]
      }
    });
    if (conflict) throw new ApiError("A player on this roster already has an active registration for this tournament.", 409, "duplicate_player");
    const registration = await prisma.registration.create({
      data: {
        tournamentId: tournament.id,
        game: tournament.game,
        mode: parsed.mode,
        teamName: parsed.mode === "team" ? parsed.teamName : null,
        captchaProvider: captcha.provider,
        members: { create: parsed.members }
      }
    });
    return NextResponse.json({ id: registration.id, status: registration.status }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
