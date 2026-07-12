"use client";

import { useState } from "react";
import { Check, Link2, X } from "lucide-react";
import { StatusPill } from "@/components/StatusPill";

type TeamOption = { id: string; name: string; game: string };
type RegistrationItem = {
  id: string;
  game: string;
  mode: "solo" | "team";
  status: string;
  teamName?: string | null;
  reviewNote?: string | null;
  tournament: { id: string; title: string };
  resolvedTeam?: { id: string; name: string } | null;
  members: Array<{ fullName: string; inGameName: string; studentId: string; universityName: string; email: string | null; isCaptain: boolean; isReserve: boolean }>;
};

export function RegistrationReviewTable({ registrations, teams }: { registrations: RegistrationItem[]; teams: TeamOption[] }) {
  const [items, setItems] = useState(registrations);
  const [selectedTeams, setSelectedTeams] = useState<Record<string, string>>({});
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  async function review(registrationId: string, action: "reject" | "approve_new" | "approve_link") {
    const response = await fetch("/api/staff/registrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId, action, teamId: selectedTeams[registrationId] || undefined, reviewNote: reviewNotes[registrationId] || undefined })
    });
    const result = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Registration updated." : result.error ?? "Could not update registration.");
    if (response.ok) {
      setItems((current) => current.map((item) => item.id === registrationId ? { ...item, status: action === "reject" ? "rejected" : "approved" } : item));
    }
  }

  return (
    <section className="panel p-5">
      <div className="mb-4"><h2 className="text-xl font-black">Registration review</h2><p className="text-sm muted">Approve solo players into the pool, create teams, or link a submission to the team directory.</p></div>
      <div className="grid gap-4">
        {items.map((registration) => {
          const compatibleTeams = teams.filter((team) => team.game === registration.game);
          return (
            <article className="rounded-md border border-[#ded7ca] bg-[#fffdf8] p-4" key={registration.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="font-black">{registration.teamName ?? registration.members[0]?.fullName ?? "Registration"}</p><p className="text-sm muted">{registration.tournament.title} · {registration.game.toUpperCase()} · {registration.mode}</p></div>
                <StatusPill value={registration.status} />
              </div>
              <div className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                {registration.members.map((member) => <p key={member.studentId}><span className="font-bold">{member.fullName}</span>{member.isCaptain ? " (Captain)" : member.isReserve ? " (Reserve)" : ""} · {member.inGameName} · {member.studentId}{member.email ? ` · ${member.email}` : ""}</p>)}
              </div>
              {registration.status === "pending" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <input className="field basis-full" placeholder="Review note (shown in the registration record)" value={reviewNotes[registration.id] ?? ""} onChange={(event) => setReviewNotes((current) => ({ ...current, [registration.id]: event.target.value }))} />
                  <button className="button button-primary" type="button" onClick={() => review(registration.id, "approve_new")}><Check size={16} aria-hidden />{registration.mode === "solo" ? "Approve to solo pool" : "Approve as new team"}</button>
                  {registration.mode === "team" && compatibleTeams.length ? (
                    <><select className="field max-w-xs" value={selectedTeams[registration.id] ?? ""} onChange={(event) => setSelectedTeams((current) => ({ ...current, [registration.id]: event.target.value }))}><option value="">Existing team…</option>{compatibleTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select><button className="button button-secondary" type="button" disabled={!selectedTeams[registration.id]} onClick={() => review(registration.id, "approve_link")}><Link2 size={16} aria-hidden />Link and enroll</button></>
                  ) : null}
                  <button className="button button-danger" type="button" onClick={() => review(registration.id, "reject")}><X size={16} aria-hidden />Reject</button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
      {!items.length ? <p className="text-sm muted">No registrations yet.</p> : null}
      {message ? <p className="mt-4 text-sm font-bold muted">{message}</p> : null}
    </section>
  );
}
