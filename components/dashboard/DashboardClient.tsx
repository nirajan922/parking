"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { getDemoSession, type DemoUser } from "@/lib/demoMode";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";

type UserInfo = {
  email: string;
  displayName: string;
  id: string;
  isDemo: boolean;
};

export function DashboardClient() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const demoUser: DemoUser | null = getDemoSession();
      if (demoUser) {
        setUser({
          email: demoUser.email,
          displayName: demoUser.fullName,
          id: demoUser.id,
          isDemo: true,
        });
        setIsLoading(false);
        return;
      }

      if (!isSupabaseConfigured()) {
        router.replace("/login?next=/dashboard");
        setIsLoading(false);
        return;
      }

      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user: sbUser } } = await supabase.auth.getUser();
        if (!sbUser) {
          router.replace("/login?next=/dashboard");
          return;
        }
        setUser({
          email: sbUser.email ?? "No email",
          displayName:
            sbUser.user_metadata?.full_name?.toString() || sbUser.email || "User",
          id: sbUser.id,
          isDemo: false,
        });
      } catch {
        router.replace("/login?next=/dashboard");
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [router]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="h-48 animate-pulse rounded-[2rem] bg-white shadow-xl shadow-blue-950/5" />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-[1.75rem] bg-white shadow-sm" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!user) return null;

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
              Welcome, {user.displayName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Your authenticated Smart Parking dashboard is ready for live bookings, availability predictions, and parking area operations.
            </p>
            {user.isDemo ? (
              <span className="mt-3 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-100">
                Demo mode
              </span>
            ) : null}
          </div>
          <LogoutButton />
        </header>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          {(
            [
              ["Session", "Active", "Your identity has been verified."],
              ["Bookings", "Protected", "Only authenticated users can view or create bookings."],
              ["Predictions", "Ready", "Forecast availability for any parking area."],
            ] as const
          ).map(([label, value, description]) => (
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

        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/parking/search"
            className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10"
          >
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Search</p>
            <p className="mt-3 text-lg font-black text-slate-950">Find Parking</p>
            <p className="mt-2 text-sm text-slate-600">Search nearby parking areas</p>
          </Link>
          <Link
            href="/bookings"
            className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10"
          >
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Book</p>
            <p className="mt-3 text-lg font-black text-slate-950">Book a Slot</p>
            <p className="mt-2 text-sm text-slate-600">Reserve available parking</p>
          </Link>
          <Link
            href="/my-bookings"
            className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10"
          >
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">History</p>
            <p className="mt-3 text-lg font-black text-slate-950">My Bookings</p>
            <p className="mt-2 text-sm text-slate-600">View your reservations</p>
          </Link>
          <Link
            href="/"
            className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10"
          >
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Home</p>
            <p className="mt-3 text-lg font-black text-slate-950">Landing Page</p>
            <p className="mt-2 text-sm text-slate-600">Back to the homepage</p>
          </Link>
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
                {user.email}
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
