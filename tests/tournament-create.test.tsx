import { createElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TournamentCreateForm } from "@/components/staff/TournamentCreateForm";

describe("TournamentCreateForm", () => {
  it("only shows Swiss rounds for the Swiss format", () => {
    render(createElement(TournamentCreateForm));

    expect(screen.queryByLabelText("Swiss rounds")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Format"), { target: { value: "swiss" } });
    expect(screen.getByLabelText("Swiss rounds")).toHaveValue(3);

    fireEvent.change(screen.getByLabelText("Format"), { target: { value: "round_robin" } });
    expect(screen.queryByLabelText("Swiss rounds")).not.toBeInTheDocument();
  });

  it("locks TFT to the staged lobby format and exposes final mode", () => {
    render(createElement(TournamentCreateForm));
    fireEvent.change(screen.getByLabelText("Game"), { target: { value: "tft" } });
    expect(screen.getByLabelText("Format")).toHaveValue("tft_lobby");
    expect(screen.getByLabelText("Final format")).toHaveValue("fixed_games");
    expect(screen.queryByRole("option", { name: "single elimination" })).not.toBeInTheDocument();
  });
});
