"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

type VetoPayload = {
  status: string;
  mapPool: string[];
  actions: Array<{
    action: string;
    mapName: string;
    order: number;
    actorTeamId?: string | null;
  }>;
  nextStep?: {
    team: string;
    action: string;
  } | null;
};

export function VetoViewer({ matchId, initial }: { matchId: string; initial?: VetoPayload | null }) {
  const [veto, setVeto] = useState<VetoPayload | null>(initial ?? null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const response = await fetch(`/api/matches/${matchId}/veto`, {
        cache: "no-store"
      });

      if (!active || !response.ok) {
        return;
      }

      setVeto(await response.json());
      setUpdatedAt(new Date());
    }

    void load();
    const interval = window.setInterval(load, 7000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [matchId]);

  if (!veto) {
    return (
      <div className="panel p-5">
        <p className="font-bold">No veto session exists for this match yet.</p>
        <p className="text-sm muted">Staff can start one from the match management page.</p>
      </div>
    );
  }

  const usedMaps = new Set(veto.actions.map((action) => action.mapName));

  return (
    <section className="panel grid gap-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Map veto</h1>
          <p className="text-sm muted">
            {veto.nextStep ? `${veto.nextStep.team} to ${veto.nextStep.action}` : "Veto complete"}
          </p>
        </div>
        <span className="inline-flex items-center gap-2 text-sm font-bold muted">
          <RefreshCw size={14} aria-hidden />
          {updatedAt ? updatedAt.toLocaleTimeString() : "Polling"}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {veto.mapPool.map((mapName) => (
          <div className="rounded-md border border-[#ded7ca] bg-[#fffdf8] p-3" key={mapName}>
            <p className="font-black">{mapName}</p>
            <p className="text-sm muted">{usedMaps.has(mapName) ? "Used" : "Available"}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-2">
        {veto.actions.map((action) => (
          <div className="flex items-center justify-between gap-3 rounded-md border border-[#ded7ca] bg-[#fffdf8] px-3 py-2" key={action.order}>
            <span className="font-bold capitalize">
              {action.order}. {action.action}
            </span>
            <span>{action.mapName}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
