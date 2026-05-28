"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ParkingArea, ParkingSlot } from "@/lib/database.types";
import {
  SYDNEY_PARKING_AREAS,
  getSydneyDemoSlots,
} from "@/lib/demoMode";
import { listParkingAreas, listParkingSlots } from "@/services/parkingService";

type ParkingAreaWithSlots = ParkingArea & {
  slots: ParkingSlot[];
};

type UserLocation = {
  latitude: number;
  longitude: number;
};

const cityPresets = [
  { label: "Sydney CBD", latitude: -33.8688, longitude: 151.2093 },
  { label: "Bondi Beach", latitude: -33.8915, longitude: 151.2767 },
  { label: "Parramatta", latitude: -33.8151, longitude: 151.0011 },
  { label: "Chatswood", latitude: -33.7969, longitude: 151.1811 },
];

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

function getAvailabilityBadge(available: number, total: number) {
  if (total === 0) return { label: "Unknown", className: "bg-slate-100 text-slate-600 ring-slate-200" };
  const ratio = available / total;
  if (ratio > 0.5)
    return { label: "High", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
  if (ratio > 0.2)
    return { label: "Medium", className: "bg-amber-50 text-amber-700 ring-amber-200" };
  return { label: "Low", className: "bg-red-50 text-red-700 ring-red-200" };
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

function getSimulatedDistanceKm(area: ParkingArea, index: number) {
  const seed = Array.from(area.id).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return Number((0.4 + ((seed + index * 7) % 45) / 5).toFixed(1));
}

function getMarkerPosition(index: number) {
  return {
    left: `${18 + (index * 17) % 62}%`,
    top: `${20 + (index * 23) % 58}%`,
  };
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

function buildAreasWithSlots(
  parkingAreas: ParkingArea[],
  parkingSlots: ParkingSlot[],
): ParkingAreaWithSlots[] {
  const slotsByArea = new Map<string, ParkingSlot[]>();
  parkingSlots.forEach((slot) => {
    const slots = slotsByArea.get(slot.parking_area_id) ?? [];
    slots.push(slot);
    slotsByArea.set(slot.parking_area_id, slots);
  });

  return parkingAreas.map((area) => ({
    ...area,
    slots: slotsByArea.get(area.id) ?? [],
  }));
}

export function SearchParkingClient() {
  const [areas, setAreas] = useState<ParkingAreaWithSlots[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [radiusKm, setRadiusKm] = useState("25");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

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

        if (parkingAreas.length === 0) {
          setAreas(buildAreasWithSlots(SYDNEY_PARKING_AREAS, getSydneyDemoSlots()));
          setUsingFallback(true);
        } else {
          setAreas(buildAreasWithSlots(parkingAreas, parkingSlots));
          setUsingFallback(false);
        }
      } catch {
        if (isMounted) {
          setAreas(buildAreasWithSlots(SYDNEY_PARKING_AREAS, getSydneyDemoSlots()));
          setUsingFallback(true);
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
      areas.map((area, index) => {
        const realDistance = getDistanceKm(area, userLocation);
        const shouldSimulateNearby = Boolean(userLocation || locationQuery.trim());

        return {
          ...area,
          distanceKm:
            realDistance ?? (shouldSimulateNearby ? getSimulatedDistanceKm(area, index) : null),
          markerPosition: getMarkerPosition(index),
        };
      }),
    [areas, locationQuery, userLocation],
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
  const selectedArea = filteredAreas.find((area) => area.id === selectedAreaId) ?? nearbyAreas[0];

  function handleCityPreset(city: (typeof cityPresets)[number]) {
    setUserLocation({
      latitude: city.latitude,
      longitude: city.longitude,
    });
    setLocationQuery(city.label);
    setLocationMessage(`Showing nearby parking around ${city.label}.`);
  }

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
              {usingFallback ? "Demo parking data" : "Live database search"}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Search parking by location
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              {usingFallback
                ? "Showing realistic Sydney parking locations. Connect Supabase for live data."
                : "Results loaded from your connected database."}
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
                placeholder="Filter by suburb, city, or location"
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

        <div className="mt-4 flex flex-wrap gap-2">
          {cityPresets.map((city) => (
            <button
              key={city.label}
              type="button"
              onClick={() => handleCityPreset(city)}
              className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100"
            >
              {city.label}
            </button>
          ))}
        </div>

        {usingFallback ? (
          <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span className="font-bold">Demo mode:</span> Showing sample Sydney parking data.
          </div>
        ) : null}
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
              <button
                type="button"
                key={area.id}
                onClick={() => setSelectedAreaId(area.id)}
                className={`absolute rounded-full px-3 py-2 text-xs font-black text-white shadow-xl shadow-blue-950/20 ring-4 ring-white transition hover:-translate-y-1 ${
                  selectedArea?.id === area.id ? "bg-slate-950" : "bg-blue-600"
                }`}
                style={area.markerPosition}
              >
                {index + 1}
                <span className="sr-only">{area.name}</span>
              </button>
            ))}
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/90 p-4 shadow-xl backdrop-blur">
              <p className="text-sm font-black text-slate-950">Map placeholder</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Connect Google Maps or Mapbox for interactive map. Pins reflect current results.
              </p>
              {selectedArea ? (
                <div className="mt-3 rounded-xl bg-blue-50 p-3">
                  <p className="text-sm font-black text-slate-950">{selectedArea.name}</p>
                  <p className="mt-1 text-xs font-semibold text-blue-700">
                    {formatDistance(selectedArea.distanceKm)} -{" "}
                    {getAvailableSlotCount(selectedArea.slots)} slots available
                  </p>
                </div>
              ) : null}
            </div>
          </div>
          <div className="space-y-3 p-5">
            {nearbyAreas.map((area, index) => (
              <button
                key={area.id}
                type="button"
                onClick={() => setSelectedAreaId(area.id)}
                className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${
                  selectedArea?.id === area.id
                    ? "border-blue-200 bg-blue-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <span>
                  <span className="block text-sm font-black text-slate-950">
                    {index + 1}. {area.name}
                  </span>
                  <span className="mt-1 block text-xs font-semibold text-slate-500">
                    {formatDistance(area.distanceKm)}
                  </span>
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-700 ring-1 ring-blue-100">
                  {getAvailableSlotCount(area.slots)} slots
                </span>
              </button>
            ))}
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
                No areas match your search.
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
                Try a different search term or broaden your location filter.
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
                const badge = getAvailabilityBadge(availableSlots, totalSlots);

                return (
                  <article
                    key={area.id}
                    onMouseEnter={() => setSelectedAreaId(area.id)}
                    className={`group rounded-[1.75rem] border bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-950/10 ${
                      selectedArea?.id === area.id ? "border-blue-300 ring-4 ring-blue-100" : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-black text-slate-950">{area.name}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {area.address ?? "Address not provided"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black capitalize ring-1 ${getStatusClasses(
                            area.status,
                          )}`}
                        >
                          {area.status}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${badge.className}`}
                        >
                          {badge.label} availability
                        </span>
                      </div>
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
                    </div>

                    <Link
                      href={createBookingHref(area)}
                      aria-disabled={!canBook}
                      className={`mt-6 inline-flex w-full justify-center rounded-full px-5 py-3 text-sm font-black shadow-xl transition ${
                        canBook
                          ? "bg-blue-600 text-white shadow-blue-600/25 hover:-translate-y-0.5 hover:bg-blue-700"
                          : "pointer-events-none bg-slate-200 text-slate-500 shadow-none"
                      }`}
                    >
                      {canBook ? "Book Now" : "No slots available"}
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
