import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StaffNav } from "@/components/staff/StaffNav";

describe("staff navigation permissions", () => {
  it("hides account review from regular staff", () => {
    render(<StaffNav name="Operator" role="staff" />);
    expect(screen.queryByRole("link", { name: /accounts/i })).not.toBeInTheDocument();
  });

  it("shows account review to administrators", () => {
    render(<StaffNav name="Admin" role="admin" />);
    expect(screen.getByRole("link", { name: /accounts/i })).toHaveAttribute("href", "/staff/accounts");
  });
});
