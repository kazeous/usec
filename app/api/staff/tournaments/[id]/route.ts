import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiErrorResponse, ApiError, requireAdminApi } from "@/lib/http";
import { tournamentStatuses } from "@/lib/types";

const updateSchema = z.object({
  title: z.string().trim().min(3).max(150).optional(),
  status: z.enum(tournamentStatuses).optional(),
  registrationOpen: z.boolean().optional(),
  registrationMessage: z.string().trim().max(500).nullable().optional(),
  registrationClosesAt: z.string().datetime().nullable().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  swissRounds: z.number().int().min(3).max(7).nullable().optional()
});

const transitions: Record<string, string[]> = {
  draft: ["draft", "registration"],
  registration: ["draft", "registration", "seeded"],
  seeded: ["seeded", "live"],
  live: ["live", "complete"],
  complete: ["complete", "archived"],
  archived: ["archived"]
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminApi(request);
    const { id } = await params;
    const payload = updateSchema.parse(await request.json());
    const current = await prisma.tournament.findUnique({ where: { id } });
    if (!current) throw new ApiError("Tournament not found.", 404);
    if (payload.status && !transitions[current.status].includes(payload.status)) {
      throw new ApiError(`Tournament cannot move from ${current.status} to ${payload.status}.`, 409, "invalid_transition");
    }
    if (payload.registrationOpen && (payload.status ?? current.status) !== "registration") {
      throw new ApiError("Registration can only be opened while the tournament is in registration state.", 409);
    }
    const updated = await prisma.tournament.update({
      where: { id },
      data: {
        ...payload,
        registrationClosesAt: payload.registrationClosesAt === undefined ? undefined : payload.registrationClosesAt ? new Date(payload.registrationClosesAt) : null,
        startsAt: payload.startsAt === undefined ? undefined : payload.startsAt ? new Date(payload.startsAt) : null,
        registrationOpen: payload.status && payload.status !== "registration" ? false : payload.registrationOpen
      }
    });
    return NextResponse.json(updated);
  } catch (error) { return apiErrorResponse(error); }
}
