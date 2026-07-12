"use client";

import { useState } from "react";
import type { PublicEntry, PublicTftLobby, PublicTftStage, TournamentStatus } from "@/lib/types";

export function TftOperations({ tournament, entries, stages, canAdmin }: {
  tournament: { id: string; status: TournamentStatus };
  entries: PublicEntry[];
  stages: PublicTftStage[];
  canAdmin: boolean;
}) {
  const [message, setMessage] = useState("");
  const current = stages.at(-1);

  async function mutate(url: string) {
    const response = await fetch(url, { method: "POST" });
    const result = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Saved." : result.error ?? "Operation failed.");
    if (response.ok) window.location.reload();
  }

  return <div className="grid gap-4">
    {entries.length === 8 || entries.length === 16 ? <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-900">Riot’s published tournament policy requires at least 20 participants. This {entries.length}-player field is supported for internal or community use, but organizers should review current Riot policy.</div> : null}
    {canAdmin && !current ? <section className="panel p-5"><button className="button button-primary" type="button" disabled={!([8, 16, 32, 64].includes(entries.length)) || !["draft", "registration"].includes(tournament.status)} onClick={() => mutate(`/api/staff/tournaments/${tournament.id}/generate-bracket`)}>Generate TFT lobbies</button><p className="mt-2 text-sm muted">Exactly 8, 16, 32, or 64 confirmed players are required.</p></section> : null}
    {canAdmin && current?.status === "complete" && !current.isFinal ? <section className="panel p-5"><button className="button button-primary" type="button" onClick={() => mutate(`/api/staff/tournaments/${tournament.id}/tft-next-stage`)}>Generate next TFT stage</button></section> : null}
    {current ? <div className="grid gap-4">{current.lobbies.map((lobby) => <TftLobbyScoring key={lobby.id} lobby={lobby} stage={current} onMessage={setMessage} />)}</div> : null}
    {message ? <p className="text-sm font-bold muted">{message}</p> : null}
  </div>;
}

function TftLobbyScoring({ lobby, stage, onMessage }: { lobby: PublicTftLobby; stage: PublicTftStage; onMessage: (message: string) => void }) {
  return <section className="panel grid gap-4 p-5"><div><h2 className="text-xl font-black">{stage.isFinal ? "Final lobby scoring" : `Stage ${stage.sequence} · Lobby ${lobby.number}`}</h2><p className="text-sm muted">Enter each player’s unique placement for a game. Saving an existing game replaces all eight results.</p></div><div className="grid gap-4 lg:grid-cols-2">{lobby.games.map((game) => <TftGameForm key={game.id} game={game} lobby={lobby} onMessage={onMessage} />)}</div></section>;
}

function TftGameForm({ game, lobby, onMessage }: { game: PublicTftLobby["games"][number]; lobby: PublicTftLobby; onMessage: (message: string) => void }) {
  const initial = Object.fromEntries(lobby.entries.map((item) => [item.entry.id, item.placements.find((placement) => placement.gameId === game.id)?.placement ?? item.rank]));
  const [placements, setPlacements] = useState<Record<string, number>>(initial);
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    const response = await fetch(`/api/staff/tft-games/${game.id}/results`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ placements: lobby.entries.map((item) => ({ entryId: item.entry.id, placement: placements[item.entry.id] })) }) });
    const result = await response.json().catch(() => ({}));
    onMessage(response.ok ? `Game ${game.number} saved.` : result.error ?? "Could not save results.");
    if (response.ok) window.location.reload();
    setSaving(false);
  }
  return <div className="rounded-md border border-[#ded7ca] p-4"><h3 className="mb-3 font-black">Game {game.number}{game.complete ? " · Complete" : ""}</h3><div className="grid gap-2">{lobby.entries.map((item) => <label className="flex items-center justify-between gap-3 text-sm" key={item.entry.id}><span className="font-bold">{item.entry.name}</span><select className="field w-20" aria-label={`Game ${game.number} placement for ${item.entry.name}`} value={placements[item.entry.id]} onChange={(event) => setPlacements((current) => ({ ...current, [item.entry.id]: Number(event.target.value) }))}>{Array.from({ length: 8 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label>)}</div><button className="button button-secondary mt-4" type="button" disabled={saving} onClick={save}>{saving ? "Saving" : game.complete ? "Correct results" : "Save results"}</button></div>;
}
