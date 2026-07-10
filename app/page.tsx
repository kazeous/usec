import Link from "next/link";
import { ArrowRight, Brackets, ChevronDown, ClipboardList } from "lucide-react";
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
          <div className="absolute inset-0 bg-[url('/images/esports-world-cup.jpg')] bg-cover bg-center opacity-20" />
          <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.1fr_0.9fr] lg:px-8">
            <div className="flex min-h-[28rem] flex-col justify-center">
              <p className="mb-3 text-sm font-black uppercase text-cobalt">VNU-HCMUS Esports Club</p>
              <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-6xl">
                Registration portal for USEC&apos;s tournament.
              </h1>
              <p className="mt-5 max-w-2xl text-lg muted">
                Click register for opening tournament, View brackets for yours&apos; joined match.
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

        <section id="faq" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-7 max-w-2xl">
            <p className="mb-2 text-sm font-black uppercase text-cobalt">Registration guide</p>
            <h2 className="text-3xl font-black sm:text-4xl">Frequently asked questions</h2>
            <p className="mt-3 muted">Everything you need to submit your tournament registration successfully.</p>
          </div>
          <div className="grid items-start gap-4 md:grid-cols-2">
            <FaqItem
              question="How do I register for a tournament?"
              answer="Select Register, choose an open tournament, and complete the form. You can also open a tournament first and use its Register button to preselect that event."
            />
            <FaqItem
              question="Can I register by myself or with a team?"
              answer="Yes. Choose Team registration to submit a complete roster, or Solo player to enter the solo pool. Staff can group approved solo players into a team for the event."
            />
            <FaqItem
              question="What information should I prepare?"
              answer="Have each player's full name, in-game name, student ID, university, and contact handle ready. Team captains also need an email address and a team name."
            />
            <FaqItem
              question="What happens after I submit?"
              answer="Your registration is sent to USEC staff for review. Keep an eye on the contact details you provided in case the team needs to confirm or correct any information."
            />
          </div>
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

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group panel p-5 open:border-[#335cba]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-black marker:content-none">
        {question}
        <ChevronDown className="shrink-0 transition-transform group-open:rotate-180" size={20} aria-hidden />
      </summary>
      <p className="mt-4 border-t border-[#ded7ca] pt-4 text-sm leading-6 muted">{answer}</p>
    </details>
  );
}
