import { describe, expect, it } from "vitest";
import { normalizeRegistrationPayload, staffApplicationSchema, validateTeamSize } from "@/lib/validation";

const member = (index: number, isCaptain = false) => ({
  fullName: `Player ${index}`,
  studentId: `S100${index}`,
  universityName: "Example University",
  email: `player${index}@example.edu`,
  discord: `player${index}`,
  isCaptain
});

describe("registration validation", () => {
  it("accepts a normalized five-player event roster", () => {
    const parsed = normalizeRegistrationPayload({
      tournamentId: "event-1", game: "valorant", mode: "team", teamName: "Campus Five",
      members: [member(0, true), member(1), member(2), member(3), member(4)]
    });
    expect(parsed.members).toHaveLength(5);
  });

  it("rejects duplicate identities and multiple captains", () => {
    expect(() => normalizeRegistrationPayload({
      tournamentId: "event-1", game: "valorant", mode: "team", teamName: "Duplicates",
      members: [member(0, true), member(0, true), member(2), member(3), member(4)]
    })).toThrow();
  });

  it("accepts exactly one member for solo registration", () => {
    expect(normalizeRegistrationPayload({ tournamentId: "event-1", game: "lol", mode: "solo", members: [member(1, true)] }).members).toHaveLength(1);
  });

  it("tracks required game team size", () => {
    expect(validateTeamSize("cs2", [member(1), member(2), member(3), member(4)])).toEqual({ valid: true, count: 5, requiredTeamSize: 5 });
  });
});

describe("staff application validation", () => {
  const validApplication = {
    name: "Staff Applicant",
    email: " Applicant@Example.edu ",
    studentId: " usec-101 ",
    universityName: "Example University",
    password: "secure-password",
    applicationReason: "I want to help operate university esports events."
  };

  it("normalizes applicant identity fields", () => {
    expect(staffApplicationSchema.parse(validApplication)).toMatchObject({ email: "applicant@example.edu", studentId: "USEC-101" });
  });

  it("enforces password and application reason bounds", () => {
    expect(() => staffApplicationSchema.parse({ ...validApplication, password: "short" })).toThrow();
    expect(() => staffApplicationSchema.parse({ ...validApplication, applicationReason: "Too short" })).toThrow();
  });
});
