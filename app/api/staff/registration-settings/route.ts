import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { games } from "@/lib/types";

export async function PATCH(request: Request) {
  await requireStaff();
  const body = await request.json().catch(() => null);
  const game = body?.game;

  if (!games.includes(game)) {
    return NextResponse.json({ error: "Unsupported game." }, { status: 400 });
  }

  const setting = await prisma.registrationSetting.upsert({
    where: { game },
    update: {
      isOpen: Boolean(body?.isOpen),
      message: typeof body?.message === "string" ? body.message : null
    },
    create: {
      game,
      isOpen: Boolean(body?.isOpen),
      message: typeof body?.message === "string" ? body.message : null
    }
  });

  return NextResponse.json(setting);
}
