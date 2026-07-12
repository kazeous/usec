import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TournamentOperations } from "@/components/staff/TournamentOperations";

const tournament = {
  id: "event-1",
  title: "Campus Cup",
  game: "valorant" as const,
  format: "single_elimination" as const,
  status: "registration" as const,
  registrationOpen: true,
  locationMode: "offline" as const,
  participationFormat: "five_v_five" as const,
  currentRound: 0
};

describe("TournamentOperations competition format", () => {
  it("lets staff change an existing event to every compatible bracket format", () => {
    render(<TournamentOperations tournament={tournament} entries={[]} teams={[]} solos={[]} />);

    const select = screen.getByLabelText("Competition format");
    expect(select).toHaveValue("single_elimination");
    expect(screen.getByRole("option", { name: "Double Elimination" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Round Robin" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Swiss" })).toBeInTheDocument();

    fireEvent.change(select, { target: { value: "swiss" } });
    expect(screen.getByLabelText("Swiss rounds")).toHaveValue(3);
  });

  it("locks competition format after the editable lifecycle", () => {
    render(<TournamentOperations tournament={{ ...tournament, status: "live" }} entries={[]} teams={[]} solos={[]} />);
    expect(screen.getByLabelText("Competition format")).toBeDisabled();
  });
});
