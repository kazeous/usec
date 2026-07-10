import { describe, expect, it } from "vitest";
import { applyVetoAction, completeSystemDecider, getAvailableMaps, getNextVetoStep, isVetoComplete } from "@/lib/tournaments/veto";

const state = {
  game: "valorant" as const,
  teamAEntryId: "team-a",
  teamBEntryId: "team-b",
  mapPool: ["Ascent", "Bind", "Haven", "Lotus", "Split", "Sunset", "Icebox"],
  actions: []
};

describe("map veto", () => {
  it("starts with team A ban", () => {
    expect(getNextVetoStep(state)).toEqual({ team: "A", action: "ban" });
  });

  it("enforces team turn order", () => {
    expect(() => applyVetoAction(state, "Ascent", "team-b")).toThrow("turn");
  });

  it("removes selected maps from the available pool", () => {
    const next = applyVetoAction(state, "Ascent", "team-a");

    expect(getAvailableMaps(next)).not.toContain("Ascent");
  });

  it("can complete a best-of-three veto with system decider", () => {
    let next = applyVetoAction(state, "Ascent", "team-a");
    next = applyVetoAction(next, "Bind", "team-b");
    next = applyVetoAction(next, "Haven", "team-a");
    next = applyVetoAction(next, "Lotus", "team-b");
    next = applyVetoAction(next, "Split", "team-a");
    next = applyVetoAction(next, "Sunset", "team-b");
    next = completeSystemDecider(next);

    expect(isVetoComplete(next)).toBe(true);
    expect(next.actions.at(-1)?.action).toBe("decider");
    expect(next.actions.at(-1)?.mapName).toBe("Icebox");
  });
});
