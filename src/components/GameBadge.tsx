import type { Game } from "@/lib/types";
import { gameConfigs } from "@/lib/game-config";

export function GameBadge({ game }: { game: Game }) {
  return (
    <span className="inline-flex items-center rounded-md border border-[#cfc6b8] bg-[#fffdf8] px-2 py-1 text-xs font-black">
      {gameConfigs[game].shortLabel}
    </span>
  );
}
