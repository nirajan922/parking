"use client";

import Link from "next/link";
import type { Booking, ParkingArea, ParkingSlot } from "@/lib/database.types";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

type PaymentSuccessProps = {
  booking: Booking;
  area: ParkingArea | undefined;
  slot: ParkingSlot | undefined;
  onNewBooking: () => void;
};

export function PaymentSuccess({ booking, area, slot, onNewBooking }: PaymentSuccessProps) {
  const receiptId = `SP-${booking.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-emerald-200 bg-white shadow-xl shadow-emerald-950/5">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 px-8 py-10 text-center text-white">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/30">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="mt-5 text-3xl font-black tracking-tight">Payment Successful</h2>
          <p className="mt-2 text-sm font-semibold text-emerald-100">
            Your parking slot has been reserved and payment confirmed.
          </p>
        </div>

        <div className="p-8">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Booking confirmation
              </p>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-200">
                Confirmed
              </span>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Receipt ID</span>
                <span className="font-mono font-bold text-slate-900">{receiptId}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Location</span>
                <span className="font-bold text-slate-900">{area?.name ?? "Parking Area"}</span>
              </div>
              {area?.address ? (
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Address</span>
                  <span className="text-right font-bold text-slate-900">{area.address}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Slot</span>
                <span className="font-bold text-slate-900">
                  {slot?.slot_number ?? "Reserved"}{slot?.level ? ` — ${slot.level}` : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Vehicle</span>
                <span className="font-bold text-slate-900">{booking.vehicle_plate}</span>
              </div>

              <div className="my-3 border-t border-dashed border-slate-200" />

              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Start</span>
                <span className="font-bold text-slate-900">{formatDateTime(booking.start_time)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">End</span>
                <span className="font-bold text-slate-900">{formatDateTime(booking.end_time)}</span>
              </div>

              <div className="my-3 border-t border-dashed border-slate-200" />

              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Payment method</span>
                <span className="font-bold text-slate-900">•••• 4242</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Status</span>
                <span className="font-bold text-emerald-600">Paid</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3">
                <span className="text-base font-black text-slate-700">Amount paid</span>
                <span className="text-2xl font-black text-blue-600">
                  ${booking.total_price.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/my-bookings"
              className="inline-flex flex-1 items-center justify-center rounded-full bg-blue-600 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              View My Bookings
            </Link>
            <button
              type="button"
              onClick={onNewBooking}
              className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
            >
              Book Another Slot
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
