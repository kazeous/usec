import Link from "next/link";
import { ClipboardList, ShieldCheck, Swords, Trophy, Users } from "lucide-react";
import { StaffNav } from "@/components/staff/StaffNav";
import { getStaffStats } from "@/lib/data";
import { requireStaff } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StaffDashboardPage() {
  const staff = await requireStaff();
  const stats = await getStaffStats();

  return (
    <>
      <StaffNav name={staff.name} role={staff.role} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-4xl font-black">Staff dashboard</h1>
          <p className="mt-2 muted">Manage registration windows, approvals, brackets, match results, and veto sessions.</p>
        </div>
        <div className={`grid gap-4 ${staff.role === "admin" ? "md:grid-cols-5" : "md:grid-cols-4"}`}>
          <Stat icon={<Users size={20} aria-hidden />} label="Registrations" value={stats.registrations} />
          <Stat icon={<ClipboardList size={20} aria-hidden />} label="Pending" value={stats.pending} />
          <Stat icon={<Trophy size={20} aria-hidden />} label="Tournaments" value={stats.tournaments} />
          <Stat icon={<Swords size={20} aria-hidden />} label="Active matches" value={stats.liveMatches} />
          {staff.role === "admin" ? <Stat icon={<ShieldCheck size={20} aria-hidden />} label="Staff applications" value={stats.staffApplications} /> : null}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Link className="panel p-5 transition hover:border-[#335cba]" href="/staff/registrations">
            <h2 className="text-xl font-black">Review registrations</h2>
            <p className="mt-2 muted">Approve or reject submitted rosters and control public form availability.</p>
          </Link>
          <Link className="panel p-5 transition hover:border-[#335cba]" href="/staff/tournaments">
            <h2 className="text-xl font-black">Organize tournaments</h2>
            <p className="mt-2 muted">{staff.role === "admin" ? "Create events, generate brackets, and open match management tools." : "Open brackets and match-day score or veto tools."}</p>
          </Link>
          {staff.role === "admin" ? <Link className="panel p-5 transition hover:border-[#335cba]" href="/staff/accounts"><h2 className="text-xl font-black">Review staff applications</h2><p className="mt-2 muted">Approve or reject public requests for staff dashboard access.</p></Link> : null}
        </div>
      </main>
    </>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="panel p-4">
      <div className="mb-4 grid size-10 place-items-center rounded-md bg-[#151515] text-white">{icon}</div>
      <p className="text-3xl font-black">{value}</p>
      <p className="text-sm font-bold muted">{label}</p>
    </div>
  );
}
