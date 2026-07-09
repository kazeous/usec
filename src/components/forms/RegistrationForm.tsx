"use client";

import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { CaptchaPlaceholder } from "@/components/forms/CaptchaPlaceholder";
import { gameConfigs } from "@/lib/game-config";
import type { Game } from "@/lib/types";

type RegistrationSetting = {
  game: Game;
  isOpen: boolean;
  message?: string | null;
};

type TeammateDraft = {
  fullName: string;
  studentId: string;
  universityName: string;
  email: string;
  discord: string;
};

const emptyTeammate: TeammateDraft = {
  fullName: "",
  studentId: "",
  universityName: "",
  email: "",
  discord: ""
};

export function RegistrationForm({ settings }: { settings: RegistrationSetting[] }) {
  const [game, setGame] = useState<Game>("valorant");
  const [mode, setMode] = useState<"solo" | "team">("team");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [teammates, setTeammates] = useState<TeammateDraft[]>(Array.from({ length: 4 }, () => ({ ...emptyTeammate })));

  const currentSetting = settings.find((item) => item.game === game);
  const teammateSlots = Math.max(0, gameConfigs[game].teamSize - 1);

  const visibleTeammates = useMemo(() => {
    if (mode === "solo") {
      return [];
    }

    return Array.from({ length: teammateSlots }, (_, index) => teammates[index] ?? { ...emptyTeammate });
  }, [mode, teammateSlots, teammates]);

  function updateTeammate(index: number, field: keyof TeammateDraft, value: string) {
    setTeammates((current) => {
      const next = [...current];
      next[index] = { ...(next[index] ?? emptyTeammate), [field]: value };
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      game,
      mode,
      studentId: String(formData.get("studentId") ?? ""),
      universityName: String(formData.get("universityName") ?? ""),
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      discord: String(formData.get("discord") ?? ""),
      teamName: String(formData.get("teamName") ?? ""),
      teammates: mode === "team" ? visibleTeammates : [],
      captchaToken: "placeholder-accepted"
    };

    const response = await fetch("/api/registration", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      setStatus("error");
      setMessage(result.error ?? "Registration could not be submitted.");
      return;
    }

    event.currentTarget.reset();
    setStatus("success");
    setMessage("Registration submitted. Staff will review it soon.");
  }

  return (
    <form className="panel grid gap-5 p-5" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <label className="text-sm font-bold" htmlFor="game">
          Game
        </label>
        <select id="game" className="field" value={game} onChange={(event) => setGame(event.target.value as Game)}>
          {Object.entries(gameConfigs).map(([key, config]) => (
            <option key={key} value={key}>
              {config.label}
            </option>
          ))}
        </select>
        <p className="text-sm muted">{currentSetting?.message ?? "Staff has not published a registration message."}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          className={mode === "team" ? "button button-primary" : "button button-secondary"}
          type="button"
          onClick={() => setMode("team")}
        >
          Team registration
        </button>
        <button
          className={mode === "solo" ? "button button-primary" : "button button-secondary"}
          type="button"
          onClick={() => setMode("solo")}
        >
          Solo player
        </button>
      </div>

      {mode === "team" ? (
        <div className="grid gap-2">
          <label className="text-sm font-bold" htmlFor="teamName">
            Team name
          </label>
          <input className="field" id="teamName" name="teamName" placeholder="Campus Five" />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field id="fullName" label={mode === "team" ? "Captain full name" : "Full name"} />
        <Field id="studentId" label="Student ID" />
        <Field id="universityName" label="University name" />
        <Field id="email" label="Email" type="email" />
        <Field id="discord" label="Discord or contact handle" required={false} />
      </div>

      {visibleTeammates.length > 0 ? (
        <section className="grid gap-4">
          <div>
            <h2 className="text-lg font-black">Teammates</h2>
            <p className="text-sm muted">
              Add {teammateSlots} teammates so the submitted roster has exactly {gameConfigs[game].teamSize} players.
            </p>
          </div>
          {visibleTeammates.map((teammate, index) => (
            <div key={index} className="grid gap-3 rounded-md border border-[#ded7ca] bg-[#fffdf8] p-4 md:grid-cols-2">
              <p className="md:col-span-2 text-sm font-black">Player {index + 2}</p>
              <input className="field" placeholder="Full name" value={teammate.fullName} onChange={(event) => updateTeammate(index, "fullName", event.target.value)} />
              <input className="field" placeholder="Student ID" value={teammate.studentId} onChange={(event) => updateTeammate(index, "studentId", event.target.value)} />
              <input className="field" placeholder="University name" value={teammate.universityName} onChange={(event) => updateTeammate(index, "universityName", event.target.value)} />
              <input className="field" placeholder="Email" type="email" value={teammate.email} onChange={(event) => updateTeammate(index, "email", event.target.value)} />
              <input className="field md:col-span-2" placeholder="Discord/contact handle" value={teammate.discord} onChange={(event) => updateTeammate(index, "discord", event.target.value)} />
            </div>
          ))}
        </section>
      ) : null}

      <CaptchaPlaceholder />

      {!currentSetting?.isOpen ? (
        <p className="rounded-md border border-[#d8a531] bg-[#fff4d5] p-3 text-sm font-bold text-[#6d4a00]">
          Public registration for this game is currently closed.
        </p>
      ) : null}

      {message ? (
        <p className={status === "error" ? "rounded-md bg-[#ffe5e1] p-3 text-sm font-bold text-[#8f2016]" : "rounded-md bg-[#e6f7ef] p-3 text-sm font-bold text-[#17613f]"}>
          {message}
        </p>
      ) : null}

      <button className="button button-primary w-full sm:w-fit" type="submit" disabled={!currentSetting?.isOpen || status === "loading"}>
        <Send size={16} aria-hidden />
        {status === "loading" ? "Submitting" : "Submit registration"}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  type = "text",
  required = true
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-bold" htmlFor={id}>
        {label}
      </label>
      <input className="field" id={id} name={id} type={type} required={required} />
    </div>
  );
}
