import type {
  Game,
  ParticipationFormat,
  Prisma,
  TournamentStatus
} from "@prisma/client";

export const TEST_REGISTRATION_CONFIRM_FLAG = "--confirm-usec-test-registrations";
export const TEST_REGISTRATION_PROVIDER = "seed:test-registrations";

export const TEST_REGISTRATION_COUNTS = {
  valorant: 16,
  cs2: 16,
  lol: 16,
  tft: 60
} as const satisfies Record<Game, number>;

export type TestTournamentCandidate = {
  id: string;
  title: string;
  game: Game;
  status: TournamentStatus;
  registrationOpen: boolean;
  registrationClosesAt: Date | null;
  participationFormat: ParticipationFormat;
};

export type TestTournamentTargets = Record<Game, TestTournamentCandidate>;

export type TestRegistrationSeed = {
  registration: Prisma.RegistrationCreateManyInput;
  members: Prisma.RegistrationMemberCreateManyInput[];
};

const games = ["valorant", "cs2", "lol", "tft"] as const satisfies readonly Game[];
const gameCodes: Record<Game, string> = {
  valorant: "VAL",
  cs2: "CS2",
  lol: "LOL",
  tft: "TFT"
};

function pad(value: number, width: number) {
  return String(value).padStart(width, "0");
}

export function selectTestTournamentTargets(
  candidates: TestTournamentCandidate[],
  requestedTitle?: string,
  now = new Date()
): TestTournamentTargets {
  const targets = {} as Partial<TestTournamentTargets>;

  for (const game of games) {
    const matches = candidates.filter((candidate) =>
      candidate.game === game &&
      candidate.status === "registration" &&
      candidate.registrationOpen &&
      (!candidate.registrationClosesAt || candidate.registrationClosesAt > now) &&
      (!requestedTitle || candidate.title === requestedTitle)
    );

    if (matches.length !== 1) {
      const titleHint = requestedTitle ? ` titled "${requestedTitle}"` : "";
      throw new Error(`Expected exactly one open ${game} tournament${titleHint}, found ${matches.length}.`);
    }

    const target = matches[0];
    const expectedFormat: ParticipationFormat = game === "tft" ? "tft" : "five_v_five";
    if (target.participationFormat !== expectedFormat) {
      throw new Error(
        `${target.title} (${game}) uses ${target.participationFormat}; expected ${expectedFormat} for this test-data seed.`
      );
    }
    targets[game] = target;
  }

  return targets as TestTournamentTargets;
}

export function buildTestRegistrationSeed(targets: TestTournamentTargets): TestRegistrationSeed[] {
  return games.flatMap((game) => {
    const registrationCount = TEST_REGISTRATION_COUNTS[game];
    const rosterSize = game === "tft" ? 1 : 5;
    const gameCode = gameCodes[game];

    return Array.from({ length: registrationCount }, (_, registrationOffset) => {
      const registrationNumber = registrationOffset + 1;
      const registrationLabel = game === "tft"
        ? pad(registrationNumber, 3)
        : `T${pad(registrationNumber, 2)}`;
      const registrationId = `usec-test-registration-${game}-${registrationLabel.toLowerCase()}`;
      const teamName = game === "tft" ? null : `USEC Test ${gameCode} Team ${pad(registrationNumber, 2)}`;
      const members = Array.from({ length: rosterSize }, (_, playerOffset) => {
        const playerNumber = playerOffset + 1;
        const playerLabel = `P${pad(playerNumber, 2)}`;
        const identity = `${gameCode}-${registrationLabel}-${playerLabel}`;
        const isCaptain = playerOffset === 0;

        return {
          id: `usec-test-member-${game}-${registrationLabel.toLowerCase()}-${playerLabel.toLowerCase()}`,
          registrationId,
          fullName: game === "tft"
            ? `USEC Test TFT Player ${registrationLabel}`
            : `USEC Test ${gameCode} Team ${pad(registrationNumber, 2)} Player ${playerNumber}`,
          inGameName: `${identity.replaceAll("-", "")}#TEST`,
          studentId: `TEST-${identity}`,
          universityName: "USEC Synthetic Test Data",
          email: isCaptain ? `usec-test-${game}-${registrationLabel.toLowerCase()}@example.invalid` : null,
          discord: `usec-test-${game}-${registrationLabel.toLowerCase()}-${playerLabel.toLowerCase()}`,
          isCaptain,
          isReserve: false
        } satisfies Prisma.RegistrationMemberCreateManyInput;
      });

      return {
        registration: {
          id: registrationId,
          tournamentId: targets[game].id,
          game,
          mode: game === "tft" ? "solo" : "team",
          status: "pending",
          teamName,
          captchaProvider: TEST_REGISTRATION_PROVIDER
        },
        members
      } satisfies TestRegistrationSeed;
    });
  });
}
