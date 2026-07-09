"use client";

import { useState } from "react";
import { Save } from "lucide-react";

export function MatchScoreForm({
  matchId,
  teamAName,
  teamBName
}: {
  matchId: string;
  teamAName: string;
  teamBName: string;
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

  return (
    <form className="panel grid gap-4 p-5" onSubmit={handleSubmit}>
      <h2 className="text-xl font-black">Update score</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold">
          {teamAName}
          <input className="field" min={0} name="teamAScore" type="number" defaultValue={0} />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          {teamBName}
          <input className="field" min={0} name="teamBScore" type="number" defaultValue={0} />
        </label>
      </div>
      {message ? <p className="text-sm font-bold muted">{message}</p> : null}
      <button className="button button-primary w-fit" type="submit">
        <Save size={16} aria-hidden />
        Save score
      </button>
    </form>
  );
}
