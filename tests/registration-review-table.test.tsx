import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RegistrationReviewTable } from "@/components/staff/RegistrationReviewTable";

type Registrations = Parameters<typeof RegistrationReviewTable>[0]["registrations"];

function registration(overrides: Partial<Registrations[number]> & Pick<Registrations[number], "id" | "game">): Registrations[number] {
  const { id, game, ...rest } = overrides;
  return {
    id,
    game,
    mode: "solo",
    status: "pending",
    tournament: { id: `tournament-${game}`, title: `${game} Cup`, participationFormat: "one_v_one" },
    members: [{ fullName: `Player ${id}`, inGameName: id, studentId: `student-${id}`, universityName: "HCMUS", email: null, isCaptain: true, isReserve: false }],
    ...rest
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("RegistrationReviewTable", () => {
  it("groups pending registrations in the configured game order and can reveal reviewed records", () => {
    render(<RegistrationReviewTable registrations={[
      registration({ id: "lol-pending", game: "lol" }),
      registration({ id: "valorant-approved", game: "valorant", status: "approved" }),
      registration({ id: "valorant-pending", game: "valorant" })
    ]} teams={[]} />);

    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual(["Valorant", "League of Legends"]);
    expect(screen.queryByText("Player valorant-approved")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Filter registrations by status"), { target: { value: "all" } });

    expect(screen.getAllByText("Player valorant-approved")).toHaveLength(2);
  });

  it("bulk approves successful registrations and keeps failures selected", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        succeeded: ["tft-one"],
        failed: [{ registrationId: "tft-two", error: "Player is already enrolled." }]
      })
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<RegistrationReviewTable registrations={[
      registration({ id: "tft-one", game: "tft", tournament: { id: "tft-cup", title: "TFT Cup", participationFormat: "tft" } }),
      registration({ id: "tft-two", game: "tft", tournament: { id: "tft-cup", title: "TFT Cup", participationFormat: "tft" } })
    ]} teams={[]} />);

    fireEvent.click(screen.getByLabelText("Select all pending Teamfight Tactics registrations"));
    fireEvent.click(screen.getByRole("button", { name: "Approve selected (2)" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/staff/registrations", expect.objectContaining({ method: "POST" })));
    expect(await screen.findByText(/Approved 1 registration\. 1 failed and remain selected/)).toBeInTheDocument();
    expect(screen.queryByText("Player tft-one")).not.toBeInTheDocument();
    expect(screen.getAllByText("Player tft-two")).toHaveLength(2);
    expect(screen.getByText("1 selected")).toBeInTheDocument();
  });
});
