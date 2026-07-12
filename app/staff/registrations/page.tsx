import { RegistrationReviewTable } from "@/components/staff/RegistrationReviewTable";
import { StaffNav } from "@/components/staff/StaffNav";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function StaffRegistrationsPage() {
  const staff = await requireStaff();
  const [registrations, teams] = await Promise.all([
    prisma.registration.findMany({ include: { members: { orderBy: [{ isCaptain: "desc" }, { isReserve: "asc" }, { createdAt: "asc" }] }, tournament: true, resolvedTeam: true }, orderBy: { createdAt: "desc" } }),
    prisma.team.findMany({ select: { id: true, name: true, game: true }, orderBy: { name: "asc" } })
  ]);

  return (
    <>
      <StaffNav name={staff.name} role={staff.role} />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div><h1 className="text-4xl font-black">Registrations</h1><p className="mt-2 muted">Review event submissions and maintain the reusable team directory.</p></div>
        <RegistrationReviewTable registrations={registrations} teams={teams} />
      </main>
    </>
  );
}
