import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdminUser } from "@/services/authService";
import { listAdminBookingOverview } from "@/services/bookingService";
import { listParkingAreas, listParkingSlots } from "@/services/parkingService";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let supabase;

  try {
    supabase = await createSupabaseServerClient();
    await requireAdminUser(supabase);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Administrator access")) {
      redirect("/dashboard?admin_error=forbidden");
    }

    redirect("/login?next=/admin");
  }

  const [
    areas,
    slots,
    bookings,
    { count: totalUsers },
    { count: activeBookings },
    { count: cancelledBookings },
    { data: predictions },
    { data: contactMessages },
  ] = await Promise.all([
    listParkingAreas({ client: supabase, limit: 250 }),
    listParkingSlots({ client: supabase, limit: 500 }),
    listAdminBookingOverview({ client: supabase, limit: 50 }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "confirmed"]),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "cancelled"),
    supabase
      .from("predictions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

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
                  Admin Dashboard
                </span>
              </span>
            </Link>
            <h1 className="mt-8 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Admin Dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Manage parking area availability, slot status, and booking operations. Access is restricted to admin users only.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700"
            >
              User dashboard
            </Link>
          </div>
        </header>

        <div className="mt-8">
          <AdminDashboardClient
            initialAreas={areas}
            initialSlots={slots}
            initialBookings={bookings}
            initialPredictions={predictions ?? []}
            initialContactMessages={contactMessages ?? []}
            summary={{
              totalUsers: totalUsers ?? 0,
              activeBookings: activeBookings ?? 0,
              cancelledBookings: cancelledBookings ?? 0,
            }}
          />
        </div>
      </div>
    </main>
  );
}
