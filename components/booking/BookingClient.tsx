"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Booking, ParkingArea, ParkingSlot } from "@/lib/database.types";
import { listParkingAreas, listParkingSlots } from "@/services/parkingService";
import {
  SYDNEY_PARKING_AREAS,
  getSydneyDemoSlots,
  getDemoSession,
  getDemoBookings,
  saveDemoBooking,
  createDemoBookingId,
} from "@/lib/demoMode";
import { PaymentForm } from "@/components/booking/PaymentForm";
import { PaymentSuccess } from "@/components/booking/PaymentSuccess";

type BookingResponse = {
  data?: Booking[];
  error?: string;
};

type CreateBookingResponse = {
  data?: Booking;
  error?: string;
};

type Step = "form" | "payment" | "success";

type PendingBooking = {
  areaId: string;
  slotId: string;
  vehiclePlate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  fullName: string;
  emailAddress: string;
};

function toDateTimeLocalValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getAvailableSlots(slots: ParkingSlot[], areaId: string) {
  return slots.filter((slot) => slot.parking_area_id === areaId && slot.status === "available");
}

async function fetchBookingData(isDemo: boolean) {
  let parkingAreas: ParkingArea[];
  let parkingSlots: ParkingSlot[];

  try {
    [parkingAreas, parkingSlots] = await Promise.all([
      listParkingAreas({ limit: 100 }),
      listParkingSlots({ limit: 500 }),
    ]);
    if (parkingAreas.length === 0) throw new Error("No areas");
  } catch {
    parkingAreas = SYDNEY_PARKING_AREAS;
    parkingSlots = getSydneyDemoSlots();
  }

  let bookings: Booking[] = [];
  if (isDemo) {
    bookings = getDemoBookings();
  } else {
    try {
      const bookingsResponse = await fetch("/api/bookings", { cache: "no-store" });
      const bookingsPayload = (await bookingsResponse.json()) as BookingResponse;
      if (bookingsResponse.ok) {
        bookings = bookingsPayload.data ?? [];
      }
    } catch {
      bookings = getDemoBookings();
    }
  }

  return { parkingAreas, parkingSlots, bookings };
}

type BookingClientProps = {
  initialAreaId?: string;
  initialSlotId?: string;
};

export function BookingClient({ initialAreaId = "", initialSlotId = "" }: BookingClientProps) {
  const [areas, setAreas] = useState<ParkingArea[]>([]);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState(initialAreaId);
  const [selectedSlotId, setSelectedSlotId] = useState(initialSlotId);
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [fullName, setFullName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [step, setStep] = useState<Step>("form");
  const [pendingBooking, setPendingBooking] = useState<PendingBooking | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  const isDemo = getDemoSession() !== null;

  const availableSlotsForArea = useMemo(
    () => getAvailableSlots(slots, selectedAreaId),
    [selectedAreaId, slots],
  );
  const effectiveSelectedSlotId = availableSlotsForArea.some((slot) => slot.id === selectedSlotId)
    ? selectedSlotId
    : (availableSlotsForArea[0]?.id ?? "");

  const areasById = useMemo(() => new Map(areas.map((area) => [area.id, area])), [areas]);
  const slotsById = useMemo(() => new Map(slots.map((slot) => [slot.id, slot])), [slots]);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialBookingData() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const data = await fetchBookingData(isDemo);

        if (!isMounted) return;

        setAreas(data.parkingAreas);
        setSlots(data.parkingSlots);
        setBookings(data.bookings);
        setSelectedAreaId((currentAreaId) => {
          if (currentAreaId && data.parkingAreas.some((area) => area.id === currentAreaId)) {
            return currentAreaId;
          }
          return data.parkingAreas[0]?.id || "";
        });

        const demo = getDemoSession();
        if (demo) {
          setFullName(demo.fullName);
          setEmailAddress(demo.email);
        } else {
          try {
            const { createSupabaseBrowserClient } = await import("@/lib/supabaseClient");
            const supabase = createSupabaseBrowserClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              setEmailAddress(user.email ?? "");
              setFullName(user.user_metadata?.full_name?.toString() ?? "");
            }
          } catch {
            // ignore
          }
        }
      } catch {
        if (isMounted) {
          setErrorMessage("Unable to load booking data.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadInitialBookingData();

    return () => {
      isMounted = false;
    };
  }, [isDemo]);

  function handleProceedToPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const startIso = new Date(startTime || toDateTimeLocalValue(new Date())).toISOString();
    const endIso = new Date(endTime || toDateTimeLocalValue(new Date())).toISOString();

    if (new Date(startIso) >= new Date(endIso)) {
      setErrorMessage("End time must be after start time.");
      return;
    }

    const slot = slotsById.get(effectiveSelectedSlotId);
    const hours = Math.max(
      (new Date(endIso).getTime() - new Date(startIso).getTime()) / 3_600_000,
      0,
    );
    const price = Number((hours * (slot?.hourly_rate ?? 0)).toFixed(2));

    setPendingBooking({
      areaId: selectedAreaId,
      slotId: effectiveSelectedSlotId,
      vehiclePlate: vehiclePlate.trim().toUpperCase(),
      startTime: startIso,
      endTime: endIso,
      totalPrice: price,
      fullName,
      emailAddress,
    });
    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function createBooking(): Promise<Booking> {
    if (!pendingBooking) throw new Error("No pending booking.");

    let bookingResult: Booking | null = null;

    if (!isDemo) {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parkingAreaId: pendingBooking.areaId,
          parkingSlotId: pendingBooking.slotId,
          vehiclePlate: pendingBooking.vehiclePlate,
          startTime: pendingBooking.startTime,
          endTime: pendingBooking.endTime,
        }),
      });
      const payload = (await response.json()) as CreateBookingResponse;

      if (response.ok && payload.data) {
        bookingResult = payload.data;
      } else if (payload.error) {
        throw new Error(payload.error);
      }
    }

    if (!bookingResult) {
      bookingResult = {
        id: createDemoBookingId(),
        user_id: getDemoSession()?.id ?? "local-user",
        parking_area_id: pendingBooking.areaId,
        parking_slot_id: pendingBooking.slotId,
        vehicle_plate: pendingBooking.vehiclePlate,
        start_time: pendingBooking.startTime,
        end_time: pendingBooking.endTime,
        status: "confirmed",
        total_price: pendingBooking.totalPrice,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveDemoBooking(bookingResult);
    }

    return bookingResult;
  }

  async function handlePaymentComplete(booking: Booking) {
    setConfirmedBooking(booking);
    setStep("success");
    setVehiclePlate("");
    window.scrollTo({ top: 0, behavior: "smooth" });

    const refreshed = await fetchBookingData(isDemo);
    setAreas(refreshed.parkingAreas);
    setSlots(refreshed.parkingSlots);
    setBookings(isDemo ? getDemoBookings() : refreshed.bookings);
  }

  function handleNewBooking() {
    setStep("form");
    setPendingBooking(null);
    setConfirmedBooking(null);
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="h-[34rem] animate-pulse rounded-[2rem] bg-white shadow-xl shadow-blue-950/5" />
        <div className="h-[34rem] animate-pulse rounded-[2rem] bg-white shadow-xl shadow-blue-950/5" />
      </div>
    );
  }

  if (step === "success" && confirmedBooking) {
    return (
      <PaymentSuccess
        booking={confirmedBooking}
        area={areasById.get(confirmedBooking.parking_area_id)}
        slot={slotsById.get(confirmedBooking.parking_slot_id)}
        onNewBooking={handleNewBooking}
      />
    );
  }

  if (step === "payment" && pendingBooking) {
    return (
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <PaymentForm
          pending={pendingBooking}
          area={areasById.get(pendingBooking.areaId)}
          slot={slotsById.get(pendingBooking.slotId)}
          onPaymentComplete={handlePaymentComplete}
          onBack={() => setStep("form")}
          onCreateBooking={createBooking}
        />

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-blue-950/5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
                My bookings
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">Your reservations</h2>
            </div>
            <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
              {bookings.length} total
            </span>
          </div>

          {!bookings.length ? (
            <div className="mt-8 rounded-2xl bg-slate-50 p-6 text-center">
              <p className="text-sm font-bold text-slate-700">No bookings yet.</p>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {bookings.slice(0, 5).map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  area={areasById.get(booking.parking_area_id)}
                  slot={slotsById.get(booking.parking_slot_id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-blue-950/5">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
          Step 1 of 2
        </p>
        <h2 className="mt-3 text-3xl font-black text-slate-950">Reserve available parking</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Select an available slot, fill in your details, then proceed to payment.
        </p>

        {errorMessage ? (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {!areas.length ? (
          <div className="mt-8 rounded-2xl bg-slate-50 p-6 text-center">
            <p className="text-sm font-bold text-slate-700">No parking areas available.</p>
          </div>
        ) : (
          <form onSubmit={handleProceedToPayment} className="mt-8 space-y-5">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Parking location</span>
              <select
                value={selectedAreaId}
                onChange={(event) => setSelectedAreaId(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              >
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">Available slot</span>
              <select
                value={effectiveSelectedSlotId}
                onChange={(event) => setSelectedSlotId(event.target.value)}
                disabled={!availableSlotsForArea.length}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400"
              >
                {availableSlotsForArea.length ? (
                  availableSlotsForArea.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      Slot {slot.slot_number}
                      {slot.level ? `, ${slot.level}` : ""} - ${slot.hourly_rate.toFixed(2)}/hr
                    </option>
                  ))
                ) : (
                  <option value="">No available slots</option>
                )}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Date & start time</span>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">End time</span>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">Vehicle number plate</span>
              <input
                value={vehiclePlate}
                onChange={(event) => setVehiclePlate(event.target.value)}
                required
                placeholder="ABC 123"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold uppercase text-slate-900 outline-none transition placeholder:normal-case placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Full name</span>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  placeholder="John Smith"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Email address</span>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(event) => setEmailAddress(event.target.value)}
                  required
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={!effectiveSelectedSlotId}
              className="inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              Proceed to Payment
            </button>
          </form>
        )}
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-blue-950/5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
              My bookings
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">Your reservations</h2>
          </div>
          <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
            {bookings.length} total
          </span>
        </div>

        {!bookings.length ? (
          <div className="mt-8 rounded-2xl bg-slate-50 p-6 text-center">
            <p className="text-sm font-bold text-slate-700">No bookings yet.</p>
            <p className="mt-2 text-sm text-slate-500">
              Create your first booking to see it listed here.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                area={areasById.get(booking.parking_area_id)}
                slot={slotsById.get(booking.parking_slot_id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function BookingCard({
  booking,
  area,
  slot,
}: {
  booking: Booking;
  area: ParkingArea | undefined;
  slot: ParkingSlot | undefined;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-black text-slate-950">{area?.name ?? "Parking area"}</p>
          <p className="mt-1 text-sm text-slate-500">
            Slot {slot?.slot_number ?? "reserved"} - {booking.vehicle_plate}
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black capitalize text-blue-700 ring-1 ring-blue-100">
          {booking.status}
        </span>
      </div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Starts</p>
          <p className="mt-1 font-semibold text-slate-700">{formatDateTime(booking.start_time)}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Ends</p>
          <p className="mt-1 font-semibold text-slate-700">{formatDateTime(booking.end_time)}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Total</p>
          <p className="mt-1 font-semibold text-slate-700">${booking.total_price.toFixed(2)}</p>
        </div>
      </div>
    </article>
  );
}
