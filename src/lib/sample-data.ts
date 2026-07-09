import type { PublicTournament } from "@/lib/types";

export const sampleTournaments: PublicTournament[] = [
  {
    id: "sample-valorant-open",
    title: "Fall Valorant Open",
    game: "valorant",
    format: "single_elimination",
    status: "registration",
    registrationOpen: true,
    teams: [
      { id: "team-a", name: "Red Campus", seed: 1 },
      { id: "team-b", name: "Blue Campus", seed: 2 },
      { id: "team-c", name: "Library Aim", seed: 3 },
      { id: "team-d", name: "Dorm Queue", seed: 4 }
    ],
    matches: [
      {
        id: "match-1",
        round: 1,
        position: 1,
        bracket: "winners",
        status: "scheduled",
        bestOf: 3,
        teamA: { id: "team-a", name: "Red Campus", seed: 1 },
        teamB: { id: "team-d", name: "Dorm Queue", seed: 4 },
        winner: null,
        teamAScore: 0,
        teamBScore: 0
      },
      {
        id: "match-2",
        round: 1,
        position: 2,
        bracket: "winners",
        status: "scheduled",
        bestOf: 3,
        teamA: { id: "team-b", name: "Blue Campus", seed: 2 },
        teamB: { id: "team-c", name: "Library Aim", seed: 3 },
        winner: null,
        teamAScore: 0,
        teamBScore: 0
      },
      {
        id: "match-3",
        round: 2,
        position: 1,
        bracket: "winners",
        status: "pending",
        bestOf: 3,
        teamA: null,
        teamB: null,
        winner: null,
        teamAScore: 0,
        teamBScore: 0
      }
    ]
  }
];

export const sampleRegistrationSettings = [
  { game: "valorant", isOpen: true, message: "Registration is open." },
  { game: "cs2", isOpen: true, message: "Registration is open." },
  { game: "lol", isOpen: false, message: "LoL registration opens soon." }
] as const;
