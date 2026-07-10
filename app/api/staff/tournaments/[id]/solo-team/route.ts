import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, requireStaffApi } from "@/lib/http";
import { assembleSoloTeam } from "@/lib/registrations/service";

const schema = z.object({ teamName: z.string().trim().min(2).max(100), registrationIds: z.array(z.string()).length(5) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireStaffApi(request);
    const { id } = await params;
    const payload = schema.parse(await request.json());
    return NextResponse.json(await assembleSoloTeam({ tournamentId: id, ...payload }), { status: 201 });
  } catch (error) { return apiErrorResponse(error); }
}
