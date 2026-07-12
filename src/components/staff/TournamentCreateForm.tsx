"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { gameConfigs } from "@/lib/game-config";
import { tournamentFormats, type Game, type LocationMode, type ParticipationFormat, type TftFinalMode, type TournamentFormat } from "@/lib/types";

export function TournamentCreateForm() {
  const [message, setMessage] = useState("");
  const [format, setFormat] = useState<TournamentFormat>("single_elimination");
  const [game, setGame] = useState<Game>("valorant");
  const [tftFinalMode, setTftFinalMode] = useState<TftFinalMode>("fixed_games");
  const [locationMode, setLocationMode] = useState<LocationMode>("offline");
  const [participationFormat, setParticipationFormat] = useState<ParticipationFormat>("five_v_five");
  const compatibleFormats = tournamentFormats.filter((option) => game === "tft" ? option === "tft_lobby" : option !== "tft_lobby");

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
        format,
        registrationOpen: formData.get("registrationOpen") === "on",
        registrationMessage: formData.get("registrationMessage"),
        venue: formData.get("venue") || null,
        locationMode,
        participationFormat,
        startsAt: formData.get("startsAt") ? new Date(String(formData.get("startsAt"))).toISOString() : null,
        registrationClosesAt: formData.get("registrationClosesAt") ? new Date(String(formData.get("registrationClosesAt"))).toISOString() : null,
        swissRounds: format === "swiss" ? Number(formData.get("swissRounds") || 3) : null,
        tftFinalMode: game === "tft" ? tftFinalMode : null
      })
    });

    const result = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Tournament created." : result.error ?? "Could not create tournament.");
    if (response.ok) {
      event.currentTarget.reset();
      setFormat("single_elimination");
      setGame("valorant");
      setTftFinalMode("fixed_games");
      setLocationMode("offline");
      setParticipationFormat("five_v_five");
    }
  }

  return (
    <form className="panel grid gap-4 p-5" onSubmit={handleSubmit}>
      <h2 className="text-xl font-black">Create tournament</h2>
      <input className="field" name="title" placeholder="Spring CS2 Cup" required />
      <input className="field" name="registrationMessage" placeholder="Registration message" />
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold">Place<select className="field" value={locationMode} onChange={(event) => setLocationMode(event.target.value as LocationMode)}><option value="offline">Offline</option><option value="online">Online</option></select></label>
        <label className="grid gap-2 text-sm font-bold">Participation format<select className="field" value={participationFormat} disabled={game === "tft"} onChange={(event) => setParticipationFormat(event.target.value as ParticipationFormat)}>{game === "tft" ? <option value="tft">TFT</option> : <><option value="five_v_five">5v5</option><option value="one_v_one">1v1</option></>}</select></label>
      </div>
      <input className="field" name="venue" placeholder={locationMode === "online" ? "Platform or server details (optional)" : "Venue or address (optional)"} />
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold">Starts at<input className="field" name="startsAt" type="datetime-local" /></label>
        <label className="grid gap-2 text-sm font-bold">Registration closes<input className="field" name="registrationClosesAt" type="datetime-local" /></label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold">
          Game
          <select className="field" name="game" value={game} onChange={(event) => { const next = event.target.value as Game; setGame(next); setFormat(next === "tft" ? "tft_lobby" : format === "tft_lobby" ? "single_elimination" : format); setParticipationFormat(next === "tft" ? "tft" : participationFormat === "tft" ? "five_v_five" : participationFormat); }}>
            {Object.entries(gameConfigs).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Format
          <select className="field" name="format" value={format} onChange={(event) => setFormat(event.target.value as TournamentFormat)}>
            {compatibleFormats.map((option) => (
              <option key={option} value={option}>
                {option.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
      </div>
      {format === "swiss" ? (
        <label className="grid gap-2 text-sm font-bold">
          Swiss rounds
          <input className="field" min={3} max={7} name="swissRounds" type="number" defaultValue={3} required />
        </label>
      ) : null}
      {format === "tft_lobby" ? <label className="grid gap-2 text-sm font-bold">Final format<select className="field" value={tftFinalMode} onChange={(event) => setTftFinalMode(event.target.value as TftFinalMode)}><option value="fixed_games">Fixed six games</option><option value="checkmate">20-point checkmate (maximum eight games)</option></select></label> : null}
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
