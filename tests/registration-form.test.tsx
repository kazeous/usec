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
});
