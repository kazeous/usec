import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, requireStaffApi } from "@/lib/http";
import { recordTftGameResults } from "@/lib/tournaments/tft-service";

const resultSchema = z.object({
  placements: z.array(z.object({ entryId: z.string().min(1), placement: z.number().int().min(1).max(8) })).length(8)
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireStaffApi(request);
    const { id } = await params;
    const payload = resultSchema.parse(await request.json());
    return NextResponse.json(await recordTftGameResults(id, payload.placements));
  } catch (error) {
    return apiErrorResponse(error);
  }
}
