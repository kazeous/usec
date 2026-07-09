"use client";

import { useState } from "react";
import { GitBranch } from "lucide-react";

export function BracketActions({ tournamentId }: { tournamentId: string }) {
  const [message, setMessage] = useState("");

  async function generate() {
    const response = await fetch(`/api/staff/tournaments/${tournamentId}/generate-bracket`, {
      method: "POST"
    });

    const result = await response.json();
    setMessage(response.ok ? `Generated ${result.matches} matches.` : result.error ?? "Could not generate bracket.");

    if (response.ok) {
      window.location.reload();
    }
  }

  return (
    <div className="panel flex flex-wrap items-center justify-between gap-3 p-4">
      <div>
        <h2 className="text-lg font-black">Bracket organizer</h2>
        <p className="text-sm muted">Generate from approved registrations before the event is locked.</p>
      </div>
      <button className="button button-primary" type="button" onClick={generate}>
        <GitBranch size={16} aria-hidden />
        Generate bracket
      </button>
      {message ? <p className="basis-full text-sm font-bold muted">{message}</p> : null}
    </div>
  );
}
