import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "@/components/staff/LoginForm";

export default function StaffLoginPage() {
  return (
    <main className="mx-auto grid min-h-screen max-w-md content-center px-4 py-10">
      <Link className="mb-6 inline-flex items-center gap-2 text-sm font-bold muted" href="/">
        <ArrowLeft size={16} aria-hidden />
        Public site
      </Link>
      <div className="mb-6">
        <h1 className="text-4xl font-black">Staff login</h1>
        <p className="mt-2 muted">Use your club staff account to manage registrations, brackets, and matches.</p>
      </div>
      <LoginForm />
      <p className="mt-5 text-center text-sm muted">Need staff access? <Link className="font-bold text-[#335cba]" href="/staff/register">Apply for an account</Link>.</p>
    </main>
  );
}
