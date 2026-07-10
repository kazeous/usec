import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { RegistrationForm } from "@/components/forms/RegistrationForm";
import { getOpenRegistrationTournaments } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ tournament?: string }> }) {
  const [tournaments, query] = await Promise.all([getOpenRegistrationTournaments(), searchParams]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link className="mb-6 inline-flex items-center gap-2 text-sm font-bold muted" href="/">
          <ArrowLeft size={16} aria-hidden />
          Home
        </Link>
        <div className="mb-6">
          <h1 className="text-4xl font-black">Player and team registration</h1>
          <p className="mt-2 max-w-2xl muted">
            Submit your student details and roster for staff review. Each tournament controls its own registration window.
          </p>
        </div>
        <RegistrationForm tournaments={tournaments} initialTournamentId={query.tournament} />
      </main>
    </>
  );
}
