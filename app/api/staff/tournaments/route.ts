import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiErrorResponse, requireAdminApi, requireStaffApi } from "@/lib/http";
import { games, tournamentFormats } from "@/lib/types";

const createSchema = z.object({
  title: z.string().trim().min(3).max(150),
  game: z.enum(games),
  format: z.enum(tournamentFormats),
  registrationOpen: z.boolean().default(false),
  registrationMessage: z.string().trim().max(500).optional(),
  startsAt: z.string().datetime().optional().nullable(),
  registrationClosesAt: z.string().datetime().optional().nullable(),
  swissRounds: z.number().int().min(3).max(7).optional().nullable()
});

export async function GET(request: Request) {
  try {
    await requireStaffApi(request);
    return NextResponse.json(await prisma.tournament.findMany({ orderBy: { createdAt: "desc" } }));
  } catch (error) { return apiErrorResponse(error); }
}

export async function POST(request: Request) {
  try {
    await requireAdminApi(request);
    const payload = createSchema.parse(await request.json());
    const tournament = await prisma.tournament.create({
      data: {
        ...payload,
        startsAt: payload.startsAt ? new Date(payload.startsAt) : null,
        registrationClosesAt: payload.registrationClosesAt ? new Date(payload.registrationClosesAt) : null,
        status: payload.registrationOpen ? "registration" : "draft"
      }
    });
    return NextResponse.json(tournament, { status: 201 });
  } catch (error) { return apiErrorResponse(error); }
}
