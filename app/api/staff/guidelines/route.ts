import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiErrorResponse, requireStaffApi } from "@/lib/http";

const KEYS = ["guidelines_conduct", "guidelines_competition"] as const;

const putSchema = z.object({
  guidelines_conduct: z.string().max(50000),
  guidelines_competition: z.string().max(50000),
});

export async function GET(request: Request) {
  try {
    await requireStaffApi(request);
    const rows = await prisma.siteContent.findMany({ where: { key: { in: [...KEYS] } } });
    const map: Record<string, string> = {};
    for (const row of rows) map[row.key] = row.value;
    return NextResponse.json(map);
  } catch (error) { return apiErrorResponse(error); }
}

export async function PUT(request: Request) {
  try {
    await requireStaffApi(request);
    const payload = putSchema.parse(await request.json());
    await prisma.$transaction(
      KEYS.map((key) =>
        prisma.siteContent.upsert({ where: { key }, create: { key, value: payload[key] }, update: { value: payload[key] } })
      )
    );
    return NextResponse.json({ ok: true });
  } catch (error) { return apiErrorResponse(error); }
}
