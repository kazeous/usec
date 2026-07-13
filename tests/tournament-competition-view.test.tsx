import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StandingsTable } from "@/components/tournament/StandingsTable";
import { TournamentCompetitionView } from "@/components/tournament/TournamentCompetitionView";
import type { PublicMatch, StandingRow } from "@/lib/types";

const entries = [
  { id: "team-a", name: "Alpha" },
  { id: "team-b", name: "Bravo" },
  { id: "team-c", name: "Charlie" }
];

function match(id: string, position: number, teamA: typeof entries[number], teamB: typeof entries[number]): PublicMatch {
  return {
    id,
    round: 1,
    position,
    bracket: "round_robin",
    status: "scheduled",
    bestOf: 1,
    teamA,
    teamB,
    winner: null,
    teamAScore: 0,
    teamBScore: 0
  };
}

function standing(index: number): StandingRow {
  return {
    entryId: `team-${index}`,
    name: `Team ${index}`,
    seed: index,
    played: 0,
    wins: 0,
    losses: 0,
    gamesWon: 0,
    gamesLost: 0,
    gameDifferential: 0,
    rank: index
  };
}

describe("TournamentCompetitionView", () => {
  it("filters a large bracket to matches involving the selected team", () => {
    render(<TournamentCompetitionView
      entries={entries}
      matches={[match("match-one", 1, entries[0], entries[1]), match("match-two", 2, entries[1], entries[2])]}
      standings={[]}
    />);

    expect(screen.getByText("Charlie", { selector: "span" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Find your team"), { target: { value: "team-a" } });

    expect(screen.getByText("Showing 1 match for Alpha.")).toBeInTheDocument();
    expect(screen.queryByText("Charlie", { selector: "span" })).not.toBeInTheDocument();
    expect(screen.getByText("Alpha", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("Bravo", { selector: "span" })).toBeInTheDocument();
  });

  it("limits public standings and lets visitors expand the full table", () => {
    render(<StandingsTable standings={Array.from({ length: 12 }, (_, index) => standing(index + 1))} defaultLimit={8} />);

    expect(screen.getByText("Showing 8 of 12 teams.")).toBeInTheDocument();
    expect(screen.queryByText("Team 9")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show all standings" }));

    expect(screen.getByText("Team 9")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show fewer" })).toBeInTheDocument();
  });
});
