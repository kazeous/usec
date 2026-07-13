"use client";

import { useState } from "react";
import type { StandingRow } from "@/lib/types";

export function StandingsTable({ standings, swiss = false, defaultLimit, highlightedEntryId }: {
  standings: StandingRow[];
  swiss?: boolean;
  defaultLimit?: number;
  highlightedEntryId?: string;
}) {
  const [showAll, setShowAll] = useState(false);
  if (!standings.length) return null;

  const limited = defaultLimit && standings.length > defaultLimit && !showAll;
  let visibleStandings = limited ? standings.slice(0, defaultLimit) : standings;
  const highlighted = highlightedEntryId ? standings.find((row) => row.entryId === highlightedEntryId) : undefined;
  if (limited && highlighted && !visibleStandings.some((row) => row.entryId === highlighted.entryId)) {
    visibleStandings = [...visibleStandings.slice(0, Math.max(0, defaultLimit - 1)), highlighted];
  }

  return (
    <section className="panel p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-xl font-black">Standings</h2>{limited ? <p className="mt-1 text-sm muted">Showing {visibleStandings.length} of {standings.length} teams.</p> : null}</div>
        {defaultLimit && standings.length > defaultLimit ? <button className="button button-secondary" type="button" onClick={() => setShowAll((current) => !current)}>{showAll ? "Show fewer" : "Show all standings"}</button> : null}
      </div>
      <div className="table-wrap">
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead><tr className="border-b border-[#ded7ca]"><th className="py-3">#</th><th>Team</th><th>Played</th><th>W–L</th>{swiss ? <th>Buchholz</th> : null}<th>Games</th><th>Diff</th></tr></thead>
          <tbody>{visibleStandings.map((row) => <tr className={`border-b border-[#ece3d7] ${row.entryId === highlightedEntryId ? "bg-[#edf3ff]" : ""}`} key={row.entryId}><td className="py-3 font-black">{row.rank}</td><td className="font-bold">{row.name}</td><td>{row.played}</td><td>{row.wins}–{row.losses}</td>{swiss ? <td>{row.buchholz ?? 0}</td> : null}<td>{row.gamesWon}–{row.gamesLost}</td><td>{row.gameDifferential > 0 ? "+" : ""}{row.gameDifferential}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
