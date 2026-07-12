import { describe, expect, it } from "vitest";
import { getTournamentStatusPresentation } from "@/components/TournamentStatusPill";

describe("tournament status presentation", () => {
  it("distinguishes open and closed registration", () => {
    expect(getTournamentStatusPresentation("registration", true).label).toBe("Registration");
    expect(getTournamentStatusPresentation("registration", false).label).toBe("Closed registration");
  });

  it("presents completed and archived tournaments as ended", () => {
    expect(getTournamentStatusPresentation("complete", false).label).toBe("Ended");
    expect(getTournamentStatusPresentation("archived", false).label).toBe("Ended");
  });
});
