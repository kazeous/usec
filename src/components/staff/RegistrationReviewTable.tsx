"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { StatusPill } from "@/components/StatusPill";

type Registration = {
  id: string;
  game: string;
  mode: string;
  status: string;
  fullName: string;
  studentId: string;
  universityName: string;
  email: string;
  teamName?: string | null;
};

export function RegistrationReviewTable({ registrations }: { registrations: Registration[] }) {
  const [items, setItems] = useState(registrations);

  async function updateStatus(id: string, status: "approved" | "rejected") {
    const response = await fetch("/api/staff/registrations", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id, status })
    });

    if (response.ok) {
      setItems((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
    }
  }

  return (
    <section className="panel p-5">
      <div className="mb-4">
        <h2 className="text-xl font-black">Registration review</h2>
        <p className="text-sm muted">Approve teams and solo players before bracket generation.</p>
      </div>
      <div className="table-wrap">
        <table className="w-full min-w-[850px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#ded7ca]">
              <th className="py-3 pr-4">Name</th>
              <th className="py-3 pr-4">Game</th>
              <th className="py-3 pr-4">Team</th>
              <th className="py-3 pr-4">Student</th>
              <th className="py-3 pr-4">University</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((registration) => (
              <tr className="border-b border-[#ece3d7]" key={registration.id}>
                <td className="py-3 pr-4">
                  <p className="font-bold">{registration.fullName}</p>
                  <p className="muted">{registration.email}</p>
                </td>
                <td className="py-3 pr-4 uppercase">{registration.game}</td>
                <td className="py-3 pr-4">{registration.teamName ?? registration.mode}</td>
                <td className="py-3 pr-4">{registration.studentId}</td>
                <td className="py-3 pr-4">{registration.universityName}</td>
                <td className="py-3 pr-4">
                  <StatusPill value={registration.status} />
                </td>
                <td className="py-3 pr-4">
                  <div className="flex gap-2">
                    <button className="button button-secondary" type="button" onClick={() => updateStatus(registration.id, "approved")}>
                      <Check size={16} aria-hidden />
                      Approve
                    </button>
                    <button className="button button-danger" type="button" onClick={() => updateStatus(registration.id, "rejected")}>
                      <X size={16} aria-hidden />
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {items.length === 0 ? <p className="mt-4 text-sm muted">No registrations yet.</p> : null}
    </section>
  );
}
