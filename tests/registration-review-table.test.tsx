import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RegistrationReviewTable } from "@/components/staff/RegistrationReviewTable";

const navigation = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/staff/registrations",
  useRouter: () => navigation,
  useSearchParams: () => new URLSearchParams()
}));

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

function renderTable(registrations: Registrations, pagination: Partial<Parameters<typeof RegistrationReviewTable>[0]["pagination"]> = {}) {
  return render(<RegistrationReviewTable
    registrations={registrations}
    teams={[]}
    filters={{ game: "all", status: "pending" }}
    pagination={{ page: 1, pageSize: 10, total: registrations.length, totalPages: 1, ...pagination }}
  />);
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  navigation.replace.mockReset();
  navigation.refresh.mockReset();
});

describe("RegistrationReviewTable", () => {
  it("groups the server page in configured game order and navigates filters and page sizes through the URL", () => {
    renderTable([
      registration({ id: "lol-pending", game: "lol" }),
      registration({ id: "valorant-pending", game: "valorant" })
    ], { total: 32, totalPages: 4 });

    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual(["Valorant", "League of Legends"]);
    expect(screen.getByText("Showing 1–10 of 32")).toBeInTheDocument();
    expect(screen.getByLabelText("Registrations per page")).toHaveValue("10");

    fireEvent.change(screen.getByLabelText("Filter registrations by status"), { target: { value: "all" } });
    expect(navigation.replace).toHaveBeenCalledWith(expect.stringContaining("status=all"));

    fireEvent.change(screen.getByLabelText("Registrations per page"), { target: { value: "50" } });
    expect(navigation.replace).toHaveBeenCalledWith(expect.stringContaining("pageSize=50"));
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

    renderTable([
      registration({ id: "tft-one", game: "tft", tournament: { id: "tft-cup", title: "TFT Cup", participationFormat: "tft" } }),
      registration({ id: "tft-two", game: "tft", tournament: { id: "tft-cup", title: "TFT Cup", participationFormat: "tft" } })
    ]);

    fireEvent.click(screen.getByLabelText("Select all pending Teamfight Tactics registrations"));
    fireEvent.click(screen.getByRole("button", { name: "Approve selected (2)" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/staff/registrations", expect.objectContaining({ method: "POST" })));
    expect(await screen.findByText(/Approved 1 registration\. 1 failed and remain selected/)).toBeInTheDocument();
    expect(screen.queryByText("Player tft-one")).not.toBeInTheDocument();
    expect(screen.getAllByText("Player tft-two")).toHaveLength(2);
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    expect(navigation.refresh).toHaveBeenCalled();
  });
});
