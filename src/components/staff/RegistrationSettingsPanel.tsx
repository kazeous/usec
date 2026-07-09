"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { formatGame } from "@/lib/game-config";
import type { Game } from "@/lib/types";

type Setting = {
  game: Game;
  isOpen: boolean;
  message?: string | null;
};

export function RegistrationSettingsPanel({ settings }: { settings: Setting[] }) {
  const [items, setItems] = useState(settings);
  const [message, setMessage] = useState("");

  async function save(game: Game) {
    const item = items.find((setting) => setting.game === game);
    if (!item) {
      return;
    }

    const response = await fetch("/api/staff/registration-settings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(item)
    });

    setMessage(response.ok ? "Registration settings saved." : "Could not save settings.");
  }

  return (
    <section className="panel grid gap-4 p-5">
      <div>
        <h2 className="text-xl font-black">Registration windows</h2>
        <p className="text-sm muted">Open or close the public form per game.</p>
      </div>
      <div className="grid gap-3">
        {items.map((setting) => (
          <div className="grid gap-3 rounded-md border border-[#ded7ca] bg-[#fffdf8] p-3 md:grid-cols-[12rem_1fr_auto]" key={setting.game}>
            <label className="flex items-center gap-3 font-bold">
              <input
                checked={setting.isOpen}
                type="checkbox"
                onChange={(event) =>
                  setItems((current) =>
                    current.map((item) => (item.game === setting.game ? { ...item, isOpen: event.target.checked } : item))
                  )
                }
              />
              {formatGame(setting.game)}
            </label>
            <input
              className="field"
              value={setting.message ?? ""}
              onChange={(event) =>
                setItems((current) =>
                  current.map((item) => (item.game === setting.game ? { ...item, message: event.target.value } : item))
                )
              }
            />
            <button className="button button-secondary" type="button" onClick={() => save(setting.game)}>
              <Save size={16} aria-hidden />
              Save
            </button>
          </div>
        ))}
      </div>
      {message ? <p className="text-sm font-bold muted">{message}</p> : null}
    </section>
  );
}
