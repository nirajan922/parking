import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch {
    redirect("/login?next=/dashboard");
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?next=/dashboard");
  }

  const displayName =
    user.user_metadata?.full_name?.toString() || user.email || "Smart Parking user";

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-blue-950/5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/25">
                SP
              </span>
              <span>
                <span className="block text-base font-black text-slate-950">Smart Parking</span>
                <span className="block text-xs font-semibold text-slate-500">
                  Protected dashboard
                </span>
              </span>
            </Link>
            <h1 className="mt-8 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Welcome, {displayName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Your authenticated Smart Parking dashboard is ready for live bookings, availability predictions, and parking area operations.
            </p>
          </div>
          <LogoutButton />
        </header>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            ["Session", "Active", "Supabase Auth verified this user on the server."],
            ["Bookings", "Protected", "Only authenticated users can view or create bookings."],
            ["Predictions", "Ready", "Connect Supabase data to populate forecast cards."],
          ].map(([label, value, description]) => (
            <article
              key={label}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/10"
            >
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                {label}
              </p>
              <p className="mt-4 text-3xl font-black text-slate-950">{value}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-blue-950/5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                Account
              </p>
              <h2 className="mt-3 text-2xl font-black text-slate-950">Authenticated user</h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100">
              Signed in
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Email</p>
              <p className="mt-2 break-all text-sm font-semibold text-slate-800">
                {user.email ?? "No email available"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                User ID
              </p>
              <p className="mt-2 break-all text-sm font-semibold text-slate-800">{user.id}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
