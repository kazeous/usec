import type { Registration } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { type TeammateInput } from "@/lib/types";

export async function GET() {
  await requireStaff();
  const registrations = await prisma.registration.findMany({
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(registrations);
}

export async function PATCH(request: Request) {
  await requireStaff();
  const body = await request.json().catch(() => null);
  const id = String(body?.id ?? "");
  const status = body?.status;

  if (!id || !["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Registration ID and valid status are required." }, { status: 400 });
  }

  const registration = await prisma.registration.update({
    where: { id },
    data: { status }
  });

  if (status === "approved") {
    await createTeamFromRegistration(registration);
  }

  return NextResponse.json(registration);
}

async function createTeamFromRegistration(registration: Registration) {
  const existing = await prisma.team.findUnique({
    where: {
      registrationId: registration.id
    }
  });

  if (existing) {
    return existing;
  }

  const teammates = (Array.isArray(registration.teammates) ? registration.teammates : []) as TeammateInput[];
  const teamName = registration.mode === "team" ? registration.teamName : registration.fullName;

  return prisma.team.create({
    data: {
      registrationId: registration.id,
      game: registration.game,
      name: teamName ?? registration.fullName,
      players: {
        create: [
          {
            fullName: registration.fullName,
            studentId: registration.studentId,
            universityName: registration.universityName,
            email: registration.email,
            discord: registration.discord,
            isCaptain: true
          },
          ...teammates.map((teammate) => ({
            fullName: teammate.fullName,
            studentId: teammate.studentId,
            universityName: teammate.universityName,
            email: teammate.email,
            discord: teammate.discord,
            isCaptain: false
          }))
        ]
      }
    }
  });
}
