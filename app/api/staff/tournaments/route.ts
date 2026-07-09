import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { games, tournamentFormats } from "@/lib/types";

const tournamentCreateSchema = z.object({
  title: z.string().min(3),
  game: z.enum(games),
  format: z.enum(tournamentFormats),
  registrationOpen: z.boolean().default(false)
});

export async function GET() {
  await requireStaff();
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(tournaments);
}

export async function POST(request: Request) {
  await requireStaff();
  const payload = tournamentCreateSchema.parse(await request.json());

  const tournament = await prisma.tournament.create({
    data: {
      ...payload,
      status: payload.registrationOpen ? "registration" : "draft"
    }
  });

  return NextResponse.json(tournament, { status: 201 });
}
