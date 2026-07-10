import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, requireStaffApi } from "@/lib/http";
import { enrollExistingTeam, removeTournamentEntry, updateEntrySeed } from "@/lib/registrations/service";

const createSchema = z.object({ teamId: z.string().min(1) });
const seedSchema = z.object({ entryId: z.string().min(1), seed: z.number().int().min(1) });
const removeSchema = z.object({ entryId: z.string().min(1) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireStaffApi(request);
    const { id } = await params;
    const { teamId } = createSchema.parse(await request.json());
    return NextResponse.json(await enrollExistingTeam(id, teamId), { status: 201 });
  } catch (error) { return apiErrorResponse(error); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireStaffApi(request);
    const { id } = await params;
    const payload = seedSchema.parse(await request.json());
    return NextResponse.json(await updateEntrySeed(id, payload.entryId, payload.seed));
  } catch (error) { return apiErrorResponse(error); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireStaffApi(request);
    const { id } = await params;
    const payload = removeSchema.parse(await request.json());
    await removeTournamentEntry(id, payload.entryId);
    return NextResponse.json({ ok: true });
  } catch (error) { return apiErrorResponse(error); }
}
