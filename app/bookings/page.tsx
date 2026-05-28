import Link from "next/link";
import { BookingClient } from "@/components/booking/BookingClient";
import { AuthGate } from "@/components/auth/AuthGate";

export const dynamic = "force-dynamic";

type BookingsPageProps = {
  searchParams?: Promise<{
    areaId?: string;
    slotId?: string;
  }>;
};

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <AuthGate>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_32rem),linear-gradient(135deg,#f8fbff_0%,#eef6ff_48%,#ffffff_100%)]">
        <header className="border-b border-white/70 bg-white/80 shadow-sm shadow-slate-950/5 backdrop-blur-2xl">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
            <Link href="/" className="group flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-black text-white shadow-lg shadow-blue-600/30 transition group-hover:-translate-y-0.5">
                SP
              </span>
              <span>
                <span className="block text-base font-black tracking-tight text-slate-950">
                  Smart Parking
                </span>
                <span className="block text-xs font-medium text-slate-500">
                  Booking
                </span>
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                href="/parking/search"
                className="hidden text-sm font-bold text-slate-600 transition hover:text-blue-700 sm:inline-flex"
              >
                Search Parking
              </Link>
              <Link
                href="/my-bookings"
                className="hidden text-sm font-bold text-slate-600 transition hover:text-blue-700 sm:inline-flex"
              >
                My Bookings
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-xl shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Dashboard
              </Link>
            </div>
          </nav>
        </header>

        <section className="px-6 pb-4 pt-14 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-blue-600">
                Booking
              </p>
              <h1 className="mt-5 text-5xl font-black tracking-tight text-slate-950 sm:text-6xl">
                Book a parking slot
              </h1>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Choose an available parking slot, fill in your details, and confirm your booking.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <BookingClient
            initialAreaId={resolvedSearchParams?.areaId}
            initialSlotId={resolvedSearchParams?.slotId}
          />
        </section>
      </main>
    </AuthGate>
  );
}
