"use client";

import { useState } from "react";
import type { PublicTftStage, TftFinalMode } from "@/lib/types";

export function TftTournamentView({ stages, finalMode }: { stages: PublicTftStage[]; finalMode?: TftFinalMode | null }) {
  const [selected, setSelected] = useState(stages.at(-1)?.id ?? "");
  if (!stages.length) return <section className="panel p-5"><p className="font-bold">Lobby assignments have not been generated yet.</p></section>;
  const stage = stages.find((item) => item.id === selected) ?? stages.at(-1)!;
  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        {stages.map((item) => <button className={stage.id === item.id ? "button button-primary" : "button button-secondary"} key={item.id} type="button" onClick={() => setSelected(item.id)}>{item.isFinal ? "Final" : `Stage ${item.sequence}`}</button>)}
      </div>
      {stage.winner ? <div className="panel p-5"><p className="text-sm font-black uppercase text-cobalt">Champion</p><p className="mt-1 text-3xl font-black">{stage.winner.name}</p></div> : null}
      <div className="grid gap-4 xl:grid-cols-2">
        {stage.lobbies.map((lobby) => (
          <article className="panel overflow-hidden" key={lobby.id}>
            <div className="border-b border-[#ded7ca] p-4"><h2 className="text-xl font-black">{stage.isFinal ? "Final lobby" : `Lobby ${lobby.number}`}</h2><p className="text-sm muted">{stage.isFinal ? finalMode === "checkmate" ? "20-point checkmate · maximum 8 games" : "Six-game final" : "Top four advance after four games"}</p></div>
            <div className="table-wrap"><table className="w-full min-w-[620px] text-left text-sm"><thead><tr className="border-b border-[#ded7ca]"><th className="p-3">#</th><th>Player</th>{lobby.games.map((game) => <th key={game.id}>G{game.number}</th>)}<th>Pts</th><th>Status</th></tr></thead><tbody>
              {lobby.entries.map((item) => <tr className="border-b border-[#ece3d7]" key={item.entry.id}><td className="p-3 font-black">{item.rank}</td><td className="font-bold">{item.entry.name}</td>{lobby.games.map((game) => <td key={game.id}>{item.placements.find((placement) => placement.gameId === game.id)?.placement ?? "–"}</td>)}<td className="font-black">{item.totalPoints}</td><td>{item.advanced === true ? "Advanced" : item.advanced === false ? "Eliminated" : stage.isFinal && finalMode === "checkmate" && item.checkmateEligible ? "In check" : "Playing"}</td></tr>)}
            </tbody></table></div>
          </article>
        ))}
      </div>
    </section>
  );
}
