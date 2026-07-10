import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiErrorResponse, requireStaffApi } from "@/lib/http";
import { reviewRegistration } from "@/lib/registrations/service";

const reviewSchema = z.object({
  registrationId: z.string().min(1),
  action: z.enum(["reject", "approve_new", "approve_link"]),
  teamId: z.string().optional(),
  reviewNote: z.string().max(500).optional()
});

export async function GET(request: Request) {
  try {
    await requireStaffApi(request);
    const url = new URL(request.url);
    const tournamentId = url.searchParams.get("tournamentId");
    return NextResponse.json(await prisma.registration.findMany({
      where: tournamentId ? { tournamentId } : undefined,
      include: { members: { orderBy: { isCaptain: "desc" } }, tournament: true, resolvedTeam: true },
      orderBy: { createdAt: "desc" }
    }));
  } catch (error) { return apiErrorResponse(error); }
}

export async function PATCH(request: Request) {
  try {
    await requireStaffApi(request);
    return NextResponse.json(await reviewRegistration(reviewSchema.parse(await request.json())));
  } catch (error) { return apiErrorResponse(error); }
}
