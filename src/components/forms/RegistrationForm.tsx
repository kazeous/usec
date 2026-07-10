"use client";

import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { CaptchaPlaceholder } from "@/components/forms/CaptchaPlaceholder";
import { gameConfigs } from "@/lib/game-config";
import type { Game } from "@/lib/types";

type RegistrationTournament = { id: string; title: string; game: Game; registrationMessage?: string | null };
type MemberDraft = { fullName: string; studentId: string; universityName: string; email: string; discord: string };
const emptyMember: MemberDraft = { fullName: "", studentId: "", universityName: "", email: "", discord: "" };

export function RegistrationForm({ tournaments, initialTournamentId }: { tournaments: RegistrationTournament[]; initialTournamentId?: string }) {
  const initial = tournaments.some((item) => item.id === initialTournamentId) ? initialTournamentId! : tournaments[0]?.id ?? "";
  const [tournamentId, setTournamentId] = useState(initial);
  const [mode, setMode] = useState<"solo" | "team">("team");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);
  const [teammates, setTeammates] = useState<MemberDraft[]>(Array.from({ length: 4 }, () => ({ ...emptyMember })));
  const tournament = tournaments.find((item) => item.id === tournamentId);
  const game = tournament?.game ?? "valorant";
  const teammateSlots = gameConfigs[game].teamSize - 1;
  const visibleTeammates = useMemo(
    () => mode === "solo" ? [] : Array.from({ length: teammateSlots }, (_, index) => teammates[index] ?? { ...emptyMember }),
    [mode, teammateSlots, teammates]
  );

  function updateTeammate(index: number, field: keyof MemberDraft, value: string) {
    setTeammates((current) => {
      const next = [...current];
      next[index] = { ...(next[index] ?? emptyMember), [field]: value };
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("loading");
    setMessage("");
    if (!captchaToken) {
      setStatus("error");
      setMessage("Please complete the captcha before submitting.");
      return;
    }
    const data = new FormData(form);
    const captain = {
      fullName: String(data.get("fullName") ?? ""),
      studentId: String(data.get("studentId") ?? ""),
      universityName: String(data.get("universityName") ?? ""),
      email: String(data.get("email") ?? ""),
      discord: String(data.get("discord") ?? ""),
      isCaptain: true
    };
    try {
      const response = await fetch("/api/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentId,
          game,
          mode,
          teamName: String(data.get("teamName") ?? ""),
          members: [captain, ...visibleTeammates.map((member) => ({ ...member, isCaptain: false }))],
          captchaToken
        })
      });
      const result = await response.json().catch(() => ({ error: "Registration could not be submitted." }));
      if (!response.ok) throw new Error(result.error ?? "Registration could not be submitted.");
      form.reset();
      setTeammates(Array.from({ length: 4 }, () => ({ ...emptyMember })));
      setStatus("success");
      setMessage("Registration submitted. Staff will review it soon.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Network error while submitting registration.");
    } finally {
      setCaptchaToken("");
      setCaptchaResetSignal((current) => current + 1);
    }
  }

  if (!tournaments.length) {
    return <div className="panel p-5"><p className="font-bold">No tournament registration is currently open.</p><p className="mt-2 text-sm muted">Check back after staff publishes the next event.</p></div>;
  }

  return (
    <form className="panel grid gap-5 p-5" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-bold">
        Tournament
        <select className="field" value={tournamentId} onChange={(event) => setTournamentId(event.target.value)}>
          {tournaments.map((item) => <option key={item.id} value={item.id}>{item.title} · {gameConfigs[item.game].label}</option>)}
        </select>
        <span className="font-normal muted">{tournament?.registrationMessage ?? "Registration is open."}</span>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <button className={mode === "team" ? "button button-primary" : "button button-secondary"} type="button" onClick={() => setMode("team")}>Team registration</button>
        <button className={mode === "solo" ? "button button-primary" : "button button-secondary"} type="button" onClick={() => setMode("solo")}>Solo player</button>
      </div>

      {mode === "team" ? <Field id="teamName" label="Team name" /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Field id="fullName" label={mode === "team" ? "Captain full name" : "Full name"} />
        <Field id="studentId" label="Student ID" />
        <Field id="universityName" label="University name" />
        <Field id="email" label="Email" type="email" />
        <Field id="discord" label="Discord or contact handle" required={false} />
      </div>

      {visibleTeammates.length ? (
        <section className="grid gap-4">
          <div><h2 className="text-lg font-black">Teammates</h2><p className="text-sm muted">Add {teammateSlots} players for a complete {gameConfigs[game].label} roster.</p></div>
          {visibleTeammates.map((member, index) => (
            <div key={index} className="grid gap-3 rounded-md border border-[#ded7ca] bg-[#fffdf8] p-4 md:grid-cols-2">
              <p className="md:col-span-2 text-sm font-black">Player {index + 2}</p>
              {(["fullName", "studentId", "universityName", "email", "discord"] as const).map((field) => (
                <input key={field} className={field === "discord" ? "field md:col-span-2" : "field"} type={field === "email" ? "email" : "text"} required={field !== "discord"} placeholder={{ fullName: "Full name", studentId: "Student ID", universityName: "University name", email: "Email", discord: "Discord/contact handle" }[field]} value={member[field]} onChange={(event) => updateTeammate(index, field, event.target.value)} />
              ))}
            </div>
          ))}
        </section>
      ) : null}

      <CaptchaPlaceholder onTokenChange={setCaptchaToken} resetSignal={captchaResetSignal} />
      {message ? <p className={status === "error" ? "rounded-md bg-[#ffe5e1] p-3 text-sm font-bold text-[#8f2016]" : "rounded-md bg-[#e6f7ef] p-3 text-sm font-bold text-[#17613f]"}>{message}</p> : null}
      <button className="button button-primary w-full sm:w-fit" type="submit" disabled={status === "loading"}><Send size={16} aria-hidden />{status === "loading" ? "Submitting" : "Submit registration"}</button>
    </form>
  );
}

function Field({ id, label, type = "text", required = true }: { id: string; label: string; type?: string; required?: boolean }) {
  return <label className="grid gap-2 text-sm font-bold" htmlFor={id}>{label}<input className="field" id={id} name={id} type={type} required={required} /></label>;
}
