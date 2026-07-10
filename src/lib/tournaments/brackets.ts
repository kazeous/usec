import type {
  BracketFeedSeed,
  BracketMatchSeed,
  GeneratedCompetition,
  PublicMatch,
  StandingRow,
  TeamSeed,
  TournamentFormat
} from "@/lib/types";

export function sortParticipants(participants: TeamSeed[]) {
  return [...participants].sort((a, b) => {
    const seedA = a.seed ?? Number.MAX_SAFE_INTEGER;
    const seedB = b.seed ?? Number.MAX_SAFE_INTEGER;
    return seedA - seedB || a.name.localeCompare(b.name);
  });
}

export function nextPowerOfTwo(value: number) {
  if (value <= 1) return 2;
  return 2 ** Math.ceil(Math.log2(value));
}

function key(bracket: BracketMatchSeed["bracket"], round: number, position: number) {
  return `${bracket}:${round}:${position}`;
}

function makeMatch(
  bracket: BracketMatchSeed["bracket"],
  round: number,
  position: number,
  teamAEntryId: string | null = null,
  teamBEntryId: string | null = null,
  extras: Partial<BracketMatchSeed> = {}
): BracketMatchSeed {
  const automaticWinner = teamAEntryId && !teamBEntryId ? teamAEntryId : teamBEntryId && !teamAEntryId ? teamBEntryId : null;
  return {
    key: key(bracket, round, position),
    bracket,
    round,
    position,
    teamAEntryId,
    teamBEntryId,
    status: automaticWinner ? "complete" : teamAEntryId && teamBEntryId ? "scheduled" : "pending",
    winnerEntryId: automaticWinner,
    isBye: Boolean(automaticWinner),
    ...extras
  };
}

function feed(sourceKey: string, outcome: "winner" | "loser", targetKey: string, targetSlot: "team_a" | "team_b"): BracketFeedSeed {
  return { sourceKey, outcome, targetKey, targetSlot };
}

function eliminationSlots(participants: TeamSeed[]) {
  const sorted = sortParticipants(participants);
  const size = nextPowerOfTwo(sorted.length);
  const slots: Array<TeamSeed | null> = [...sorted];
  while (slots.length < size) slots.push(null);
  return { size, slots };
}

export function generateSingleElimination(participants: TeamSeed[]): GeneratedCompetition {
  const { size, slots } = eliminationSlots(participants);
  const rounds = Math.log2(size);
  const matches: BracketMatchSeed[] = [];
  const feeds: BracketFeedSeed[] = [];

  for (let position = 1; position <= size / 2; position += 1) {
    matches.push(makeMatch("winners", 1, position, slots[position - 1]?.id ?? null, slots[size - position]?.id ?? null));
  }

  for (let round = 2; round <= rounds; round += 1) {
    for (let position = 1; position <= size / 2 ** round; position += 1) {
      matches.push(makeMatch("winners", round, position));
    }
  }

  for (const match of matches.filter((item) => item.round < rounds)) {
    feeds.push(
      feed(
        match.key,
        "winner",
        key("winners", match.round + 1, Math.ceil(match.position / 2)),
        match.position % 2 === 1 ? "team_a" : "team_b"
      )
    );
  }

  return { matches, feeds };
}

export function generateDoubleElimination(participants: TeamSeed[]): GeneratedCompetition {
  const winners = generateSingleElimination(participants);
  const size = nextPowerOfTwo(participants.length);
  const winnersRounds = Math.log2(size);
  const matches = [...winners.matches];
  const feeds = [...winners.feeds];

  if (size === 2) {
    const grandFinal = makeMatch("finals", 1, 1);
    const resetFinal = makeMatch("finals", 2, 1, null, null, { isResetFinal: true });
    matches.push(grandFinal, resetFinal);
    feeds.push(feed(key("winners", 1, 1), "winner", grandFinal.key, "team_a"));
    feeds.push(feed(key("winners", 1, 1), "loser", grandFinal.key, "team_b"));
    return { matches, feeds };
  }

  for (let losersRound = 1; losersRound <= 2 * (winnersRounds - 1); losersRound += 1) {
    const group = Math.ceil(losersRound / 2);
    const matchCount = size / 2 ** (group + 1);
    for (let position = 1; position <= matchCount; position += 1) {
      matches.push(makeMatch("losers", losersRound, position));
    }
  }

  // First-round losers enter the opening lower-bracket round in pairs.
  for (let position = 1; position <= size / 2; position += 1) {
    feeds.push(
      feed(
        key("winners", 1, position),
        "loser",
        key("losers", 1, Math.ceil(position / 2)),
        position % 2 === 1 ? "team_a" : "team_b"
      )
    );
  }

  for (let winnersRound = 2; winnersRound <= winnersRounds; winnersRound += 1) {
    const lowerEvenRound = 2 * (winnersRound - 1);
    const count = size / 2 ** winnersRound;
    for (let position = 1; position <= count; position += 1) {
      feeds.push(feed(key("winners", winnersRound, position), "loser", key("losers", lowerEvenRound, position), "team_b"));
    }
  }

  const lowerRounds = 2 * (winnersRounds - 1);
  for (let lowerRound = 1; lowerRound < lowerRounds; lowerRound += 1) {
    const currentCount = matches.filter((item) => item.bracket === "losers" && item.round === lowerRound).length;
    const nextRound = lowerRound + 1;
    if (lowerRound % 2 === 1) {
      for (let position = 1; position <= currentCount; position += 1) {
        feeds.push(feed(key("losers", lowerRound, position), "winner", key("losers", nextRound, position), "team_a"));
      }
    } else {
      for (let position = 1; position <= currentCount; position += 1) {
        feeds.push(
          feed(
            key("losers", lowerRound, position),
            "winner",
            key("losers", nextRound, Math.ceil(position / 2)),
            position % 2 === 1 ? "team_a" : "team_b"
          )
        );
      }
    }
  }

  const grandFinal = makeMatch("finals", 1, 1);
  const resetFinal = makeMatch("finals", 2, 1, null, null, { isResetFinal: true });
  matches.push(grandFinal, resetFinal);
  feeds.push(feed(key("winners", winnersRounds, 1), "winner", grandFinal.key, "team_a"));
  feeds.push(feed(key("losers", lowerRounds, 1), "winner", grandFinal.key, "team_b"));

  return { matches, feeds };
}

export function generateRoundRobin(participants: TeamSeed[]): GeneratedCompetition {
  const teams = sortParticipants(participants);
  const slots: Array<TeamSeed | null> = teams.length % 2 === 0 ? [...teams] : [...teams, null];
  const matches: BracketMatchSeed[] = [];

  for (let round = 1; round < slots.length; round += 1) {
    let position = 1;
    for (let index = 0; index < slots.length / 2; index += 1) {
      const teamA = slots[index];
      const teamB = slots[slots.length - 1 - index];
      if (teamA && teamB) {
        matches.push(makeMatch("round_robin", round, position, teamA.id, teamB.id));
        position += 1;
      }
    }
    const fixed = slots[0];
    slots.splice(0, slots.length, fixed, slots[slots.length - 1], ...slots.slice(1, -1));
  }

  return { matches, feeds: [] };
}

export type SwissPairingEntry = TeamSeed & {
  wins: number;
  gameDifferential: number;
  opponents: string[];
  byes: number;
};

export function generateSwissRound(standings: SwissPairingEntry[], round: number): GeneratedCompetition {
  const sorted = [...standings].sort(
    (a, b) => b.wins - a.wins || b.gameDifferential - a.gameDifferential || (a.seed ?? 9999) - (b.seed ?? 9999)
  );
  const unpaired = [...sorted];
  const matches: BracketMatchSeed[] = [];

  if (unpaired.length % 2 === 1) {
    let byeIndex = -1;
    for (let index = unpaired.length - 1; index >= 0; index -= 1) {
      if (unpaired[index].byes === 0) {
        byeIndex = index;
        break;
      }
    }
    if (byeIndex < 0) byeIndex = unpaired.length - 1;
    const [bye] = unpaired.splice(byeIndex, 1);
    matches.push(makeMatch("swiss", round, 1, bye.id, null));
  }

  let position = matches.length + 1;
  while (unpaired.length > 1) {
    const teamA = unpaired.shift()!;
    let opponentIndex = unpaired.findIndex((candidate) => !teamA.opponents.includes(candidate.id));
    if (opponentIndex < 0) opponentIndex = 0;
    const [teamB] = unpaired.splice(opponentIndex, 1);
    matches.push(makeMatch("swiss", round, position, teamA.id, teamB.id));
    position += 1;
  }
  return { matches, feeds: [] };
}

export function defaultSwissRounds(entryCount: number) {
  return Math.min(7, Math.max(3, Math.ceil(Math.log2(Math.max(entryCount, 2)))));
}

export function generateCompetition(format: TournamentFormat, participants: TeamSeed[]) {
  switch (format) {
    case "single_elimination":
      return generateSingleElimination(participants);
    case "double_elimination":
      return generateDoubleElimination(participants);
    case "round_robin":
      return generateRoundRobin(participants);
    case "swiss":
      return generateSwissRound(
        participants.map((participant) => ({ ...participant, wins: 0, gameDifferential: 0, opponents: [], byes: 0 })),
        1
      );
  }
}

export function validateTerminalSeriesScore(bestOf: number, teamAScore: number, teamBScore: number) {
  if (![1, 3, 5].includes(bestOf)) return { valid: false, reason: "Unsupported best-of value." };
  if (!Number.isInteger(teamAScore) || !Number.isInteger(teamBScore) || teamAScore < 0 || teamBScore < 0) {
    return { valid: false, reason: "Scores must be non-negative integers." };
  }
  const needed = Math.floor(bestOf / 2) + 1;
  const high = Math.max(teamAScore, teamBScore);
  const low = Math.min(teamAScore, teamBScore);
  if (high !== needed || low >= needed) {
    return { valid: false, reason: `Best-of-${bestOf} must end when one team reaches ${needed} wins.` };
  }
  return { valid: true as const, winner: teamAScore > teamBScore ? "team_a" as const : "team_b" as const };
}

export function calculateStandings(entries: TeamSeed[], matches: PublicMatch[], format: "round_robin" | "swiss"): StandingRow[] {
  const rows = new Map<string, Omit<StandingRow, "rank" | "buchholz"> & { opponents: string[] }>();
  for (const entry of entries) {
    rows.set(entry.id, {
      entryId: entry.id,
      name: entry.name,
      seed: entry.seed ?? null,
      played: 0,
      wins: 0,
      losses: 0,
      gamesWon: 0,
      gamesLost: 0,
      gameDifferential: 0,
      opponents: []
    });
  }

  for (const match of matches.filter((item) => item.status === "complete" && item.teamA)) {
    const rowA = rows.get(match.teamA!.id);
    const rowB = match.teamB ? rows.get(match.teamB.id) : undefined;
    if (!rowA) continue;
    rowA.played += 1;
    rowA.gamesWon += match.teamAScore;
    rowA.gamesLost += match.teamBScore;
    rowA.gameDifferential = rowA.gamesWon - rowA.gamesLost;
    if (!rowB) {
      rowA.wins += 1;
      continue;
    }
    rowB.played += 1;
    rowB.gamesWon += match.teamBScore;
    rowB.gamesLost += match.teamAScore;
    rowB.gameDifferential = rowB.gamesWon - rowB.gamesLost;
    rowA.opponents.push(rowB.entryId);
    rowB.opponents.push(rowA.entryId);
    if (match.winner?.id === rowA.entryId) {
      rowA.wins += 1;
      rowB.losses += 1;
    } else {
      rowB.wins += 1;
      rowA.losses += 1;
    }
  }

  const headToHead = new Map<string, string>();
  for (const match of matches.filter((item) => item.status === "complete" && item.teamA && item.teamB && item.winner)) {
    const pair = [match.teamA!.id, match.teamB!.id].sort().join(":");
    headToHead.set(pair, match.winner!.id);
  }

  return [...rows.values()]
    .map((row) => ({
      ...row,
      buchholz: format === "swiss" ? row.opponents.reduce((sum, id) => sum + (rows.get(id)?.wins ?? 0), 0) : undefined
    }))
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (format === "swiss" && (b.buchholz ?? 0) !== (a.buchholz ?? 0)) return (b.buchholz ?? 0) - (a.buchholz ?? 0);
      if (b.gameDifferential !== a.gameDifferential) return b.gameDifferential - a.gameDifferential;
      if (format === "swiss") return (a.seed ?? 9999) - (b.seed ?? 9999);
      if (b.gamesWon !== a.gamesWon) return b.gamesWon - a.gamesWon;
      const tiedOnPrimary = [...rows.values()].filter(
        (row) => row.wins === a.wins && row.gameDifferential === a.gameDifferential && row.gamesWon === a.gamesWon
      );
      if (tiedOnPrimary.length === 2) {
        const winner = headToHead.get([a.entryId, b.entryId].sort().join(":"));
        if (winner === a.entryId) return -1;
        if (winner === b.entryId) return 1;
      }
      return (a.seed ?? 9999) - (b.seed ?? 9999);
    })
    .map((row, index) => {
      const result = { ...row, rank: index + 1 };
      delete (result as Partial<typeof result>).opponents;
      return result;
    });
}
