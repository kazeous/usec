"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { gameConfigs } from "@/lib/game-config";
import { tournamentFormats } from "@/lib/types";

export function TournamentCreateForm() {
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/staff/tournaments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: formData.get("title"),
        game: formData.get("game"),
        format: formData.get("format"),
        registrationOpen: formData.get("registrationOpen") === "on",
        registrationMessage: formData.get("registrationMessage"),
        startsAt: formData.get("startsAt") ? new Date(String(formData.get("startsAt"))).toISOString() : null,
        registrationClosesAt: formData.get("registrationClosesAt") ? new Date(String(formData.get("registrationClosesAt"))).toISOString() : null,
        swissRounds: formData.get("format") === "swiss" ? Number(formData.get("swissRounds") || 3) : null
      })
    });

    const result = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Tournament created." : result.error ?? "Could not create tournament.");
    if (response.ok) {
      event.currentTarget.reset();
    }
  }

  return (
    <form className="panel grid gap-4 p-5" onSubmit={handleSubmit}>
      <h2 className="text-xl font-black">Create tournament</h2>
      <input className="field" name="title" placeholder="Spring CS2 Cup" required />
      <input className="field" name="registrationMessage" placeholder="Registration message" />
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold">Starts at<input className="field" name="startsAt" type="datetime-local" /></label>
        <label className="grid gap-2 text-sm font-bold">Registration closes<input className="field" name="registrationClosesAt" type="datetime-local" /></label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <select className="field" name="game" defaultValue="valorant">
          {Object.entries(gameConfigs).map(([key, config]) => (
            <option key={key} value={key}>
              {config.label}
            </option>
          ))}
        </select>
        <select className="field" name="format" defaultValue="single_elimination">
          {tournamentFormats.map((format) => (
            <option key={format} value={format}>
              {format.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>
      <label className="grid gap-2 text-sm font-bold">Swiss rounds<input className="field" min={3} max={7} name="swissRounds" type="number" defaultValue={3} /></label>
      <label className="flex items-center gap-2 text-sm font-bold">
        <input name="registrationOpen" type="checkbox" />
        Open tournament registration
      </label>
      {message ? <p className="text-sm font-bold muted">{message}</p> : null}
      <button className="button button-primary w-fit" type="submit">
        <Plus size={16} aria-hidden />
        Create
      </button>
    </form>
  );
}
