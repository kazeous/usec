import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);
  await prisma.user.upsert({
    where: { email: "admin@usec.local" },
    update: {},
    create: { email: "admin@usec.local", name: "USEC Admin", passwordHash, role: "admin" }
  });
  await prisma.tournament.upsert({
    where: { id: "sample-valorant-open" },
    update: {
      status: "registration",
      registrationOpen: true,
      registrationMessage: "Registration is open for teams and solo players."
    },
    create: {
      id: "sample-valorant-open",
      title: "Fall Valorant Open",
      game: "valorant",
      format: "single_elimination",
      status: "registration",
      registrationOpen: true,
      registrationMessage: "Registration is open for teams and solo players."
    }
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(() => prisma.$disconnect());
