"use client";

import { useState } from "react";
import { Save } from "lucide-react";

export function MatchScoreForm({
  matchId,
  teamAName,
  teamBName,
  bestOf,
  initialTeamAScore,
  initialTeamBScore,
  completed
}: {
  matchId: string;
  teamAName: string;
  teamBName: string;
  bestOf: number;
  initialTeamAScore: number;
  initialTeamBScore: number;
  completed: boolean;
}) {
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const response = await fetch(`/api/staff/matches/${matchId}/score`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        teamAScore: Number(formData.get("teamAScore")),
        teamBScore: Number(formData.get("teamBScore"))
      })
    });

    const result = await response.json();
    setMessage(response.ok ? "Score saved." : result.error ?? "Could not save score.");
  }

  async function rollback() {
    if (!window.confirm("Rollback this result and clear every downstream assignment and result?")) return;
    const response = await fetch(`/api/staff/matches/${matchId}/score`, { method: "DELETE" });
    const result = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Result rolled back." : result.error ?? "Could not roll back result.");
    if (response.ok) window.location.reload();
  }

  return (
    <form className="panel grid gap-4 p-5" onSubmit={handleSubmit}>
      <div><h2 className="text-xl font-black">Update score</h2><p className="text-sm muted">Best-of-{bestOf}: the winner must reach {Math.floor(bestOf / 2) + 1} series wins.</p></div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold">
          {teamAName}
          <input className="field" min={0} max={Math.floor(bestOf / 2) + 1} name="teamAScore" type="number" defaultValue={initialTeamAScore} />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          {teamBName}
          <input className="field" min={0} max={Math.floor(bestOf / 2) + 1} name="teamBScore" type="number" defaultValue={initialTeamBScore} />
        </label>
      </div>
      {message ? <p className="text-sm font-bold muted">{message}</p> : null}
      <button className="button button-primary w-fit" type="submit">
        <Save size={16} aria-hidden />
        Save score
      </button>
      {completed ? <button className="button button-danger w-fit" type="button" onClick={rollback}>Rollback result and downstream matches</button> : null}
    </form>
  );
}
