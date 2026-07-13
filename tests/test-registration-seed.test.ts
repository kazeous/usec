import { describe, expect, it } from "vitest";
import {
  buildTestRegistrationSeed,
  selectTestTournamentTargets,
  TEST_REGISTRATION_COUNTS,
  TEST_REGISTRATION_PROVIDER,
  type TestTournamentCandidate
} from "../prisma/test-registration-data";

const future = new Date("2030-01-01T00:00:00.000Z");
const candidates: TestTournamentCandidate[] = [
  { id: "val", title: "USEC Fresher II", game: "valorant", status: "registration", registrationOpen: true, registrationClosesAt: future, participationFormat: "five_v_five" },
  { id: "cs2", title: "USEC Fresher II", game: "cs2", status: "registration", registrationOpen: true, registrationClosesAt: future, participationFormat: "five_v_five" },
  { id: "lol", title: "USEC Fresher II", game: "lol", status: "registration", registrationOpen: true, registrationClosesAt: future, participationFormat: "five_v_five" },
  { id: "tft", title: "USEC Fresher II", game: "tft", status: "registration", registrationOpen: true, registrationClosesAt: future, participationFormat: "tft" }
];

describe("production test-registration seed", () => {
  it("builds 16 five-player rosters per team game and 60 pending TFT registrations", () => {
    const targets = selectTestTournamentTargets(candidates, "USEC Fresher II", new Date("2029-01-01T00:00:00.000Z"));
    const seed = buildTestRegistrationSeed(targets);

    expect(seed).toHaveLength(108);
    expect(seed.flatMap((item) => item.members)).toHaveLength(300);
    for (const game of ["valorant", "cs2", "lol", "tft"] as const) {
      const registrations = seed.filter((item) => item.registration.game === game);
      expect(registrations).toHaveLength(TEST_REGISTRATION_COUNTS[game]);
      expect(registrations.every((item) => item.registration.status === "pending")).toBe(true);
      expect(registrations.every((item) => item.registration.captchaProvider === TEST_REGISTRATION_PROVIDER)).toBe(true);
      expect(registrations.every((item) => item.members.length === (game === "tft" ? 1 : 5))).toBe(true);
    }

    const registrationIds = seed.map((item) => item.registration.id);
    const members = seed.flatMap((item) => item.members);
    const memberIds = members.map((member) => member.id);
    const studentIds = members.map((member) => member.studentId);
    const emails = members.flatMap((member) => member.email ? [member.email] : []);
    expect(new Set(registrationIds).size).toBe(registrationIds.length);
    expect(new Set(memberIds).size).toBe(memberIds.length);
    expect(new Set(studentIds).size).toBe(studentIds.length);
    expect(new Set(emails).size).toBe(emails.length);
  });

  it("requires one compatible, currently open tournament per game", () => {
    const now = new Date("2029-01-01T00:00:00.000Z");
    expect(() => selectTestTournamentTargets(candidates.slice(1), undefined, now)).toThrow("exactly one open valorant tournament");
    expect(() => selectTestTournamentTargets([...candidates, { ...candidates[0], id: "val-2" }], undefined, now)).toThrow("found 2");
    expect(() => selectTestTournamentTargets(candidates.map((candidate) => candidate.game === "tft" ? { ...candidate, participationFormat: "one_v_one" } : candidate), undefined, now)).toThrow("expected tft");
    expect(() => selectTestTournamentTargets(candidates.map((candidate) => candidate.game === "lol" ? { ...candidate, registrationClosesAt: new Date("2028-01-01T00:00:00.000Z") } : candidate), undefined, now)).toThrow("exactly one open lol tournament");
  });
});
