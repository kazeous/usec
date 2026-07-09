import { describe, expect, it } from "vitest";
import { normalizeRegistrationPayload, validateTeamSize } from "@/lib/validation";

const captain = {
  game: "valorant",
  mode: "team",
  studentId: "S1000",
  universityName: "Example University",
  fullName: "Captain One",
  email: "captain@example.edu",
  discord: "captain"
} as const;

const teammate = (index: number) => ({
  fullName: `Player ${index}`,
  studentId: `S100${index}`,
  universityName: "Example University",
  email: `player${index}@example.edu`,
  discord: `player${index}`
});

describe("registration validation", () => {
  it("accepts a full five-player Valorant team", () => {
    const parsed = normalizeRegistrationPayload({
      ...captain,
      teamName: "Campus Five",
      teammates: [teammate(1), teammate(2), teammate(3), teammate(4)]
    });

    expect(parsed.teamName).toBe("Campus Five");
  });

  it("rejects an incomplete team roster", () => {
    expect(() =>
      normalizeRegistrationPayload({
        ...captain,
        teamName: "Campus Four",
        teammates: [teammate(1), teammate(2), teammate(3)]
      })
    ).toThrow();
  });

  it("tracks required game team size", () => {
    const result = validateTeamSize("cs2", [teammate(1), teammate(2), teammate(3), teammate(4)]);

    expect(result).toEqual({
      valid: true,
      count: 5,
      requiredTeamSize: 5
    });
  });
});
