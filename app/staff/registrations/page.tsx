import { RegistrationReviewTable } from "@/components/staff/RegistrationReviewTable";
import { StaffNav } from "@/components/staff/StaffNav";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseRegistrationListQuery } from "@/lib/registrations/query";

export const dynamic = "force-dynamic";

export default async function StaffRegistrationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const staff = await requireStaff();
  const query = parseRegistrationListQuery(await searchParams);
  const where = {
    ...(query.game === "all" ? {} : { game: query.game }),
    ...(query.status === "all" ? {} : { status: query.status })
  };
  const [total, teams] = await Promise.all([
    prisma.registration.count({ where }),
    prisma.team.findMany({ select: { id: true, name: true, game: true }, orderBy: { name: "asc" } })
  ]);
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  const page = Math.min(query.page, totalPages);
  const registrations = await prisma.registration.findMany({
    where,
    skip: (page - 1) * query.pageSize,
    take: query.pageSize,
    include: { members: { orderBy: [{ isCaptain: "desc" }, { isReserve: "asc" }, { createdAt: "asc" }] }, tournament: true, resolvedTeam: true },
    orderBy: [{ game: "asc" }, { createdAt: "desc" }, { id: "asc" }]
  });

  return (
    <>
      <StaffNav name={staff.name} role={staff.role} />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div><h1 className="text-4xl font-black">Registrations</h1><p className="mt-2 muted">Review event submissions and maintain the reusable team directory.</p></div>
        <RegistrationReviewTable
          registrations={registrations}
          teams={teams}
          filters={{ game: query.game, status: query.status }}
          pagination={{ page, pageSize: query.pageSize, total, totalPages }}
        />
      </main>
    </>
  );
}
