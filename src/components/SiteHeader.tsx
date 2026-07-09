import Link from "next/link";
import { CalendarDays, ClipboardList, Shield } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="border-b border-[#ded7ca] bg-[#fffdf8]/88 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 font-black">
          <span className="grid size-10 place-items-center rounded-md bg-ink text-sm text-white">UE</span>
          <span>USEC</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <Link className="button button-secondary" href="/register">
            <ClipboardList size={16} aria-hidden />
            Register
          </Link>
          <Link className="button button-secondary" href="/tournaments">
            <CalendarDays size={16} aria-hidden />
            Tournaments
          </Link>
          <Link className="button button-primary" href="/staff">
            <Shield size={16} aria-hidden />
            Staff
          </Link>
        </nav>
      </div>
    </header>
  );
}
