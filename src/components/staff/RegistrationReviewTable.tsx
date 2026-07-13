"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Check, Link2, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { StatusPill } from "@/components/StatusPill";
import { gameConfigs } from "@/lib/game-config";
import { registrationPageSizes, type RegistrationPageSize, type RegistrationStatusFilter } from "@/lib/registrations/query";
import { games, type Game, type RegistrationStatus } from "@/lib/types";

type TeamOption = { id: string; name: string; game: string };
type RegistrationItem = {
  id: string;
  game: Game;
  mode: "solo" | "team";
  status: RegistrationStatus;
  teamName?: string | null;
  reviewNote?: string | null;
  tournament: { id: string; title: string; participationFormat: "five_v_five" | "one_v_one" | "tft" };
  resolvedTeam?: { id: string; name: string } | null;
  members: Array<{ fullName: string; inGameName: string; studentId: string; universityName: string; email: string | null; isCaptain: boolean; isReserve: boolean }>;
};

type BulkResult = { succeeded?: string[]; failed?: Array<{ registrationId: string; error: string }>; error?: string };

const statusRank: Record<RegistrationStatus, number> = { pending: 0, approved: 1, rejected: 2 };

type RegistrationReviewTableProps = {
  registrations: RegistrationItem[];
  teams: TeamOption[];
  filters: { game: Game | "all"; status: RegistrationStatusFilter };
  pagination: { page: number; pageSize: RegistrationPageSize; total: number; totalPages: number };
};

export function RegistrationReviewTable({ registrations, teams, filters, pagination }: RegistrationReviewTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const registrationsRef = useRef(registrations);
  const [items, setItems] = useState(registrations);
  const [selectedTeams, setSelectedTeams] = useState<Record<string, string>>({});
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isNavigating, startNavigation] = useTransition();

  useEffect(() => {
    if (registrationsRef.current === registrations) return;
    registrationsRef.current = registrations;
    setItems(registrations);
    setSelectedIds((current) => current.filter((id) => registrations.some((item) => item.id === id && item.status === "pending")));
  }, [registrations]);

  const groupedItems = useMemo(() => games.map((game) => ({
    game,
    items: items
      .filter((item) => item.game === game && (filters.status === "all" || item.status === filters.status))
      .sort((left, right) => statusRank[left.status] - statusRank[right.status] || left.tournament.title.localeCompare(right.tournament.title))
  })).filter((group) => group.items.length > 0), [filters.status, items]);

  const selectedSet = new Set(selectedIds);
  const visiblePendingIds = groupedItems.flatMap((group) => group.items.filter((item) => item.status === "pending").map((item) => item.id));
  const selectedPendingIds = selectedIds.filter((id) => items.some((item) => item.id === id && item.status === "pending"));

  function changeQuery(changes: Record<string, string | number>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) params.set(key, String(value));
    startNavigation(() => router.replace(`${pathname}?${params.toString()}`));
  }

  function addSelection(ids: string[]) {
    setSelectedIds((current) => [...new Set([...current, ...ids])].slice(0, 200));
  }

  function toggleSelection(id: string, checked: boolean) {
    setSelectedIds((current) => checked ? [...new Set([...current, id])].slice(0, 200) : current.filter((item) => item !== id));
  }

  function toggleGroup(ids: string[], checked: boolean) {
    if (checked) addSelection(ids);
    else setSelectedIds((current) => current.filter((id) => !ids.includes(id)));
  }

  async function review(registrationId: string, action: "reject" | "approve_new" | "approve_link") {
    setBusyId(registrationId);
    setMessage("");
    try {
      const response = await fetch("/api/staff/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, action, teamId: selectedTeams[registrationId] || undefined, reviewNote: reviewNotes[registrationId] || undefined })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? "Could not update registration.");
      const nextStatus = action === "reject" ? "rejected" : "approved";
      setItems((current) => current.map((item) => item.id === registrationId ? { ...item, status: nextStatus } : item));
      setSelectedIds((current) => current.filter((id) => id !== registrationId));
      setMessage("Registration updated.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update registration.");
    } finally {
      setBusyId(null);
    }
  }

  async function bulkReview(action: "reject" | "approve_new") {
    if (!selectedPendingIds.length) return;
    const verb = action === "reject" ? "reject" : "approve";
    if (!window.confirm(`${verb === "approve" ? "Approve" : "Reject"} ${selectedPendingIds.length} selected registrations?`)) return;

    setBulkBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/staff/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationIds: selectedPendingIds, action })
      });
      const result = await response.json().catch(() => ({})) as BulkResult;
      if (!response.ok) throw new Error(result.error ?? "Could not update registrations.");

      const succeeded = result.succeeded ?? [];
      const failed = result.failed ?? [];
      const succeededSet = new Set(succeeded);
      const nextStatus = action === "reject" ? "rejected" : "approved";
      setItems((current) => current.map((item) => succeededSet.has(item.id) ? { ...item, status: nextStatus } : item));
      setSelectedIds(failed.map((item) => item.registrationId));
      setMessage(`${verb === "approve" ? "Approved" : "Rejected"} ${succeeded.length} registration${succeeded.length === 1 ? "" : "s"}.${failed.length ? ` ${failed.length} failed and remain selected: ${failed[0].error}` : ""}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update registrations.");
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <section className="panel p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div><h2 className="text-xl font-black">Registration review</h2><p className="text-sm muted">Registrations are grouped by game. Bulk actions apply to pending submissions selected on this page.</p></div>
        <div className="flex flex-wrap gap-2">
          <label className="grid gap-1 text-xs font-bold">Game
            <select className="field min-w-40" aria-label="Filter registrations by game" value={filters.game} disabled={isNavigating} onChange={(event) => changeQuery({ game: event.target.value, page: 1 })}>
              <option value="all">All games</option>
              {games.map((game) => <option key={game} value={game}>{gameConfigs[game].label}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-bold">Status
            <select className="field min-w-36" aria-label="Filter registrations by status" value={filters.status} disabled={isNavigating} onChange={(event) => changeQuery({ status: event.target.value, page: 1 })}>
              <option value="pending">Pending</option>
              <option value="all">All statuses</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-bold">Per page
            <select className="field min-w-24" aria-label="Registrations per page" value={pagination.pageSize} disabled={isNavigating} onChange={(event) => changeQuery({ pageSize: event.target.value, page: 1 })}>
              {registrationPageSizes.map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
        </div>
      </div>

      {visiblePendingIds.length ? (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-md border border-[#b9c9ee] bg-[#edf3ff] p-3">
          <label className="flex items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={visiblePendingIds.length <= 200 && visiblePendingIds.every((id) => selectedSet.has(id))}
              onChange={(event) => toggleGroup(visiblePendingIds, event.target.checked)}
            />
            Select pending shown{visiblePendingIds.length > 200 ? " (first 200)" : ""}
          </label>
          <span className="text-sm muted">{selectedPendingIds.length} selected</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <button className="button button-primary" type="button" disabled={!selectedPendingIds.length || bulkBusy} onClick={() => void bulkReview("approve_new")}><Check size={16} aria-hidden />{bulkBusy ? "Working…" : `Approve selected (${selectedPendingIds.length})`}</button>
            <button className="button button-danger" type="button" disabled={!selectedPendingIds.length || bulkBusy} onClick={() => void bulkReview("reject")}><X size={16} aria-hidden />Reject selected</button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6">
        {groupedItems.map((group) => {
          const pendingIds = group.items.filter((item) => item.status === "pending").map((item) => item.id);
          const allPendingSelected = pendingIds.length > 0 && pendingIds.every((id) => selectedSet.has(id));
          return (
            <section className="grid gap-3" key={group.game} aria-labelledby={`registrations-${group.game}`}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ded7ca] pb-2">
                <div className="flex items-baseline gap-2"><h3 className="text-lg font-black" id={`registrations-${group.game}`}>{gameConfigs[group.game].label}</h3><span className="text-sm muted">{group.items.length} shown</span></div>
                {pendingIds.length ? <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" aria-label={`Select all pending ${gameConfigs[group.game].label} registrations`} checked={allPendingSelected} onChange={(event) => toggleGroup(pendingIds, event.target.checked)} />Select this game</label> : null}
              </div>

              {group.items.map((registration) => {
                const compatibleTeams = teams.filter((team) => team.game === registration.game);
                const isBusy = bulkBusy || busyId === registration.id;
                return (
                  <article className="rounded-md border border-[#ded7ca] bg-[#fffdf8] p-4" key={registration.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {registration.status === "pending" ? <input className="mt-1" type="checkbox" aria-label={`Select ${registration.teamName ?? registration.members[0]?.fullName ?? "registration"}`} checked={selectedSet.has(registration.id)} disabled={bulkBusy} onChange={(event) => toggleSelection(registration.id, event.target.checked)} /> : null}
                        <div><p className="font-black">{registration.teamName ?? registration.members[0]?.fullName ?? "Registration"}</p><p className="text-sm muted">{registration.tournament.title} · {gameConfigs[registration.game].shortLabel} · {registration.mode}</p></div>
                      </div>
                      <StatusPill value={registration.status} />
                    </div>
                    <div className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                      {registration.members.map((member) => <p key={member.studentId}><span className="font-bold">{member.fullName}</span>{member.isCaptain ? " (Captain)" : member.isReserve ? " (Reserve)" : ""} · {member.inGameName} · {member.studentId}{member.email ? ` · ${member.email}` : ""}</p>)}
                    </div>
                    {registration.status === "pending" ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <input className="field basis-full" placeholder="Review note (shown in the registration record)" value={reviewNotes[registration.id] ?? ""} disabled={isBusy} onChange={(event) => setReviewNotes((current) => ({ ...current, [registration.id]: event.target.value }))} />
                        <button className="button button-primary" type="button" disabled={isBusy} onClick={() => void review(registration.id, "approve_new")}><Check size={16} aria-hidden />{registration.tournament.participationFormat !== "five_v_five" ? "Approve and enroll player" : registration.mode === "solo" ? "Approve to solo pool" : "Approve as new team"}</button>
                        {registration.mode === "team" && compatibleTeams.length ? (
                          <><select className="field max-w-xs" value={selectedTeams[registration.id] ?? ""} disabled={isBusy} onChange={(event) => setSelectedTeams((current) => ({ ...current, [registration.id]: event.target.value }))}><option value="">Existing team…</option>{compatibleTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select><button className="button button-secondary" type="button" disabled={isBusy || !selectedTeams[registration.id]} onClick={() => void review(registration.id, "approve_link")}><Link2 size={16} aria-hidden />Link and enroll</button></>
                        ) : null}
                        <button className="button button-danger" type="button" disabled={isBusy} onClick={() => void review(registration.id, "reject")}><X size={16} aria-hidden />Reject</button>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>
      {!groupedItems.length ? <p className="text-sm muted">No registrations match these filters.</p> : null}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#ded7ca] pt-4">
        <p className="text-sm muted">Showing {pagination.total ? (pagination.page - 1) * pagination.pageSize + 1 : 0}–{Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}</p>
        <div className="flex items-center gap-2">
          <button className="button button-secondary" type="button" disabled={pagination.page <= 1 || isNavigating} onClick={() => changeQuery({ page: pagination.page - 1 })}>Previous</button>
          <span className="text-sm font-bold">Page {pagination.page} of {pagination.totalPages}</span>
          <button className="button button-secondary" type="button" disabled={pagination.page >= pagination.totalPages || isNavigating} onClick={() => changeQuery({ page: pagination.page + 1 })}>Next</button>
        </div>
      </div>
      {message ? <p className="mt-4 text-sm font-bold muted" aria-live="polite">{message}</p> : null}
    </section>
  );
}
