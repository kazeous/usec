import { PrismaClient, type Game } from "@prisma/client";
import {
  buildTestRegistrationSeed,
  selectTestTournamentTargets,
  TEST_REGISTRATION_CONFIRM_FLAG,
  TEST_REGISTRATION_COUNTS,
  TEST_REGISTRATION_PROVIDER,
  type TestRegistrationSeed
} from "./test-registration-data";

const prisma = new PrismaClient();

function parseOptions(args: string[]) {
  if (!args.includes(TEST_REGISTRATION_CONFIRM_FLAG)) {
    throw new Error(
      `Refusing to write test registrations without ${TEST_REGISTRATION_CONFIRM_FLAG}. Pass the flag explicitly after npm's -- separator.`
    );
  }

  const titleArgs = args.filter((argument) => argument.startsWith("--title="));
  if (titleArgs.length > 1) throw new Error("Provide --title only once.");
  const title = titleArgs[0]?.slice("--title=".length).trim();
  if (titleArgs.length === 1 && !title) throw new Error("--title must not be empty.");
  return { title };
}

function assertExistingRegistrationMatches(existing: Awaited<ReturnType<typeof findSeedRegistrations>>[number], planned: TestRegistrationSeed) {
  const expected = planned.registration;
  if (
    existing.tournamentId !== expected.tournamentId ||
    existing.game !== expected.game ||
    existing.mode !== expected.mode ||
    existing.teamName !== expected.teamName ||
    existing.captchaProvider !== TEST_REGISTRATION_PROVIDER
  ) {
    throw new Error(`Existing seeded registration ${existing.id} no longer matches the planned synthetic identity.`);
  }

  const expectedMembers = new Map(planned.members.map((member) => [member.id, member]));
  if (existing.members.length !== expectedMembers.size) {
    throw new Error(`Existing seeded registration ${existing.id} has an unexpected roster size.`);
  }
  for (const member of existing.members) {
    const expectedMember = expectedMembers.get(member.id);
    if (
      !expectedMember ||
      member.fullName !== expectedMember.fullName ||
      member.inGameName !== expectedMember.inGameName ||
      member.studentId !== expectedMember.studentId ||
      member.universityName !== expectedMember.universityName ||
      member.email !== expectedMember.email ||
      member.discord !== expectedMember.discord ||
      member.isCaptain !== expectedMember.isCaptain ||
      member.isReserve !== expectedMember.isReserve
    ) {
      throw new Error(`Existing seeded member ${member.id} no longer matches the planned synthetic identity.`);
    }
  }
}

function findSeedRegistrations(ids: string[]) {
  return prisma.registration.findMany({
    where: { id: { in: ids } },
    include: { members: true }
  });
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const candidates = await prisma.tournament.findMany({
    where: { game: { in: ["valorant", "cs2", "lol", "tft"] }, ...(options.title ? { title: options.title } : {}) },
    select: {
      id: true,
      title: true,
      game: true,
      status: true,
      registrationOpen: true,
      registrationClosesAt: true,
      participationFormat: true
    }
  });
  const targets = selectTestTournamentTargets(candidates, options.title);
  const planned = buildTestRegistrationSeed(targets);
  const plannedById = new Map(planned.map((item) => [String(item.registration.id), item]));
  const ids = [...plannedById.keys()];
  const studentIds = planned.flatMap((item) => item.members.map((member) => member.studentId));
  const emails = planned.flatMap((item) => item.members.flatMap((member) => member.email ? [member.email] : []));

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.registration.findMany({
      where: { id: { in: ids } },
      include: { members: true }
    });
    for (const registration of existing) {
      const expected = plannedById.get(registration.id);
      if (!expected) throw new Error(`Unexpected seeded registration ${registration.id}.`);
      assertExistingRegistrationMatches(registration, expected);
    }

    const conflictingMember = await tx.registrationMember.findFirst({
      where: {
        registration: {
          tournamentId: { in: Object.values(targets).map((target) => target.id) },
          status: { not: "rejected" },
          id: { notIn: ids }
        },
        OR: [{ studentId: { in: studentIds } }, { email: { in: emails } }]
      },
      select: { studentId: true, email: true, registrationId: true }
    });
    if (conflictingMember) {
      throw new Error(
        `Synthetic identity conflicts with registration ${conflictingMember.registrationId} (${conflictingMember.studentId}). No data was written.`
      );
    }

    const existingIds = new Set(existing.map((registration) => registration.id));
    const missing = planned.filter((item) => !existingIds.has(String(item.registration.id)));
    if (missing.length) {
      await tx.registration.createMany({ data: missing.map((item) => item.registration) });
      await tx.registrationMember.createMany({ data: missing.flatMap((item) => item.members) });
    }
    return { created: missing.length, preserved: existing.length };
  }, { timeout: 30_000 });

  const seeded = await findSeedRegistrations(ids);
  if (seeded.length !== planned.length) {
    throw new Error(`Verification failed: expected ${planned.length} seeded registrations, found ${seeded.length}.`);
  }
  const plannedMemberCount = planned.reduce((total, item) => total + item.members.length, 0);
  const seededMemberCount = seeded.reduce((total, item) => total + item.members.length, 0);
  if (seededMemberCount !== plannedMemberCount) {
    throw new Error(`Verification failed: expected ${plannedMemberCount} seeded members, found ${seededMemberCount}.`);
  }

  const games = ["valorant", "cs2", "lol", "tft"] as const satisfies readonly Game[];
  console.log(`Synthetic registration seed complete: ${result.created} created, ${result.preserved} preserved.`);
  for (const game of games) {
    const records = seeded.filter((registration) => registration.game === game);
    const statusCounts = records.reduce<Record<string, number>>((counts, registration) => {
      counts[registration.status] = (counts[registration.status] ?? 0) + 1;
      return counts;
    }, {});
    console.log(
      `${targets[game].title} (${game}): ${records.length}/${TEST_REGISTRATION_COUNTS[game]} seeded registrations; statuses ${JSON.stringify(statusCounts)}.`
    );
  }
  console.log("These records are registrations only. No teams, tournament entries, brackets, or TFT lobbies were created.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(() => prisma.$disconnect());
