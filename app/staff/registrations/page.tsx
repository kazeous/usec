import type { Registration } from "@prisma/client";
import { RegistrationReviewTable } from "@/components/staff/RegistrationReviewTable";
import { RegistrationSettingsPanel } from "@/components/staff/RegistrationSettingsPanel";
import { StaffNav } from "@/components/staff/StaffNav";
import { requireStaff } from "@/lib/auth";
import { getRegistrationSettings } from "@/lib/data";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function StaffRegistrationsPage() {
  const staff = await requireStaff();
  const settings = await getRegistrationSettings();
  let registrations: Registration[] = [];

  try {
    registrations = await prisma.registration.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });
  } catch {
    registrations = [];
  }

  return (
    <>
      <StaffNav name={staff.name} />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-4xl font-black">Registrations</h1>
          <p className="mt-2 muted">Review submitted rosters and control public registration windows.</p>
        </div>
        <RegistrationSettingsPanel settings={settings} />
        <RegistrationReviewTable registrations={registrations} />
      </main>
    </>
  );
}
