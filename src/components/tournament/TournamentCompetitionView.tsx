"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { BracketView } from "@/components/tournament/BracketView";
import { StandingsTable } from "@/components/tournament/StandingsTable";
import type { PublicEntry, PublicMatch, StandingRow } from "@/lib/types";

export function TournamentCompetitionView({ entries, matches, standings, swiss = false }: {
  entries: PublicEntry[];
  matches: PublicMatch[];
  standings: StandingRow[];
  swiss?: boolean;
}) {
  const [selectedEntryId, setSelectedEntryId] = useState("");
  const selectedEntry = entries.find((entry) => entry.id === selectedEntryId);
  const teamMatches = useMemo(() => selectedEntryId ? matches.filter((match) => match.teamA?.id === selectedEntryId || match.teamB?.id === selectedEntryId) : matches, [matches, selectedEntryId]);
  const sortedEntries = useMemo(() => [...entries].sort((left, right) => left.name.localeCompare(right.name)), [entries]);
  const standingsView = <StandingsTable standings={standings} swiss={swiss} defaultLimit={8} highlightedEntryId={selectedEntryId || undefined} />;
  const bracketView = selectedEntry && !teamMatches.length ? (
    <section className="panel p-5">
      <h2 className="font-black">No assigned matches yet</h2>
      <p className="mt-1 text-sm muted">This team may be waiting for the bracket or a previous-round result.</p>
    </section>
  ) : <BracketView matches={teamMatches} />;

  return (
    <>
      {entries.length ? (
        <section className="panel p-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-64 flex-1">
              <label className="mb-2 flex items-center gap-2 text-sm font-black" htmlFor="team-finder"><Search size={16} aria-hidden />Find your team</label>
              <select className="field" id="team-finder" value={selectedEntryId} onChange={(event) => setSelectedEntryId(event.target.value)}>
                <option value="">Show the full bracket</option>
                {sortedEntries.map((entry) => <option value={entry.id} key={entry.id}>{entry.name}</option>)}
              </select>
            </div>
            {selectedEntry ? <button className="button button-secondary" type="button" onClick={() => setSelectedEntryId("")}><X size={16} aria-hidden />Clear team</button> : null}
          </div>
          <p className="mt-2 text-sm muted">Choose a team to show only its assigned matches across every round.</p>
          {selectedEntry ? <p className="mt-3 text-sm font-bold">Showing {teamMatches.length} match{teamMatches.length === 1 ? "" : "es"} for {selectedEntry.name}.</p> : null}
        </section>
      ) : null}

      {selectedEntry ? <>{bracketView}{standingsView}</> : <>{standingsView}{bracketView}</>}
    </>
  );
}
