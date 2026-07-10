import Link from "next/link";
import { ArrowRight, Brackets, ClipboardList, Map } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { GameBadge } from "@/components/GameBadge";
import { StatusPill } from "@/components/StatusPill";
import { getPublicTournaments } from "@/lib/data";
import { formatTournamentFormat } from "@/lib/game-config";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const tournaments = await getPublicTournaments();
  const featured = tournaments[0];

  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-[#ded7ca]">
          <div className="absolute inset-0 bg-[url('/images/arena-hero.png')] bg-cover bg-center opacity-20" />
          <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.1fr_0.9fr] lg:px-8">
            <div className="flex min-h-[28rem] flex-col justify-center">
              <p className="mb-3 text-sm font-black uppercase text-cobalt">University Esports Club</p>
              <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-6xl">
                Register, seed, play, veto, and report matches in one club hub.
              </h1>
              <p className="mt-5 max-w-2xl text-lg muted">
                Built for Valorant, CS2, and LoL events with staff-controlled registration and brackets students can follow.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link className="button button-primary" href="/register">
                  <ClipboardList size={18} aria-hidden />
                  Register now
                </Link>
                <Link className="button button-secondary" href="/tournaments">
                  <Brackets size={18} aria-hidden />
                  View brackets
                </Link>
              </div>
            </div>
            <aside className="panel self-end p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-black">{featured?.title ?? "Upcoming event"}</h2>
                {featured ? <GameBadge game={featured.game} /> : null}
              </div>
              {featured ? (
                <div className="mt-5 grid gap-4">
                  <div className="flex flex-wrap gap-2">
                    <StatusPill value={featured.status} />
                    <span className="rounded-full border border-[#cfc6b8] px-2.5 py-1 text-xs font-bold">
                      {formatTournamentFormat(featured.format)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <Metric value={featured.entries.length} label="Teams" />
                    <Metric value={featured.matches.length} label="Matches" />
                    <Metric value={featured.registrationOpen ? "Open" : "Closed"} label="Reg" />
                  </div>
                  <Link className="button button-secondary" href={`/tournaments/${featured.id}`}>
                    Open event
                    <ArrowRight size={16} aria-hidden />
                  </Link>
                </div>
              ) : (
                <p className="mt-4 muted">No tournaments have been published yet.</p>
              )}
            </aside>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-3 lg:px-8">
          <Feature icon={<ClipboardList size={20} aria-hidden />} title="Event registration" text="Tournament-specific team and solo registration includes normalized student rosters and Turnstile protection." />
          <Feature icon={<Brackets size={20} aria-hidden />} title="Auto brackets" text="Single elimination, double elimination, round robin, and Swiss generators are wired into staff workflows." />
          <Feature icon={<Map size={20} aria-hidden />} title="Map veto" text="Valorant and CS2 matches can run turn-based veto sessions with polling-based public updates." />
        </section>
      </main>
    </>
  );
}

function Metric({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-md border border-[#ded7ca] bg-[#fffdf8] p-3">
      <p className="text-xl font-black">{value}</p>
      <p className="text-xs font-bold uppercase muted">{label}</p>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <article className="panel p-5">
      <div className="mb-4 grid size-10 place-items-center rounded-md bg-[#151515] text-white">{icon}</div>
      <h2 className="text-lg font-black">{title}</h2>
      <p className="mt-2 text-sm muted">{text}</p>
    </article>
  );
}
