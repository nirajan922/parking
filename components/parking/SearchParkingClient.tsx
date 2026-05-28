"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ParkingArea, ParkingSlot } from "@/lib/database.types";
import { listParkingAreas, listParkingSlots } from "@/services/parkingService";

type ParkingAreaWithSlots = ParkingArea & {
  slots: ParkingSlot[];
};

function getAvailableSlotCount(slots: ParkingSlot[]) {
  return slots.filter((slot) => slot.status === "available").length;
}

function formatRate(slots: ParkingSlot[]) {
  const rates = slots.map((slot) => slot.hourly_rate).filter((rate) => rate > 0);

  if (!rates.length) {
    return "Rate unavailable";
  }

  const lowestRate = Math.min(...rates);

  return `$${lowestRate.toFixed(2)} / hr`;
}

function getStatusClasses(status: ParkingArea["status"]) {
  if (status === "open") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (status === "busy") {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }

  if (status === "full") {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  return "bg-slate-100 text-slate-600 ring-slate-200";
}

export function SearchParkingClient() {
  const [areas, setAreas] = useState<ParkingAreaWithSlots[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadParkingData() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [parkingAreas, parkingSlots] = await Promise.all([
          listParkingAreas({ limit: 100 }),
          listParkingSlots({ limit: 500 }),
        ]);

        if (!isMounted) {
          return;
        }

        const slotsByArea = new Map<string, ParkingSlot[]>();
        parkingSlots.forEach((slot) => {
          const slots = slotsByArea.get(slot.parking_area_id) ?? [];
          slots.push(slot);
          slotsByArea.set(slot.parking_area_id, slots);
        });

        setAreas(
          parkingAreas.map((area) => ({
            ...area,
            slots: slotsByArea.get(area.id) ?? [],
          })),
        );
      } catch {
        if (isMounted) {
          setErrorMessage(
            "Unable to load parking areas. Check your Supabase environment variables and database connection.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadParkingData();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredAreas = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return areas;
    }

    return areas.filter((area) =>
      [area.name, area.address, area.description, area.status]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery)),
    );
  }, [areas, searchQuery]);

  return (
    <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <div className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-2xl shadow-blue-950/10 backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
              Live database search
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Search available parking
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Results are loaded from Supabase `parking_areas` and `parking_slots` tables.
            </p>
          </div>

          <label className="w-full lg:max-w-md">
            <span className="sr-only">Search parking areas</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, address, or status"
              className="w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="h-72 animate-pulse rounded-[1.75rem] border border-slate-200 bg-white shadow-sm"
            />
          ))}
        </div>
      ) : null}

      {!isLoading && errorMessage ? (
        <div className="mt-8 rounded-[1.75rem] border border-red-100 bg-red-50 p-6 text-red-800 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.18em]">Connection error</p>
          <p className="mt-3 text-sm leading-6">{errorMessage}</p>
        </div>
      ) : null}

      {!isLoading && !errorMessage && !filteredAreas.length ? (
        <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
            No parking found
          </p>
          <h3 className="mt-3 text-2xl font-black text-slate-950">
            {areas.length ? "No areas match your search." : "No parking areas in Supabase yet."}
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
            Add rows to `parking_areas` and `parking_slots` in Supabase, then refresh this page to see real availability data.
          </p>
        </div>
      ) : null}

      {!isLoading && !errorMessage && filteredAreas.length ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredAreas.map((area) => {
            const availableSlots = getAvailableSlotCount(area.slots);
            const totalSlots = area.slots.length || area.total_slots;
            const availabilityPercent = totalSlots
              ? Math.round((availableSlots / totalSlots) * 100)
              : 0;

            return (
              <article
                key={area.id}
                className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-950/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-950">{area.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {area.address ?? "Address not provided"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black capitalize ring-1 ${getStatusClasses(
                      area.status,
                    )}`}
                  >
                    {area.status}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-blue-50 p-4">
                    <p className="text-xs font-bold text-blue-700">Available</p>
                    <p className="mt-2 text-2xl font-black text-slate-950">{availableSlots}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold text-slate-500">Total</p>
                    <p className="mt-2 text-2xl font-black text-slate-950">{totalSlots}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold text-slate-500">Rate</p>
                    <p className="mt-2 text-sm font-black text-slate-950">{formatRate(area.slots)}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>Availability</span>
                    <span>{availabilityPercent}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-500"
                      style={{ width: `${availabilityPercent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {area.slots.some((slot) => slot.has_ev_charger) ? (
                    <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                      EV charging
                    </span>
                  ) : null}
                  {area.slots.some((slot) => slot.is_accessible) ? (
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                      Accessible
                    </span>
                  ) : null}
                  {!area.slots.length ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      Slots not configured
                    </span>
                  ) : null}
                </div>

                <Link
                  href="/bookings"
                  className="mt-6 inline-flex w-full justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-xl shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  Book available slot
                </Link>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
