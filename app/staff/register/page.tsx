import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StaffApplicationForm } from "@/components/staff/StaffApplicationForm";

export default function StaffRegisterPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link className="mb-6 inline-flex items-center gap-2 text-sm font-bold muted" href="/staff/login">
        <ArrowLeft size={16} aria-hidden />
        Staff login
      </Link>
      <div className="mb-6">
        <p className="text-sm font-black uppercase text-cobalt">Staff access</p>
        <h1 className="text-4xl font-black">Apply for a staff account</h1>
        <p className="mt-2 max-w-2xl muted">Submit your university profile for review. Your account cannot access the dashboard until an administrator approves it.</p>
      </div>
      <StaffApplicationForm />
    </main>
  );
}
