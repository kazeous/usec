import { NextResponse } from "next/server";
import { apiErrorResponse, requireAdminApi } from "@/lib/http";
import { generateTournamentCompetition } from "@/lib/tournaments/service";
import { prisma } from "@/lib/db";
import { generateTftCompetition } from "@/lib/tournaments/tft-service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminApi(request);
    const { id } = await params;
    const tournament = await prisma.tournament.findUnique({ where: { id }, select: { format: true } });
    return NextResponse.json(tournament?.format === "tft_lobby" ? await generateTftCompetition(id) : await generateTournamentCompetition(id));
  } catch (error) { return apiErrorResponse(error); }
}
