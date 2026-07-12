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
});
