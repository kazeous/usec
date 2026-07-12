"use client";

import { useMemo, useState } from "react";
import { GitBranch, Plus, Save, Trash2, Users } from "lucide-react";
import type { Game, TournamentFormat, TournamentStatus } from "@/lib/types";

type Entry = { id: string; name: string; seed?: number | null };
type Team = { id: string; name: string; game: Game };
type Solo = { id: string; name: string };

export function TournamentOperations({ tournament, entries, teams, solos }: {
  tournament: { id: string; title: string; game: Game; format: TournamentFormat; status: TournamentStatus; registrationOpen: boolean; registrationMessage?: string | null; registrationClosesAt?: string | null; startsAt?: string | null; swissRounds?: number | null; currentRound: number };
  entries: Entry[];
  teams: Team[];
  solos: Solo[];
}) {
  const [message, setMessage] = useState("");
  const [teamId, setTeamId] = useState("");
  const [selectedSolos, setSelectedSolos] = useState<string[]>([]);
  const [teamName, setTeamName] = useState("");
  const editable = tournament.status === "draft" || tournament.status === "registration";
  const canEnd = tournament.status === "registration" || tournament.status === "seeded" || tournament.status === "live";
  const availableTeams = useMemo(() => teams.filter((team) => team.game === tournament.game && !entries.some((entry) => entry.name === team.name)), [teams, entries, tournament.game]);

  async function mutate(url: string, method: string, body?: unknown) {
    const response = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    const result = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Saved." : result.error ?? "Operation failed.");
    if (response.ok) window.location.reload();
  }

  const nextStatus = tournament.status === "draft" ? "registration" : tournament.status === "registration" ? null : tournament.status === "complete" ? "archived" : null;

  return (
    <div className="grid gap-4">
      <section className="panel grid gap-4 p-5">
        <div><h2 className="text-xl font-black">Event lifecycle and registration</h2><p className="text-sm muted">Draft events are private. Opening registration publishes the event; bracket generation locks rosters.</p></div>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const closeValue = String(form.get("registrationClosesAt") ?? ""); const startValue = String(form.get("startsAt") ?? ""); void mutate(`/api/staff/tournaments/${tournament.id}`, "PATCH", { registrationMessage: form.get("registrationMessage"), registrationOpen: form.get("registrationOpen") === "on", registrationClosesAt: closeValue ? new Date(closeValue).toISOString() : null, startsAt: startValue ? new Date(startValue).toISOString() : null, swissRounds: tournament.format === "swiss" ? Number(form.get("swissRounds") || 3) : null }); }}>
          <input className="field md:col-span-2" name="registrationMessage" defaultValue={tournament.registrationMessage ?? ""} placeholder="Registration message" disabled={!editable} />
          <label className="grid gap-2 text-sm font-bold">Starts at<input className="field" name="startsAt" type="datetime-local" defaultValue={tournament.startsAt?.slice(0, 16) ?? ""} disabled={!editable} /></label>
          <label className="grid gap-2 text-sm font-bold">Registration closes<input className="field" name="registrationClosesAt" type="datetime-local" defaultValue={tournament.registrationClosesAt?.slice(0, 16) ?? ""} disabled={!editable} /></label>
          {tournament.format === "swiss" ? <label className="grid gap-2 text-sm font-bold">Swiss rounds<input className="field" name="swissRounds" type="number" min={3} max={7} defaultValue={tournament.swissRounds ?? 3} disabled={!editable} /></label> : <span />}
          <label className="flex items-center gap-2 text-sm font-bold"><input name="registrationOpen" type="checkbox" defaultChecked={tournament.registrationOpen} disabled={tournament.status !== "registration"} />Registration open</label>
          <button className="button button-secondary w-fit" type="submit" disabled={!editable}><Save size={16} aria-hidden />Save registration settings</button>
        </form>
        <div className="flex flex-wrap gap-3">
          {nextStatus ? <button className="button button-primary w-fit" type="button" onClick={() => mutate(`/api/staff/tournaments/${tournament.id}`, "PATCH", { status: nextStatus, registrationOpen: nextStatus === "registration" })}>Move to {nextStatus}</button> : null}
          {canEnd ? <button className="button button-danger w-fit" type="button" onClick={() => { if (window.confirm("End this tournament? Registration will close and the public status will change to Ended.")) void mutate(`/api/staff/tournaments/${tournament.id}`, "PATCH", { status: "complete", registrationOpen: false }); }}>End tournament</button> : null}
        </div>
      </section>

      <section className="panel grid gap-4 p-5">
        <div><h2 className="text-xl font-black">Confirmed entries and seeds</h2><p className="text-sm muted">Enroll a reusable team or adjust unique seeds before the bracket is locked.</p></div>
        {editable ? <div className="flex flex-wrap gap-2"><select className="field max-w-sm" value={teamId} onChange={(event) => setTeamId(event.target.value)}><option value="">Team directory…</option>{availableTeams.map((team) => <option value={team.id} key={team.id}>{team.name}</option>)}</select><button className="button button-secondary" type="button" disabled={!teamId} onClick={() => mutate(`/api/staff/tournaments/${tournament.id}/entries`, "POST", { teamId })}><Plus size={16} aria-hidden />Enroll</button></div> : null}
        <div className="grid gap-2">{entries.map((entry) => <div className="flex flex-wrap items-center gap-3 rounded-md border border-[#ded7ca] p-3" key={entry.id}><span className="min-w-48 flex-1 font-bold">{entry.name}</span><input className="field w-24" type="number" min={1} defaultValue={entry.seed ?? 1} disabled={!editable} onBlur={(event) => { if (Number(event.target.value) !== entry.seed) void mutate(`/api/staff/tournaments/${tournament.id}/entries`, "PATCH", { entryId: entry.id, seed: Number(event.target.value) }); }} />{editable ? <button className="button button-danger" type="button" onClick={() => mutate(`/api/staff/tournaments/${tournament.id}/entries`, "DELETE", { entryId: entry.id })}><Trash2 size={16} aria-hidden />Remove</button> : null}</div>)}</div>
      </section>

      {editable && solos.length ? <section className="panel grid gap-4 p-5"><div><h2 className="text-xl font-black">Build a team from solo players</h2><p className="text-sm muted">Select exactly five approved, unresolved players. The first selected player becomes captain.</p></div><input className="field" value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="New team name" /><div className="grid gap-2 sm:grid-cols-2">{solos.map((solo) => <label className="flex items-center gap-2 rounded-md border border-[#ded7ca] p-3" key={solo.id}><input type="checkbox" checked={selectedSolos.includes(solo.id)} onChange={(event) => setSelectedSolos((current) => event.target.checked ? [...current, solo.id] : current.filter((id) => id !== solo.id))} />{solo.name}</label>)}</div><button className="button button-secondary w-fit" type="button" disabled={selectedSolos.length !== 5 || teamName.trim().length < 2} onClick={() => mutate(`/api/staff/tournaments/${tournament.id}/solo-team`, "POST", { teamName, registrationIds: selectedSolos })}><Users size={16} aria-hidden />Create and enroll team</button></section> : null}

      <section className="panel flex flex-wrap items-center gap-3 p-5"><button className="button button-primary" type="button" disabled={entries.length < (tournament.format === "swiss" ? 4 : 2) || !editable} onClick={() => mutate(`/api/staff/tournaments/${tournament.id}/generate-bracket`, "POST")}><GitBranch size={16} aria-hidden />Generate bracket</button>{tournament.format === "swiss" && tournament.status === "live" && tournament.currentRound < (tournament.swissRounds ?? 0) ? <button className="button button-secondary" type="button" onClick={() => mutate(`/api/staff/tournaments/${tournament.id}/swiss-round`, "POST")}>Generate next Swiss round</button> : null}{message ? <p className="basis-full text-sm font-bold muted">{message}</p> : null}</section>
    </div>
  );
}
