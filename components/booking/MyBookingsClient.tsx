"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Booking, ParkingArea, ParkingSlot } from "@/lib/database.types";
import { listParkingAreas, listParkingSlots } from "@/services/parkingService";
import {
  SYDNEY_PARKING_AREAS,
  getSydneyDemoSlots,
  getDemoSession,
  getDemoBookings,
} from "@/lib/demoMode";

type BookingResponse = {
  data?: Booking[];
  error?: string;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusColor(status: string) {
  if (status === "confirmed") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (status === "pending") return "bg-amber-50 text-amber-700 ring-amber-100";
  if (status === "cancelled") return "bg-red-50 text-red-700 ring-red-100";
  if (status === "completed") return "bg-blue-50 text-blue-700 ring-blue-100";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

export function MyBookingsClient() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [areas, setAreas] = useState<ParkingArea[]>([]);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isDemo = getDemoSession() !== null;

  useEffect(() => {
    async function load() {
      setIsLoading(true);

      let parkingAreas: ParkingArea[];
      let parkingSlots: ParkingSlot[];

      try {
        [parkingAreas, parkingSlots] = await Promise.all([
          listParkingAreas({ limit: 100 }),
          listParkingSlots({ limit: 500 }),
        ]);
        if (parkingAreas.length === 0) throw new Error("empty");
      } catch {
        parkingAreas = SYDNEY_PARKING_AREAS;
        parkingSlots = getSydneyDemoSlots();
      }

      setAreas(parkingAreas);
      setSlots(parkingSlots);

      if (isDemo) {
        setBookings(getDemoBookings());
      } else {
        try {
          const res = await fetch("/api/bookings", { cache: "no-store" });
          const payload = (await res.json()) as BookingResponse;
          if (res.ok) {
            setBookings(payload.data ?? []);
          } else {
            setBookings(getDemoBookings());
          }
        } catch {
          setBookings(getDemoBookings());
        }
      }

      setIsLoading(false);
    }

    load();
  }, [isDemo]);

  const areasById = new Map(areas.map((a) => [a.id, a]));
  const slotsById = new Map(slots.map((s) => [s.id, s]));

  async function handleCancelBooking(bookingId: string) {
    if (isDemo) {
      setErrorMessage("Cancellation is available for Supabase bookings. Demo bookings are local evidence only.");
      return;
    }

    setPendingCancelId(bookingId);
    setMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const payload = (await res.json()) as { data?: Booking; error?: string };

      if (!res.ok || !payload.data) {
        throw new Error(payload.error ?? "Unable to cancel booking.");
      }

      setBookings((current) =>
        current.map((booking) => (booking.id === bookingId ? payload.data! : booking)),
      );
      setMessage("Booking cancelled and slot released.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to cancel booking.");
    } finally {
      setPendingCancelId(null);
    }
  }

  return (
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
              <span className="block text-xs font-medium text-slate-500">My Bookings</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/parking/search"
              className="hidden text-sm font-bold text-slate-600 transition hover:text-blue-700 sm:inline-flex"
            >
              Search
            </Link>
            <Link
              href="/bookings"
              className="hidden text-sm font-bold text-slate-600 transition hover:text-blue-700 sm:inline-flex"
            >
              New Booking
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
              My Bookings
            </p>
            <h1 className="mt-5 text-5xl font-black tracking-tight text-slate-950 sm:text-6xl">
              Your parking reservations
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              View all your confirmed and past parking bookings.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        {message ? (
          <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            {message}
          </div>
        ) : null}
        {errorMessage ? (
          <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        ) : null}
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-52 animate-pulse rounded-[1.75rem] bg-white shadow-sm" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-12 text-center shadow-xl shadow-blue-950/5">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
              No bookings yet
            </p>
            <h2 className="mt-4 text-2xl font-black text-slate-950">
              You haven&apos;t made any reservations.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
              Search for parking and book your first slot.
            </p>
            <Link
              href="/parking/search"
              className="mt-6 inline-flex rounded-full bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-xl shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Search Parking
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {bookings.map((booking) => {
              const area = areasById.get(booking.parking_area_id);
              const slot = slotsById.get(booking.parking_slot_id);

              return (
                <article
                  key={booking.id}
                  className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-black text-slate-950">
                      {area?.name ?? "Parking Area"}
                    </h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black capitalize ring-1 ${getStatusColor(booking.status)}`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    {area?.address ?? ""}
                  </p>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-500">Slot</span>
                      <span className="font-semibold text-slate-800">
                        {slot?.slot_number ?? "Reserved"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-500">Vehicle</span>
                      <span className="font-semibold text-slate-800">{booking.vehicle_plate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-500">Start</span>
                      <span className="font-semibold text-slate-800">
                        {formatDateTime(booking.start_time)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-500">End</span>
                      <span className="font-semibold text-slate-800">
                        {formatDateTime(booking.end_time)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-2">
                      <span className="font-bold text-slate-500">Total</span>
                      <span className="text-lg font-black text-blue-600">
                        ${booking.total_price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {["pending", "confirmed"].includes(booking.status) ? (
                    <button
                      type="button"
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={pendingCancelId === booking.id}
                      className="mt-5 inline-flex w-full justify-center rounded-full border border-red-100 bg-white px-4 py-2.5 text-sm font-black text-red-600 transition hover:-translate-y-0.5 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {pendingCancelId === booking.id ? "Cancelling..." : "Cancel Booking"}
                    </button>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
