"use client";

import { useMemo, useState } from "react";
import { Play, Plus } from "lucide-react";

type VetoState = {
  status: string;
  mapPool: string[];
  actions: Array<{ action: string; mapName: string; order: number }>;
  nextStep?: { team: "A" | "B" | "system"; action: string } | null;
} | null;

export function VetoControl({ matchId, teamAName, teamBName, initial }: { matchId: string; teamAName: string; teamBName: string; initial: VetoState }) {
  const [veto, setVeto] = useState(initial);
  const [message, setMessage] = useState("");
  const available = useMemo(() => veto?.mapPool.filter((map) => !veto.actions.some((action) => action.mapName === map)) ?? [], [veto]);
  const actorName = veto?.nextStep?.team === "A" ? teamAName : veto?.nextStep?.team === "B" ? teamBName : "System";

  async function reloadVeto() {
    const response = await fetch(`/api/matches/${matchId}/veto`, { cache: "no-store" });
    if (response.ok) setVeto(await response.json());
  }
  async function start() {
    const response = await fetch(`/api/staff/matches/${matchId}/veto`, { method: "POST" });
    const result = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Veto session is active." : result.error ?? "Could not start veto.");
    if (response.ok) await reloadVeto();
  }
  async function addAction(formData: FormData) {
    const response = await fetch(`/api/staff/matches/${matchId}/veto`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mapName: formData.get("mapName") }) });
    const result = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Veto action saved." : result.error ?? "Could not save veto action.");
    if (response.ok) await reloadVeto();
  }

  return <section className="panel grid gap-4 p-5"><div><h2 className="text-xl font-black">Map veto controls</h2><p className="text-sm muted">The expected entrant and action are derived from the persisted veto sequence.</p></div>{!veto ? <button className="button button-secondary w-fit" type="button" onClick={start}><Play size={16} aria-hidden />Start veto</button> : <><div className="rounded-md border border-[#ded7ca] bg-[#fffdf8] p-3"><p className="font-black">{veto.nextStep ? `${actorName} to ${veto.nextStep.action}` : "Veto complete"}</p><p className="text-sm muted">{veto.actions.length} actions recorded · {available.length} maps available</p></div>{veto.status === "active" && veto.nextStep ? <form className="flex flex-wrap gap-3" onSubmit={(event) => { event.preventDefault(); void addAction(new FormData(event.currentTarget)); }}><select className="field max-w-sm" name="mapName">{available.map((map) => <option value={map} key={map}>{map}</option>)}</select><button className="button button-primary" type="submit"><Plus size={16} aria-hidden />Record {veto.nextStep.action}</button></form> : null}<div className="grid gap-2">{veto.actions.map((action) => <p className="rounded-md border border-[#ded7ca] px-3 py-2 text-sm" key={action.order}><span className="font-black">{action.order}. {action.action}</span> · {action.mapName}</p>)}</div></>}{message ? <p className="text-sm font-bold muted">{message}</p> : null}</section>;
}
