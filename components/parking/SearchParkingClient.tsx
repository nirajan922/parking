"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ParkingArea, ParkingSlot } from "@/lib/database.types";
import { listParkingAreas, listParkingSlots } from "@/services/parkingService";

type ParkingAreaWithSlots = ParkingArea & {
  slots: ParkingSlot[];
};

type UserLocation = {
  latitude: number;
  longitude: number;
};

function getAvailableSlots(slots: ParkingSlot[]) {
  return slots.filter((slot) => slot.status === "available");
}

function getAvailableSlotCount(slots: ParkingSlot[]) {
  return getAvailableSlots(slots).length;
}

function getLowestRate(slots: ParkingSlot[]) {
  const rates = slots.map((slot) => slot.hourly_rate).filter((rate) => rate > 0);
  return rates.length ? Math.min(...rates) : null;
}

function formatRate(slots: ParkingSlot[]) {
  const lowestRate = getLowestRate(slots);

  if (lowestRate === null) {
    return "Rate unavailable";
  }

  return `$${lowestRate.toFixed(2)} / hr`;
}

function getStatusClasses(status: ParkingArea["status"]) {
  if (status === "open") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (status === "busy") return "bg-amber-50 text-amber-700 ring-amber-100";
  if (status === "full") return "bg-red-50 text-red-700 ring-red-100";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceKm(area: ParkingArea, userLocation: UserLocation | null) {
  if (
    !userLocation ||
    area.latitude === null ||
    area.longitude === null ||
    Number.isNaN(Number(area.latitude)) ||
    Number.isNaN(Number(area.longitude))
  ) {
    return null;
  }

  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(Number(area.latitude) - userLocation.latitude);
  const longitudeDelta = toRadians(Number(area.longitude) - userLocation.longitude);
  const userLatitude = toRadians(userLocation.latitude);
  const areaLatitude = toRadians(Number(area.latitude));
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(userLatitude) * Math.cos(areaLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function formatDistance(distanceKm: number | null) {
  if (distanceKm === null) {
    return "Distance unavailable";
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }

  return `${distanceKm.toFixed(1)} km away`;
}

function createBookingHref(area: ParkingAreaWithSlots) {
  const firstAvailableSlot = getAvailableSlots(area.slots)[0];
  const params = new URLSearchParams({ areaId: area.id });

  if (firstAvailableSlot) {
    params.set("slotId", firstAvailableSlot.id);
  }

  return `/bookings?${params.toString()}`;
}

export function SearchParkingClient() {
  const [areas, setAreas] = useState<ParkingAreaWithSlots[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [radiusKm, setRadiusKm] = useState("10");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

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

        if (!isMounted) return;

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
        if (isMounted) setIsLoading(false);
      }
    }

    loadParkingData();

    return () => {
      isMounted = false;
    };
  }, []);

  const areasWithDistance = useMemo(
    () =>
      areas.map((area) => ({
        ...area,
        distanceKm: getDistanceKm(area, userLocation),
      })),
    [areas, userLocation],
  );

  const filteredAreas = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const normalizedLocation = locationQuery.trim().toLowerCase();
    const radius = Number(radiusKm);

    return areasWithDistance
      .filter((area) => {
        const searchableValues = [area.name, area.address, area.description, area.status]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (normalizedSearch && !searchableValues.includes(normalizedSearch)) {
          return false;
        }

        if (normalizedLocation && !searchableValues.includes(normalizedLocation)) {
          return false;
        }

        if (userLocation && Number.isFinite(radius) && area.distanceKm !== null) {
          return area.distanceKm <= radius;
        }

        return true;
      })
      .sort((a, b) => {
        if (a.distanceKm === null && b.distanceKm === null) return a.name.localeCompare(b.name);
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
  }, [areasWithDistance, locationQuery, radiusKm, searchQuery, userLocation]);

  const nearbyAreas = filteredAreas.slice(0, 5);

  function handleUseCurrentLocation() {
    setLocationMessage(null);

    if (!navigator.geolocation) {
      setLocationMessage("Geolocation is not available in this browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationMessage("Using your current location for nearby parking results.");
        setIsLocating(false);
      },
      () => {
        setLocationMessage("Unable to access your location. You can still search by address.");
        setIsLocating(false);
      },
      {
        enableHighAccuracy: false,
        maximumAge: 300_000,
        timeout: 8_000,
      },
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <div className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-2xl shadow-blue-950/10 backdrop-blur sm:p-6">
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr] xl:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
              Live database search
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Search parking by location
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Results are loaded from Supabase `parking_areas` and `parking_slots` tables.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <label>
              <span className="sr-only">Search parking areas</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name or amenity"
                className="w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <label>
              <span className="sr-only">Filter by location</span>
              <input
                type="search"
                value={locationQuery}
                onChange={(event) => setLocationQuery(event.target.value)}
                placeholder="Filter by suburb, street, or address"
                className="w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-xl shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLocating ? "Locating..." : "Use my location"}
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-3 text-sm font-bold text-slate-600">
            Radius
            <select
              value={radiusKm}
              onChange={(event) => setRadiusKm(event.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option value="2">2 km</option>
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="25">25 km</option>
              <option value="100">100 km</option>
            </select>
          </label>
          {locationMessage ? <p className="text-sm font-semibold text-slate-500">{locationMessage}</p> : null}
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <aside className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-blue-950/5">
          <div className="border-b border-slate-100 p-5">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
              Map preview
            </p>
            <h3 className="mt-2 text-2xl font-black text-slate-950">Nearby parking areas</h3>
          </div>
          <div className="relative h-[28rem] bg-blue-50">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.07)_1px,transparent_1px),linear-gradient(180deg,rgba(15,23,42,0.07)_1px,transparent_1px)] bg-[size:48px_48px]" />
            <div className="absolute left-8 right-8 top-1/2 h-3 -translate-y-1/2 rounded-full bg-white shadow-lg" />
            <div className="absolute bottom-12 left-1/2 top-10 w-3 -translate-x-1/2 rounded-full bg-white shadow-lg" />
            {nearbyAreas.map((area, index) => (
              <div
                key={area.id}
                className="absolute rounded-full bg-blue-600 px-3 py-2 text-xs font-black text-white shadow-xl shadow-blue-950/20 ring-4 ring-white"
                style={{
                  left: `${18 + (index * 17) % 62}%`,
                  top: `${20 + (index * 23) % 58}%`,
                }}
              >
                {index + 1}
                <span className="sr-only">{area.name}</span>
              </div>
            ))}
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/90 p-4 shadow-xl backdrop-blur">
              <p className="text-sm font-black text-slate-950">Google Maps style placeholder</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Connect Google Maps or Mapbox here when API keys are available. Pins reflect the current nearby results.
              </p>
            </div>
          </div>
        </aside>

        <div>
          {isLoading ? (
            <div className="grid gap-5 md:grid-cols-2">
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-80 animate-pulse rounded-[1.75rem] border border-slate-200 bg-white shadow-sm"
                />
              ))}
            </div>
          ) : null}

          {!isLoading && errorMessage ? (
            <div className="rounded-[1.75rem] border border-red-100 bg-red-50 p-6 text-red-800 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.18em]">Connection error</p>
              <p className="mt-3 text-sm leading-6">{errorMessage}</p>
            </div>
          ) : null}

          {!isLoading && !errorMessage && !filteredAreas.length ? (
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
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
            <div className="grid gap-5 md:grid-cols-2">
              {filteredAreas.map((area) => {
                const availableSlots = getAvailableSlotCount(area.slots);
                const totalSlots = area.slots.length || area.total_slots;
                const availabilityPercent = totalSlots
                  ? Math.round((availableSlots / totalSlots) * 100)
                  : 0;
                const canBook = availableSlots > 0;

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

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-blue-50 p-4">
                        <p className="text-xs font-bold text-blue-700">Available slots</p>
                        <p className="mt-2 text-2xl font-black text-slate-950">{availableSlots}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-bold text-slate-500">Distance</p>
                        <p className="mt-2 text-sm font-black text-slate-950">
                          {formatDistance(area.distanceKm)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-bold text-slate-500">Price per hour</p>
                        <p className="mt-2 text-sm font-black text-slate-950">{formatRate(area.slots)}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-bold text-slate-500">Total slots</p>
                        <p className="mt-2 text-2xl font-black text-slate-950">{totalSlots}</p>
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
                      href={createBookingHref(area)}
                      aria-disabled={!canBook}
                      className={`mt-6 inline-flex w-full justify-center rounded-full px-5 py-3 text-sm font-black shadow-xl transition ${
                        canBook
                          ? "bg-slate-950 text-white shadow-slate-900/10 hover:-translate-y-0.5 hover:bg-blue-700"
                          : "pointer-events-none bg-slate-200 text-slate-500 shadow-none"
                      }`}
                    >
                      {canBook ? "Book parking slot" : "No slots available"}
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
