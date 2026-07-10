import type { StandingRow } from "@/lib/types";

export function StandingsTable({ standings, swiss = false }: { standings: StandingRow[]; swiss?: boolean }) {
  if (!standings.length) return null;
  return <section className="panel p-5"><h2 className="mb-4 text-xl font-black">Standings</h2><div className="table-wrap"><table className="w-full min-w-[650px] text-left text-sm"><thead><tr className="border-b border-[#ded7ca]"><th className="py-3">#</th><th>Team</th><th>Played</th><th>W–L</th>{swiss ? <th>Buchholz</th> : null}<th>Games</th><th>Diff</th></tr></thead><tbody>{standings.map((row) => <tr className="border-b border-[#ece3d7]" key={row.entryId}><td className="py-3 font-black">{row.rank}</td><td className="font-bold">{row.name}</td><td>{row.played}</td><td>{row.wins}–{row.losses}</td>{swiss ? <td>{row.buchholz ?? 0}</td> : null}<td>{row.gamesWon}–{row.gamesLost}</td><td>{row.gameDifferential > 0 ? "+" : ""}{row.gameDifferential}</td></tr>)}</tbody></table></div></section>;
}
