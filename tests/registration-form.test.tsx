import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RegistrationForm } from "@/components/forms/RegistrationForm";

vi.mock("@/components/forms/CaptchaPlaceholder", () => ({
  CaptchaPlaceholder: () => <div>Captcha</div>
}));

describe("RegistrationForm roster size", () => {
  it("renders five main players and up to two selected reserves", () => {
    render(<RegistrationForm tournaments={[{ id: "event-1", title: "Campus Cup", game: "valorant" }]} />);

    expect(screen.getAllByPlaceholderText("In-game name (riot#id)")).toHaveLength(4);
    expect(screen.queryByText("Player 6 · Reserve")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("How many players are you registering?"), { target: { value: "7" } });

    expect(screen.getAllByPlaceholderText("In-game name (riot#id)")).toHaveLength(6);
    expect(screen.getByText("Player 6 · Reserve")).toBeInTheDocument();
    expect(screen.getByText("Player 7 · Reserve")).toBeInTheDocument();
  });

  it("presents TFT as an individual Riot ID registration", () => {
    render(<RegistrationForm tournaments={[{ id: "tft-1", title: "Campus TFT", game: "tft" }]} />);
    expect(screen.getByText(/individual competition/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Riot ID")).toBeInTheDocument();
    expect(screen.queryByText("Team registration")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Team name")).not.toBeInTheDocument();
  });

  it("presents 1v1 tournaments as direct individual registration", () => {
    render(<RegistrationForm tournaments={[{ id: "duel-1", title: "Campus Duel", game: "valorant", participationFormat: "one_v_one" }]} />);
    expect(screen.getByText(/This is a 1v1 tournament/i)).toBeInTheDocument();
    expect(screen.queryByText("Team registration")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Team name")).not.toBeInTheDocument();
  });
});
