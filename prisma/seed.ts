import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);

  await prisma.user.upsert({
    where: { email: "admin@usec.local" },
    update: {},
    create: {
      email: "admin@usec.local",
      name: "USEC Admin",
      passwordHash,
      role: "admin"
    }
  });

  for (const game of ["valorant", "cs2", "lol"] as const) {
    await prisma.registrationSetting.upsert({
      where: { game },
      update: {},
      create: {
        game,
        isOpen: game !== "lol",
        message: game === "lol" ? "LoL registration opens soon." : "Registration is open."
      }
    });
  }

  await prisma.tournament.upsert({
    where: { id: "sample-valorant-open" },
    update: {},
    create: {
      id: "sample-valorant-open",
      title: "Fall Valorant Open",
      game: "valorant",
      format: "single_elimination",
      status: "registration",
      registrationOpen: true
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
