"use client";

import { useState } from "react";
import { Play, Plus } from "lucide-react";

export function VetoControl({
  matchId,
  mapPool
}: {
  matchId: string;
  mapPool: string[];
}) {
  const [message, setMessage] = useState("");

  async function start() {
    const response = await fetch(`/api/staff/matches/${matchId}/veto`, {
      method: "POST"
    });
    const result = await response.json();
    setMessage(response.ok ? "Veto session started." : result.error ?? "Could not start veto.");
  }

  async function addAction(formData: FormData) {
    const response = await fetch(`/api/staff/matches/${matchId}/veto`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mapName: formData.get("mapName"),
        actorTeamId: formData.get("actorTeamId") || null
      })
    });
    const result = await response.json();
    setMessage(response.ok ? "Veto action saved." : result.error ?? "Could not save veto action.");
  }

  return (
    <section className="panel grid gap-4 p-5">
      <div>
        <h2 className="text-xl font-black">Map veto controls</h2>
        <p className="text-sm muted">Staff can start the session and record each turn. Public page refreshes by polling.</p>
      </div>
      <button className="button button-secondary w-fit" type="button" onClick={start}>
        <Play size={16} aria-hidden />
        Start veto
      </button>
      <form
        className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          void addAction(new FormData(event.currentTarget));
        }}
      >
        <input className="field" name="actorTeamId" placeholder="Actor team ID, blank for system decider" />
        <select className="field" name="mapName">
          {mapPool.map((mapName) => (
            <option key={mapName} value={mapName}>
              {mapName}
            </option>
          ))}
        </select>
        <button className="button button-primary" type="submit">
          <Plus size={16} aria-hidden />
          Add action
        </button>
      </form>
      {message ? <p className="text-sm font-bold muted">{message}</p> : null}
    </section>
  );
}
