import { StaffAccountReviewTable } from "@/components/staff/StaffAccountReviewTable";
import { StaffNav } from "@/components/staff/StaffNav";
import { requireAdmin } from "@/lib/auth";
import { getStaffApplications } from "@/lib/staff-accounts";

export const dynamic = "force-dynamic";

export default async function StaffAccountsPage() {
  const admin = await requireAdmin();
  const applications = await getStaffApplications();
  const serialized = applications.map((application) => ({
    ...application,
    applicationSubmittedAt: application.applicationSubmittedAt?.toISOString() ?? null,
    reviews: application.reviews.map((review) => ({ ...review, createdAt: review.createdAt.toISOString() }))
  }));

  return (
    <>
      <StaffNav name={admin.name} role={admin.role} />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div><h1 className="text-4xl font-black">Staff accounts</h1><p className="mt-2 muted">Approve public staff applications and inspect prior decisions.</p></div>
        <StaffAccountReviewTable applications={serialized} />
      </main>
    </>
  );
}
