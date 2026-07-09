import type { BracketMatchSeed, BracketSide, TeamSeed } from "@/lib/types";

function sortParticipants(participants: TeamSeed[]) {
  return [...participants].sort((a, b) => {
    const seedA = a.seed ?? Number.MAX_SAFE_INTEGER;
    const seedB = b.seed ?? Number.MAX_SAFE_INTEGER;
    return seedA - seedB || a.name.localeCompare(b.name);
  });
}

function nextPowerOfTwo(value: number) {
  if (value <= 1) {
    return 2;
  }

  return 2 ** Math.ceil(Math.log2(value));
}

function makeMatch(
  bracket: BracketSide,
  round: number,
  position: number,
  teamAId: string | null,
  teamBId: string | null
): BracketMatchSeed {
  const autoWinnerId = teamAId && !teamBId ? teamAId : teamBId && !teamAId ? teamBId : null;

  return {
    bracket,
    round,
    position,
    teamAId,
    teamBId,
    status: autoWinnerId ? "complete" : teamAId && teamBId ? "scheduled" : "pending",
    winnerId: autoWinnerId
  };
}

export function generateSingleElimination(participants: TeamSeed[]): BracketMatchSeed[] {
  const sorted = sortParticipants(participants);
  const size = nextPowerOfTwo(sorted.length);
  const slots: Array<TeamSeed | null> = [...sorted];

  while (slots.length < size) {
    slots.push(null);
  }

  const matches: BracketMatchSeed[] = [];
  const roundCount = Math.log2(size);
  const firstRoundMatchCount = size / 2;

  for (let position = 1; position <= firstRoundMatchCount; position += 1) {
    const highSeed = slots[position - 1];
    const lowSeed = slots[size - position];
    matches.push(makeMatch("winners", 1, position, highSeed?.id ?? null, lowSeed?.id ?? null));
  }

  for (let round = 2; round <= roundCount; round += 1) {
    const matchCount = size / 2 ** round;
    for (let position = 1; position <= matchCount; position += 1) {
      matches.push(makeMatch("winners", round, position, null, null));
    }
  }

  return matches.map((match) => ({
    ...match,
    winnerToRound: match.round < roundCount ? match.round + 1 : null,
    winnerToPosition: match.round < roundCount ? Math.ceil(match.position / 2) : null
  }));
}

export function generateDoubleElimination(participants: TeamSeed[]): BracketMatchSeed[] {
  const winners = generateSingleElimination(participants);
  const entrants = nextPowerOfTwo(Math.max(participants.length, 2));
  const winnersRounds = Math.log2(entrants);
  const losers: BracketMatchSeed[] = [];

  for (let round = 1; round <= Math.max(1, winnersRounds * 2 - 1); round += 1) {
    const matchCount = Math.max(1, Math.floor(entrants / 2 ** Math.ceil((round + 1) / 2)));
    for (let position = 1; position <= matchCount; position += 1) {
      losers.push(makeMatch("losers", round, position, null, null));
    }
  }

  const finals = makeMatch("finals", 1, 1, null, null);

  return [...winners, ...losers, finals];
}

export function generateRoundRobin(participants: TeamSeed[]): BracketMatchSeed[] {
  const teams = sortParticipants(participants);
  const slots: Array<TeamSeed | null> = teams.length % 2 === 0 ? [...teams] : [...teams, null];
  const rounds = slots.length - 1;
  const matches: BracketMatchSeed[] = [];

  for (let round = 1; round <= rounds; round += 1) {
    for (let index = 0; index < slots.length / 2; index += 1) {
      const teamA = slots[index];
      const teamB = slots[slots.length - 1 - index];

      if (teamA && teamB) {
        matches.push(makeMatch("round_robin", round, matches.filter((m) => m.round === round).length + 1, teamA.id, teamB.id));
      }
    }

    const fixed = slots[0];
    const rotated = [fixed, slots[slots.length - 1], ...slots.slice(1, slots.length - 1)];
    slots.splice(0, slots.length, ...rotated);
  }

  return matches;
}

export type SwissStanding = TeamSeed & {
  points: number;
  opponents: string[];
};

export function generateSwissRound(standings: SwissStanding[], round: number): BracketMatchSeed[] {
  const sorted = [...standings].sort((a, b) => b.points - a.points || (a.seed ?? 999) - (b.seed ?? 999));
  const unpaired = [...sorted];
  const matches: BracketMatchSeed[] = [];

  while (unpaired.length > 1) {
    const teamA = unpaired.shift();
    if (!teamA) {
      break;
    }

    const opponentIndex = Math.max(0, unpaired.findIndex((team) => !teamA.opponents.includes(team.id)));
    const [teamB] = unpaired.splice(opponentIndex, 1);

    matches.push(makeMatch("swiss", round, matches.length + 1, teamA.id, teamB?.id ?? null));
  }

  if (unpaired.length === 1) {
    const bye = unpaired.shift();
    matches.push(makeMatch("swiss", round, matches.length + 1, bye?.id ?? null, null));
  }

  return matches;
}

export function generateBracket(format: string, participants: TeamSeed[], swissRound = 1) {
  switch (format) {
    case "single_elimination":
      return generateSingleElimination(participants);
    case "double_elimination":
      return generateDoubleElimination(participants);
    case "round_robin":
      return generateRoundRobin(participants);
    case "swiss":
      return generateSwissRound(
        participants.map((participant) => ({ ...participant, points: 0, opponents: [] })),
        swissRound
      );
    default:
      throw new Error(`Unsupported tournament format: ${format}`);
  }
}
