import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiErrorResponse, requireAdminApi, requireStaffApi } from "@/lib/http";
import { games, locationModes, participationFormats, tftFinalModes, tournamentFormats } from "@/lib/types";

const createSchema = z.object({
  title: z.string().trim().min(3).max(150),
  game: z.enum(games),
  format: z.enum(tournamentFormats),
  registrationOpen: z.boolean().default(false),
  registrationMessage: z.string().trim().max(500).optional(),
  venue: z.string().trim().max(200).optional().nullable(),
  locationMode: z.enum(locationModes),
  participationFormat: z.enum(participationFormats),
  startsAt: z.string().datetime().optional().nullable(),
  registrationClosesAt: z.string().datetime().optional().nullable(),
  swissRounds: z.number().int().min(3).max(7).optional().nullable(),
  tftFinalMode: z.enum(tftFinalModes).optional().nullable()
}).superRefine((value, context) => {
  const compatible = value.game === "tft" ? value.format === "tft_lobby" : value.format !== "tft_lobby";
  if (!compatible) context.addIssue({ code: z.ZodIssueCode.custom, path: ["format"], message: "The selected game and tournament format are incompatible." });
  const validParticipation = value.game === "tft" ? value.participationFormat === "tft" : value.participationFormat !== "tft";
  if (!validParticipation) context.addIssue({ code: z.ZodIssueCode.custom, path: ["participationFormat"], message: "The selected game and participation format are incompatible." });
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
