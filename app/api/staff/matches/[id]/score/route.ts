import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, requireStaffApi } from "@/lib/http";
import { recordMatchScore, rollbackMatchResult } from "@/lib/tournaments/service";

const scoreSchema = z.object({ teamAScore: z.number().int().min(0), teamBScore: z.number().int().min(0) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireStaffApi(request);
    const { id } = await params;
    const score = scoreSchema.parse(await request.json());
    return NextResponse.json(await recordMatchScore(id, score.teamAScore, score.teamBScore));
  } catch (error) { return apiErrorResponse(error); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireStaffApi(request);
    const { id } = await params;
    return NextResponse.json(await rollbackMatchResult(id));
  } catch (error) { return apiErrorResponse(error); }
}
