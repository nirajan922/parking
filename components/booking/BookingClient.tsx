"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Booking, ParkingArea, ParkingSlot } from "@/lib/database.types";
import { listParkingAreas, listParkingSlots } from "@/services/parkingService";

type BookingResponse = {
  data?: Booking[];
  error?: string;
};

type CreateBookingResponse = {
  data?: Booking;
  error?: string;
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

async function fetchBookingData() {
  const [parkingAreas, parkingSlots, bookingsResponse] = await Promise.all([
    listParkingAreas({ limit: 100 }),
    listParkingSlots({ limit: 500 }),
    fetch("/api/bookings", { cache: "no-store" }),
  ]);
  const bookingsPayload = (await bookingsResponse.json()) as BookingResponse;

  if (!bookingsResponse.ok) {
    throw new Error(bookingsPayload.error ?? "Unable to load bookings.");
  }

  return {
    parkingAreas,
    parkingSlots,
    bookings: bookingsPayload.data ?? [],
  };
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
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Booking | null>(null);

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
        const data = await fetchBookingData();

        if (!isMounted) {
          return;
        }

        setAreas(data.parkingAreas);
        setSlots(data.parkingSlots);
        setBookings(data.bookings);
        setSelectedAreaId((currentAreaId) => {
          if (currentAreaId && data.parkingAreas.some((area) => area.id === currentAreaId)) {
            return currentAreaId;
          }

          return data.parkingAreas[0]?.id || "";
        });
      } catch {
        if (isMounted) {
          setErrorMessage(
            "Unable to load booking data. Check your Supabase connection and sign-in session.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialBookingData();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setConfirmation(null);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parkingAreaId: selectedAreaId,
          parkingSlotId: effectiveSelectedSlotId,
          vehiclePlate,
          startTime: new Date(startTime || toDateTimeLocalValue(new Date())).toISOString(),
          endTime: new Date(endTime || toDateTimeLocalValue(new Date())).toISOString(),
        }),
      });
      const payload = (await response.json()) as CreateBookingResponse;

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Unable to create booking.");
      }

      setConfirmation(payload.data);
      setVehiclePlate("");
      const refreshedData = await fetchBookingData();
      setAreas(refreshedData.parkingAreas);
      setSlots(refreshedData.parkingSlots);
      setBookings(refreshedData.bookings);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create booking. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="h-[34rem] animate-pulse rounded-[2rem] bg-white shadow-xl shadow-blue-950/5" />
        <div className="h-[34rem] animate-pulse rounded-[2rem] bg-white shadow-xl shadow-blue-950/5" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-blue-950/5">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
          Book a slot
        </p>
        <h2 className="mt-3 text-3xl font-black text-slate-950">Reserve available parking</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Select a live available slot from Supabase. Booking reserves the slot and stores your user ID securely.
        </p>

        {errorMessage ? (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {confirmation ? (
          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Booking confirmed for plate {confirmation.vehicle_plate}. Your slot is now reserved.
          </div>
        ) : null}

        {!areas.length ? (
          <div className="mt-8 rounded-2xl bg-slate-50 p-6 text-center">
            <p className="text-sm font-bold text-slate-700">No parking areas available.</p>
            <p className="mt-2 text-sm text-slate-500">
              Add `parking_areas` and `parking_slots` rows in Supabase to enable bookings.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Parking area</span>
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

            <label className="block">
              <span className="text-sm font-bold text-slate-700">Vehicle plate</span>
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
                <span className="text-sm font-bold text-slate-700">Start time</span>
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

            <button
              type="submit"
              disabled={isSubmitting || !effectiveSelectedSlotId}
              className="inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isSubmitting ? "Creating booking..." : "Book parking slot"}
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
            {bookings.map((booking) => {
              const area = areasById.get(booking.parking_area_id);
              const slot = slotsById.get(booking.parking_slot_id);

              return (
                <article
                  key={booking.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-black text-slate-950">
                        {area?.name ?? "Parking area"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Slot {slot?.slot_number ?? "reserved"} - {booking.vehicle_plate}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black capitalize text-blue-700 ring-1 ring-blue-100">
                      {booking.status}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                        Starts
                      </p>
                      <p className="mt-1 font-semibold text-slate-700">
                        {formatDateTime(booking.start_time)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                        Ends
                      </p>
                      <p className="mt-1 font-semibold text-slate-700">
                        {formatDateTime(booking.end_time)}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
