import { NextResponse } from "next/server";
import { apiErrorResponse, requireAdminApi } from "@/lib/http";
import { generateNextSwissRound } from "@/lib/tournaments/service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminApi(request);
    const { id } = await params;
    return NextResponse.json(await generateNextSwissRound(id));
  } catch (error) { return apiErrorResponse(error); }
}
