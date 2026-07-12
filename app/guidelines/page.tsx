import { SiteHeader } from "@/components/SiteHeader";
import { prisma } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Guidelines – USEC",
  description:
    "Code of Conduct and Community Competition Guidelines for all USEC-hosted esports tournaments.",
};

export default async function GuidelinesPage() {
  const rows = await prisma.siteContent.findMany({
    where: { key: { in: ["guidelines_conduct", "guidelines_competition"] } },
  });
  const contentMap: Record<string, string> = {};
  for (const row of rows) {
    contentMap[row.key] = row.value;
  }

  const customConduct = contentMap["guidelines_conduct"]?.trim();
  const customCompetition = contentMap["guidelines_competition"]?.trim();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="mb-2 text-sm font-black uppercase text-cobalt">
          Rules &amp; Policies
        </p>
        <h1 className="text-3xl font-black sm:text-4xl">
          Guidelines
        </h1>
        <p className="mt-3 max-w-2xl muted">
          Please read the following rules carefully before participating in any
          USEC-hosted tournament. All participants are expected to comply.
        </p>

        {/* ── Code of Conduct ──────────────────────────── */}
        <section className="mt-10">
          <h2 className="text-2xl font-black">Code of Conduct</h2>
          <p className="mt-2 muted">
            This code of conduct applies to all USEC events, online spaces, and
            community interactions.
          </p>

          {customConduct ? (
            <div
              className="panel prose prose-sm mt-6 max-w-none p-6 leading-6 muted"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(customConduct) }}
            />
          ) : (
            <div className="mt-6 grid gap-4">
              <RuleCard
                title="Respect &amp; Sportsmanship"
                items={[
                  "Treat every participant, staff member, and spectator with respect.",
                  "Win and lose gracefully — no trash-talking, taunting, or toxic behavior.",
                  "Communicate constructively; personal attacks, slurs, and harassment of any kind are strictly prohibited.",
                ]}
              />
              <RuleCard
                title="Fair Play &amp; Integrity"
                items={[
                  "Do not use cheats, hacks, exploits, macros, or any unauthorized third-party software.",
                  "Do not intentionally lose, fix matches, or collude with opponents.",
                  "Report any suspected cheating or misconduct to tournament staff immediately.",
                ]}
              />
              <RuleCard
                title="Account &amp; Identity"
                items={[
                  "You must use your own accounts; account sharing or boosting is not allowed.",
                  "Provide accurate and truthful information during registration.",
                  "Impersonating another player or team is grounds for immediate disqualification.",
                ]}
              />
              <RuleCard
                title="Communication &amp; Conduct"
                items={[
                  "Keep all in-game and community communication appropriate and inclusive.",
                  "Discriminatory language based on race, gender, sexual orientation, religion, or disability is zero-tolerance.",
                  "Spamming, doxxing, or sharing private information without consent is prohibited.",
                ]}
              />
            </div>
          )}
        </section>

        {/* ── Competition Guidelines ───────────────────── */}
        <section className="mt-14">
          <h2 className="text-2xl font-black">Community Competition Guidelines</h2>
          <p className="mt-2 muted">
            Specific rules that govern how USEC tournaments are organized and played.
          </p>

          {customCompetition ? (
            <div
              className="panel prose prose-sm mt-6 max-w-none p-6 leading-6 muted"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(customCompetition) }}
            />
          ) : (
            <div className="mt-6 grid gap-4">
              <RuleCard
                title="Eligibility"
                items={[
                  "Participants must be currently enrolled students or meet the eligibility criteria specified for each tournament.",
                  "Age restrictions, if any, will be noted on the tournament registration page.",
                  "Each player may only register once per tournament — duplicate entries will be removed.",
                ]}
              />
              <RuleCard
                title="Registration &amp; Rosters"
                items={[
                  "Teams must register before the posted deadline; late entries are not guaranteed.",
                  "Roster changes after registration closes require staff approval.",
                  "Incomplete registrations (missing player info, incorrect IGNs) may be rejected.",
                ]}
              />
              <RuleCard
                title="Match Rules"
                items={[
                  "Be online and ready to play at the scheduled match time. A no-show of 15 minutes results in a forfeit.",
                  "Match format (best-of series, map pool, side selection) is defined per tournament and announced before brackets are set.",
                  "If a technical issue occurs mid-match, notify staff and follow the designated pause/restart procedures.",
                ]}
              />
              <RuleCard
                title="Map Veto &amp; Picks"
                items={[
                  "Where applicable, map veto procedures will be conducted through the USEC platform.",
                  "Both teams must complete the veto process within the allotted time or staff may assign maps.",
                  "Refusing to participate in the veto process counts as forfeiting map choice.",
                ]}
              />
              <RuleCard
                title="Reporting &amp; Results"
                items={[
                  "Match results are recorded by tournament staff. If you believe a score is incorrect, raise a dispute before the next round begins.",
                  "Screenshots or recordings may be requested to verify results.",
                  "Falsifying match results is considered a serious offense.",
                ]}
              />
              <RuleCard
                title="Penalties &amp; Enforcement"
                items={[
                  "Violations may result in warnings, point deductions, match forfeits, or full disqualification depending on severity.",
                  "Repeated offenses across tournaments may lead to a permanent ban from all USEC events.",
                  "Staff decisions are final; appeals can be submitted in writing within 24 hours of the ruling.",
                ]}
              />
            </div>
          )}
        </section>

        {/* ── Closing ──────────────────────────────────── */}
        <section className="mt-14 rounded-lg border border-[#ded7ca] bg-[#fffdf8] p-6 text-center">
          <p className="font-bold">
            By registering for any USEC tournament you agree to abide by these
            guidelines.
          </p>
          <p className="mt-2 text-sm muted">
            If you have questions or need to report a concern, contact USEC
            staff through our official channels.
          </p>
        </section>
      </main>
    </>
  );
}

function RuleCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="panel p-5">
      <h3 className="font-black">{title}</h3>
      <ul className="mt-3 grid gap-2 text-sm leading-6 muted">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-cobalt" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
