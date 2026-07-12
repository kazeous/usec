import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiErrorResponse, ApiError, requireAdminApi } from "@/lib/http";
import { locationModes, participationFormats, tournamentStatuses } from "@/lib/types";
import { tftFinalModes } from "@/lib/types";

const updateSchema = z.object({
  title: z.string().trim().min(3).max(150).optional(),
  status: z.enum(tournamentStatuses).optional(),
  registrationOpen: z.boolean().optional(),
  registrationMessage: z.string().trim().max(500).nullable().optional(),
  venue: z.string().trim().max(200).nullable().optional(),
  locationMode: z.enum(locationModes).optional(),
  participationFormat: z.enum(participationFormats).optional(),
  registrationClosesAt: z.string().datetime().nullable().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  swissRounds: z.number().int().min(3).max(7).nullable().optional(),
  tftFinalMode: z.enum(tftFinalModes).nullable().optional()
});

const transitions: Record<string, string[]> = {
  draft: ["draft", "registration"],
  registration: ["draft", "registration", "seeded", "complete"],
  seeded: ["seeded", "live", "complete"],
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
    if (payload.participationFormat) {
      const valid = current.game === "tft" ? payload.participationFormat === "tft" : payload.participationFormat !== "tft";
      if (!valid) throw new ApiError("The selected game and participation format are incompatible.", 409);
      if (!['draft', 'registration'].includes(current.status) || current.lockBracketAt) throw new ApiError("Participation format cannot change after the bracket is locked.", 409);
      const hasRegistrations = await prisma.registration.count({ where: { tournamentId: id } });
      if (hasRegistrations > 0 && payload.participationFormat !== current.participationFormat) throw new ApiError("Remove existing registrations before changing participation format.", 409);
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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminApi(request);
    const { id } = await params;
    const current = await prisma.tournament.findUnique({ where: { id } });
    if (!current) throw new ApiError("Tournament not found.", 404);
    if (current.status !== "draft" && current.status !== "registration" && current.status !== "archived") {
      throw new ApiError("Only draft, registration, or archived tournaments can be deleted.", 409);
    }
    await prisma.tournament.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) { return apiErrorResponse(error); }
}
