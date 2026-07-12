import { StaffNav } from "@/components/staff/StaffNav";
import { GuidelinesEditor } from "@/components/staff/GuidelinesEditor";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function StaffGuidelinesPage() {
  const staff = await requireStaff();

  const rows = await prisma.siteContent.findMany({
    where: { key: { in: ["guidelines_conduct", "guidelines_competition"] } },
  });
  const map: Record<string, string> = {};
  for (const row of rows) map[row.key] = row.value;

  return (
    <>
      <StaffNav name={staff.name} role={staff.role} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-4xl font-black">Guidelines</h1>
          <p className="mt-2 muted">Edit the public Code of Conduct and Competition Guidelines pages. Content is written in Markdown.</p>
        </div>
        <GuidelinesEditor
          initial={{
            guidelines_conduct: map["guidelines_conduct"] ?? "",
            guidelines_competition: map["guidelines_competition"] ?? "",
          }}
        />
      </main>
    </>
  );
}
