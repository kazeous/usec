import { PrismaClient, type BracketSide, type Game, type MatchStatus, type TournamentFormat } from "@prisma/client";

const prisma = new PrismaClient();

type TeamSpec = {
  id: string;
  game: Game;
  name: string;
  seed: number;
};

const gameLabels: Record<Game, string> = {
  valorant: "Valorant",
  cs2: "CS2",
  lol: "LoL"
};

const teams: TeamSpec[] = [
  ...makeTeams("valorant", ["Dragonline", "Pixel Surge", "Campus Clutch", "Redline Academy", "Neon Lecture", "Bind Bandits", "Library Aimers", "Finals Week"]),
  ...makeTeams("cs2", ["Dust Scholars", "Eco Round", "Nuke Notes", "Mirage Majors", "Anubis Union", "Ancient Alumni"]),
  ...makeTeams("lol", ["Baron Lab", "Dragon Tutors", "Midterm Macro", "Herald Hall", "Nexus Notes", "Rift Review"])
];

function makeTeams(game: Game, names: string[]) {
  return names.map((name, index) => ({
    id: `demo-team-${game}-${String(index + 1).padStart(2, "0")}`,
    game,
    name,
    seed: index + 1
  }));
}

function playerName(teamName: string, index: number) {
  const clean = teamName.replace(/[^a-zA-Z]/g, "");
  return `${clean} Player ${index}`;
}

function studentId(game: Game, teamSeed: number, playerIndex: number) {
  const gameOffset = game === "valorant" ? 10 : game === "cs2" ? 20 : 30;
  return `${gameOffset}${String(teamSeed).padStart(2, "0")}${String(playerIndex).padStart(2, "0")}`;
}

function firstRoundPairings(teamIds: string[]) {
  const pairs: Array<[string | null, string | null]> = [];
  for (let index = 0; index < teamIds.length / 2; index += 1) {
    pairs.push([teamIds[index] ?? null, teamIds[teamIds.length - 1 - index] ?? null]);
  }
  return pairs;
}

function singleElimMatches(tournamentId: string, teamIds: string[], bestOf: number) {
  const matches: Array<{
    id: string;
    tournamentId: string;
    round: number;
    position: number;
    bracket: BracketSide;
    status: MatchStatus;
    bestOf: number;
    teamAId?: string;
    teamBId?: string;
  }> = [];

  firstRoundPairings(teamIds).forEach(([teamAId, teamBId], index) => {
    matches.push({
      id: `${tournamentId}-match-r1-${index + 1}`,
      tournamentId,
      round: 1,
      position: index + 1,
      bracket: "winners",
      status: teamAId && teamBId ? "scheduled" : "pending",
      bestOf,
      teamAId: teamAId ?? undefined,
      teamBId: teamBId ?? undefined
    });
  });

  let matchCount = Math.ceil(teamIds.length / 4);
  let round = 2;
  while (matchCount >= 1) {
    for (let position = 1; position <= matchCount; position += 1) {
      matches.push({
        id: `${tournamentId}-match-r${round}-${position}`,
        tournamentId,
        round,
        position,
        bracket: "winners",
        status: "pending",
        bestOf
      });
    }

    if (matchCount === 1) {
      break;
    }
    matchCount = Math.ceil(matchCount / 2);
    round += 1;
  }

  return matches;
}

function roundRobinMatches(tournamentId: string, teamIds: string[], bestOf: number) {
  const slots: Array<string | null> = teamIds.length % 2 === 0 ? [...teamIds] : [...teamIds, null];
  const matches = [];

  for (let round = 1; round < slots.length; round += 1) {
    let position = 1;
    for (let index = 0; index < slots.length / 2; index += 1) {
      const teamAId = slots[index];
      const teamBId = slots[slots.length - 1 - index];
      if (teamAId && teamBId) {
        matches.push({
          id: `${tournamentId}-match-r${round}-${position}`,
          tournamentId,
          round,
          position,
          bracket: "round_robin" as BracketSide,
          status: "scheduled" as MatchStatus,
          bestOf,
          teamAId,
          teamBId
        });
        position += 1;
      }
    }

    const fixed = slots[0];
    const rotated = [fixed, slots[slots.length - 1], ...slots.slice(1, slots.length - 1)];
    slots.splice(0, slots.length, ...rotated);
  }

  return matches;
}

async function clearDemoData() {
  await prisma.$transaction([
    prisma.vetoAction.deleteMany({ where: { session: { match: { tournamentId: { startsWith: "demo-tournament-" } } } } }),
    prisma.vetoSession.deleteMany({ where: { match: { tournamentId: { startsWith: "demo-tournament-" } } } }),
    prisma.match.deleteMany({ where: { tournamentId: { startsWith: "demo-tournament-" } } }),
    prisma.championDraft.deleteMany({ where: { match: { tournamentId: { startsWith: "demo-tournament-" } } } }),
    prisma.team.updateMany({ where: { id: { startsWith: "demo-team-" } }, data: { tournamentId: null } }),
    prisma.player.deleteMany({ where: { teamId: { startsWith: "demo-team-" } } }),
    prisma.team.deleteMany({ where: { id: { startsWith: "demo-team-" } } }),
    prisma.registration.deleteMany({ where: { id: { startsWith: "demo-registration-" } } }),
    prisma.tournament.deleteMany({ where: { id: { startsWith: "demo-tournament-" } } })
  ]);
}

async function createRegistrationAndTeam(spec: TeamSpec) {
  const registrationId = spec.id.replace("demo-team-", "demo-registration-");
  const captain = {
    fullName: playerName(spec.name, 1),
    studentId: studentId(spec.game, spec.seed, 1),
    universityName: "HCMUS",
    email: `${spec.id}-captain@demo.usec.local`,
    discord: `${spec.name.toLowerCase().replaceAll(" ", "")}#0001`
  };
  const teammates = [2, 3, 4, 5].map((index) => ({
    fullName: playerName(spec.name, index),
    studentId: studentId(spec.game, spec.seed, index),
    universityName: "HCMUS",
    email: `${spec.id}-p${index}@demo.usec.local`,
    discord: `${spec.name.toLowerCase().replaceAll(" ", "")}#000${index}`
  }));

  await prisma.registration.create({
    data: {
      id: registrationId,
      game: spec.game,
      mode: "team",
      status: "approved",
      studentId: captain.studentId,
      universityName: captain.universityName,
      fullName: captain.fullName,
      email: captain.email,
      discord: captain.discord,
      teamName: spec.name,
      teammates,
      captchaProvider: "placeholder"
    }
  });

  await prisma.team.create({
    data: {
      id: spec.id,
      registrationId,
      game: spec.game,
      name: spec.name,
      seed: spec.seed,
      players: {
        create: [
          { ...captain, isCaptain: true },
          ...teammates.map((teammate) => ({ ...teammate, isCaptain: false }))
        ]
      }
    }
  });
}

async function createTournament(game: Game, title: string, format: TournamentFormat, teamIds: string[], bestOf: number) {
  const tournamentId = `demo-tournament-${game}`;

  await prisma.tournament.create({
    data: {
      id: tournamentId,
      title,
      game,
      format,
      status: "seeded",
      registrationOpen: true
    }
  });

  await prisma.team.updateMany({
    where: {
      id: {
        in: teamIds
      }
    },
    data: {
      tournamentId
    }
  });

  const matches =
    format === "round_robin"
      ? roundRobinMatches(tournamentId, teamIds, bestOf)
      : singleElimMatches(tournamentId, teamIds, bestOf);

  await prisma.match.createMany({
    data: matches
  });
}

async function main() {
  await clearDemoData();

  for (const game of ["valorant", "cs2", "lol"] as const) {
    await prisma.registrationSetting.upsert({
      where: { game },
      update: {
        isOpen: true,
        message: `${gameLabels[game]} demo registration is open.`
      },
      create: {
        game,
        isOpen: true,
        message: `${gameLabels[game]} demo registration is open.`
      }
    });
  }

  for (const spec of teams) {
    await createRegistrationAndTeam(spec);
  }

  await createTournament(
    "valorant",
    "USEC Valorant Demo Cup",
    "single_elimination",
    teams.filter((team) => team.game === "valorant").map((team) => team.id),
    3
  );
  await createTournament(
    "cs2",
    "USEC CS2 Demo Bracket",
    "double_elimination",
    teams.filter((team) => team.game === "cs2").map((team) => team.id),
    3
  );
  await createTournament(
    "lol",
    "USEC LoL Round Robin",
    "round_robin",
    teams.filter((team) => team.game === "lol").map((team) => team.id),
    1
  );

  const counts = await Promise.all([
    prisma.registration.count({ where: { id: { startsWith: "demo-registration-" } } }),
    prisma.team.count({ where: { id: { startsWith: "demo-team-" } } }),
    prisma.tournament.count({ where: { id: { startsWith: "demo-tournament-" } } }),
    prisma.match.count({ where: { tournamentId: { startsWith: "demo-tournament-" } } })
  ]);

  console.log(`Demo data ready: ${counts[0]} registrations, ${counts[1]} teams, ${counts[2]} tournaments, ${counts[3]} matches.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
