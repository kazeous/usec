import { gameConfigs } from "@/lib/game-config";
import type { Game } from "@/lib/types";

export type VetoActionType = "ban" | "pick" | "decider";

export type VetoStep = {
  team: "A" | "B" | "system";
  action: VetoActionType;
};

export type VetoAction = {
  actorTeamId?: string | null;
  action: VetoActionType;
  mapName: string;
  order: number;
};

export type VetoState = {
  game: Game;
  teamAId: string;
  teamBId: string;
  mapPool: string[];
  actions: VetoAction[];
};

const bestOfThreeSequence: VetoStep[] = [
  { team: "A", action: "ban" },
  { team: "B", action: "ban" },
  { team: "A", action: "pick" },
  { team: "B", action: "pick" },
  { team: "A", action: "ban" },
  { team: "B", action: "ban" },
  { team: "system", action: "decider" }
];

export function getVetoSequence(game: Game) {
  if (!gameConfigs[game].hasMapVeto) {
    return [];
  }

  return bestOfThreeSequence;
}

export function getAvailableMaps(state: VetoState) {
  const used = new Set(state.actions.map((action) => action.mapName));
  return state.mapPool.filter((mapName) => !used.has(mapName));
}

export function getNextVetoStep(state: VetoState) {
  const sequence = getVetoSequence(state.game);
  return sequence[state.actions.length] ?? null;
}

export function isVetoComplete(state: VetoState) {
  return getNextVetoStep(state) === null;
}

export function applyVetoAction(state: VetoState, mapName: string, actorTeamId?: string | null): VetoState {
  const nextStep = getNextVetoStep(state);
  if (!nextStep) {
    throw new Error("Veto is already complete.");
  }

  const availableMaps = getAvailableMaps(state);
  if (!availableMaps.includes(mapName)) {
    throw new Error(`${mapName} is not available for this veto.`);
  }

  const expectedTeamId =
    nextStep.team === "A" ? state.teamAId : nextStep.team === "B" ? state.teamBId : null;

  if (nextStep.team !== "system" && actorTeamId !== expectedTeamId) {
    throw new Error("It is not this team's turn.");
  }

  return {
    ...state,
    actions: [
      ...state.actions,
      {
        actorTeamId: expectedTeamId,
        action: nextStep.action,
        mapName,
        order: state.actions.length + 1
      }
    ]
  };
}

export function completeSystemDecider(state: VetoState) {
  const nextStep = getNextVetoStep(state);
  if (!nextStep || nextStep.action !== "decider") {
    return state;
  }

  const [decider] = getAvailableMaps(state);
  if (!decider) {
    throw new Error("No map is available for the decider.");
  }

  return applyVetoAction(state, decider, null);
}
