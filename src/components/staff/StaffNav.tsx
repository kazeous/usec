import Link from "next/link";
import Image from "next/image";
import { ClipboardList, LogOut, ShieldCheck, Swords, Trophy } from "lucide-react";

export function StaffNav({ role }: { name: string; role: "staff" | "admin" }) {
  return (
    <header className="border-b border-[#ded7ca] bg-[#151515] text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/staff" className="flex items-center gap-3 font-black">
          <span className="grid size-12 place-items-center rounded-md border border-white/20 bg-white p-1">
            <Image className="size-full object-contain" src="/logoclb.png" alt="USEC logo" width={48} height={48} />
          </span>
          <span>Staff dashboard</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <Link className="button border-white/20 bg-white/10 text-white" href="/staff/registrations">
            <ClipboardList size={16} aria-hidden />
            Registrations
          </Link>
          <Link className="button border-white/20 bg-white/10 text-white" href="/staff/tournaments">
            <Trophy size={16} aria-hidden />
            Tournaments
          </Link>
          {role === "admin" ? <Link className="button border-white/20 bg-white/10 text-white" href="/staff/accounts"><ShieldCheck size={16} aria-hidden />Accounts</Link> : null}
          <Link className="button border-white/20 bg-white/10 text-white" href="/tournaments">
            <Swords size={16} aria-hidden />
            Public
          </Link>
          <form action="/api/auth/logout" method="post">
            <button className="button border-white/20 bg-white/10 text-white" type="submit">
              <LogOut size={16} aria-hidden />
              Logout
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
