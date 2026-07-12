"use client";

import { useState } from "react";
import { Save } from "lucide-react";

export function GuidelinesEditor({ initial }: { initial: { guidelines_conduct: string; guidelines_competition: string } }) {
  const [conduct, setConduct] = useState(initial.guidelines_conduct);
  const [competition, setCompetition] = useState(initial.guidelines_competition);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/staff/guidelines", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guidelines_conduct: conduct, guidelines_competition: competition }),
    });

    const result = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Guidelines saved." : result.error ?? "Could not save guidelines.");
    setSaving(false);
  }

  return (
    <form className="grid gap-6" onSubmit={handleSubmit}>
      <div className="panel grid gap-4 p-5">
        <h2 className="text-xl font-black">Code of Conduct</h2>
        <p className="text-sm muted">General behavioral rules — sportsmanship, fair play, communication standards.</p>
        <textarea
          className="field min-h-[20rem] font-mono text-sm"
          value={conduct}
          onChange={(e) => setConduct(e.target.value)}
          placeholder={"## Respect & Sportsmanship\n\n- Treat every participant with respect.\n- Win and lose gracefully.\n\n## Fair Play & Integrity\n\n- Do not use cheats or exploits.\n- Report suspected misconduct to staff."}
        />
      </div>

      <div className="panel grid gap-4 p-5">
        <h2 className="text-xl font-black">Community Competition Guidelines</h2>
        <p className="text-sm muted">Tournament-specific rules — eligibility, registration, match procedures, penalties.</p>
        <textarea
          className="field min-h-[20rem] font-mono text-sm"
          value={competition}
          onChange={(e) => setCompetition(e.target.value)}
          placeholder={"## Eligibility\n\n- Must be a currently enrolled student.\n- Each player may only register once per tournament.\n\n## Match Rules\n\n- Be online 15 minutes before scheduled time.\n- No-show results in a forfeit."}
        />
      </div>

      <div className="panel flex items-center gap-4 p-5">
        <button className="button button-primary w-fit" type="submit" disabled={saving}>
          <Save size={16} aria-hidden />
          {saving ? "Saving…" : "Save guidelines"}
        </button>
        {message ? <p className="text-sm font-bold muted">{message}</p> : null}
      </div>

      <div className="panel p-5">
        <h3 className="font-black">Formatting help</h3>
        <p className="mt-2 text-sm muted">
          Content is written in <strong>Markdown</strong>. Use <code>## Heading</code> for section titles,
          <code>- item</code> for bullet points, <code>**bold**</code> for emphasis, and blank lines to separate paragraphs.
        </p>
      </div>
    </form>
  );
}
