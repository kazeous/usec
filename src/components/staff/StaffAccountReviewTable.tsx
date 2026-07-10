"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

type Application = {
  id: string;
  name: string;
  email: string;
  studentId: string | null;
  universityName: string | null;
  applicationReason: string | null;
  applicationSubmittedAt: string | null;
  accountStatus: "pending" | "approved" | "rejected";
  reviews: Array<{
    id: string;
    action: "approved" | "rejected";
    note: string | null;
    createdAt: string;
    reviewer: { id: string; name: string };
  }>;
};

export function StaffAccountReviewTable({ applications }: { applications: Application[] }) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function review(userId: string, action: "approve" | "reject") {
    setBusyId(userId);
    setMessage("");
    const response = await fetch("/api/staff/accounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action, reviewNote: notes[userId] || undefined })
    });
    const result = await response.json().catch(() => ({}));
    setBusyId(null);
    setMessage(response.ok ? `Application ${action === "approve" ? "approved" : "rejected"}.` : result.error ?? "Could not review application.");
    if (response.ok) window.location.reload();
  }

  return (
    <section className="panel p-5">
      <div className="mb-4">
        <h2 className="text-xl font-black">Staff applications</h2>
        <p className="text-sm muted">Pending applications require a manual decision. Review notes remain internal.</p>
      </div>
      <div className="grid gap-4">
        {applications.map((application) => (
          <article className="rounded-md border border-[#ded7ca] bg-[#fffdf8] p-4" key={application.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-black">{application.name}</h3>
                <p className="text-sm muted">{application.studentId} · {application.universityName}</p>
                <p className="text-sm muted">{application.email}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-black uppercase ${application.accountStatus === "pending" ? "bg-[#fff0bd] text-[#765600]" : "bg-[#ffe5e1] text-[#8f2016]"}`}>{application.accountStatus}</span>
            </div>
            <div className="mt-4 rounded-md border border-[#e5ddd1] p-3">
              <p className="text-xs font-black uppercase muted">Application reason</p>
              <p className="mt-1 text-sm">{application.applicationReason}</p>
            </div>
            <p className="mt-3 text-xs muted">Submitted {application.applicationSubmittedAt ? new Date(application.applicationSubmittedAt).toLocaleString() : "—"}</p>
            {application.accountStatus === "pending" ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <input className="field basis-full" maxLength={500} placeholder="Internal review note (optional)" value={notes[application.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [application.id]: event.target.value }))} />
                <button className="button button-primary" type="button" disabled={busyId === application.id} onClick={() => review(application.id, "approve")}><Check size={16} aria-hidden />Approve</button>
                <button className="button button-danger" type="button" disabled={busyId === application.id} onClick={() => review(application.id, "reject")}><X size={16} aria-hidden />Reject</button>
              </div>
            ) : null}
            {application.reviews.length ? (
              <details className="mt-4 text-sm">
                <summary className="cursor-pointer font-bold">Review history ({application.reviews.length})</summary>
                <div className="mt-2 grid gap-2">
                  {application.reviews.map((review) => <p className="rounded-md bg-[#f0ebe3] p-2" key={review.id}><span className="font-bold capitalize">{review.action}</span> by {review.reviewer.name} · {new Date(review.createdAt).toLocaleString()}{review.note ? ` · ${review.note}` : ""}</p>)}
                </div>
              </details>
            ) : null}
          </article>
        ))}
      </div>
      {!applications.length ? <p className="text-sm muted">No pending or rejected applications.</p> : null}
      {message ? <p className="mt-4 text-sm font-bold muted">{message}</p> : null}
    </section>
  );
}
