"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import type { ParkingArea, ParkingSlot } from "@/lib/database.types";

type ParkingAreaWithSlots = ParkingArea & {
  slots: ParkingSlot[];
  source?: "openstreetmap" | "supabase";
};

type UserLocation = {
  latitude: number;
  longitude: number;
  label: string;
};

type ParkingSearchResponse = {
  data?: {
    location: UserLocation;
    results: ParkingAreaWithSlots[];
    fallback?: boolean;
  };
  error?: string;
};

const cityPresets = [
  { label: "Sydney CBD", query: "Sydney CBD, NSW, Australia" },
  { label: "Bondi Beach", query: "Bondi Beach, NSW, Australia" },
  { label: "Parramatta", query: "Parramatta, NSW, Australia" },
  { label: "Chatswood", query: "Chatswood, NSW, Australia" },
  { label: "Melbourne CBD", query: "Melbourne CBD, VIC, Australia" },
  { label: "Brisbane City", query: "Brisbane City, QLD, Australia" },
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
  if (lowestRate === null) return "Rate unavailable";
  if (lowestRate === 0) return "Free";
  return `$${lowestRate.toFixed(2)} / hr`;
}

function getAvailabilityBadge(available: number, total: number) {
  if (total === 0) return { label: "Unknown", className: "bg-slate-100 text-slate-600 ring-slate-200" };
  const ratio = available / total;
  if (ratio > 0.5) return { label: "High", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
  if (ratio > 0.2) return { label: "Medium", className: "bg-amber-50 text-amber-700 ring-amber-200" };
  return { label: "Low", className: "bg-red-50 text-red-700 ring-red-200" };
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceKm(areaLat: number | null, areaLon: number | null, userLat: number, userLon: number) {
  if (areaLat === null || areaLon === null) return null;
  const R = 6371;
  const dLat = toRadians(Number(areaLat) - userLat);
  const dLon = toRadians(Number(areaLon) - userLon);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(userLat)) * Math.cos(toRadians(Number(areaLat))) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(distanceKm: number | null) {
  if (distanceKm === null) return "";
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m away`;
  return `${distanceKm.toFixed(1)} km away`;
}

function createBookingHref(area: ParkingAreaWithSlots) {
  const firstSlot = getAvailableSlots(area.slots)[0];
  const params = new URLSearchParams({ areaId: area.id });
  if (firstSlot) params.set("slotId", firstSlot.id);
  return `/bookings?${params.toString()}`;
}

async function searchParking(input: {
  query?: string;
  latitude?: number;
  longitude?: number;
  label?: string;
  radiusKm: number;
}) {
  const response = await fetch("/api/parking/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = (await response.json()) as ParkingSearchResponse;

  if (!response.ok || !payload.data) {
    const publicMessage = payload.error?.startsWith("Could not find location")
      ? payload.error
      : "Parking search is temporarily unavailable. Please try another location.";

    throw new Error(publicMessage);
  }

  return payload.data;
}

export function SearchParkingClient() {
  const router = useRouter();
  const [areas, setAreas] = useState<ParkingAreaWithSlots[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [radiusKm, setRadiusKm] = useState("2");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [importingAreaId, setImportingAreaId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const nearbyAreas = areas.slice(0, 6);
  const selectedArea = areas.find((a) => a.id === selectedAreaId) ?? nearbyAreas[0];
  const canSubmitSearch = !isSearching && searchInput.trim().length > 0;

  const areasWithDistance = useMemo(() => {
    if (!userLocation) return areas;
    return areas.map((area) => ({
      ...area,
      _distance: getDistanceKm(area.latitude, area.longitude, userLocation.latitude, userLocation.longitude),
    }));
  }, [areas, userLocation]);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!searchInput.trim()) return;

    setIsSearching(true);
    setErrorMessage(null);
    setAreas([]);
    setSearchPerformed(true);

    try {
      const search = await searchParking({
        query: searchInput.trim(),
        radiusKm: Number(radiusKm),
      });

      setUserLocation(search.location);
      setAreas(search.results);
      if (search.results.length === 0) {
        setErrorMessage(`No parking areas found within ${radiusKm} km of "${searchInput}". Try increasing the radius.`);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Parking search is temporarily unavailable. Please try another location.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  async function handleCityPreset(preset: (typeof cityPresets)[number]) {
    setSearchInput(preset.label);
    setIsSearching(true);
    setErrorMessage(null);
    setAreas([]);
    setSearchPerformed(true);

    try {
      const search = await searchParking({
        query: preset.query,
        label: preset.label,
        radiusKm: Number(radiusKm),
      });
      setUserLocation({ ...search.location, label: preset.label });
      setAreas(search.results);
      if (search.results.length === 0) {
        setErrorMessage(`No parking areas found near ${preset.label}. Try increasing the radius.`);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Parking search is temporarily unavailable. Please try another location.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setErrorMessage("Geolocation is not available in this browser.");
      return;
    }

    setIsLocating(true);
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude, label: "Your location" });
        setSearchInput("Current location");
        setIsSearching(true);
        setSearchPerformed(true);

        try {
          const search = await searchParking({
            latitude,
            longitude,
            label: "Your location",
            radiusKm: Number(radiusKm),
          });
          setUserLocation(search.location);
          setAreas(search.results);
          if (search.results.length === 0) {
            setErrorMessage(`No parking areas found within ${radiusKm} km of your location.`);
          }
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Parking search is temporarily unavailable. Please try another location.",
          );
        } finally {
          setIsSearching(false);
          setIsLocating(false);
        }
      },
      () => {
        setErrorMessage("Unable to access your location. Please search by address instead.");
        setIsLocating(false);
      },
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 8_000 },
    );
  }

  async function handleBookNow(area: ParkingAreaWithSlots) {
    setImportingAreaId(area.id);
    setErrorMessage(null);

    try {
      if (area.source === "supabase") {
        router.push(createBookingHref(area));
        return;
      }

      const response = await fetch("/api/parking/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          externalId: area.external_id ?? area.id,
          name: area.name,
          description: area.description,
          address: area.address,
          latitude: area.latitude,
          longitude: area.longitude,
          totalSlots: area.total_slots || area.slots.length,
          slots: area.slots.map((slot) => ({
            slotNumber: slot.slot_number,
            level: slot.level,
            status: slot.status,
            isAccessible: slot.is_accessible,
            hasEvCharger: slot.has_ev_charger,
            hourlyRate: slot.hourly_rate,
          })),
        }),
      });
      const payload = (await response.json()) as {
        data?: ParkingAreaWithSlots;
        error?: string;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Unable to save this parking area for booking.");
      }

      router.push(createBookingHref(payload.data));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to prepare this parking area for booking.",
      );
    } finally {
      setImportingAreaId(null);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <div className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-2xl shadow-blue-950/10 backdrop-blur sm:p-6">
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr] xl:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
              Real parking data
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Search parking by location
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Parking locations sourced from OpenStreetMap. Availability and pricing are simulated for demo purposes.
            </p>
          </div>

          <form onSubmit={handleSearch} className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <label>
              <span className="sr-only">Search by location</span>
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter suburb, city, or address..."
                className="w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <button
              type="submit"
              disabled={!canSubmitSearch}
              suppressHydrationWarning
              className="rounded-full bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-xl shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating || isSearching}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-xl shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLocating ? "Locating..." : "My location"}
            </button>
          </form>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-3 text-sm font-bold text-slate-600">
            Search radius
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(e.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option value="0.5">500 m</option>
              <option value="1">1 km</option>
              <option value="2">2 km</option>
              <option value="5">5 km</option>
              <option value="10">10 km</option>
            </select>
          </label>
          {userLocation ? (
            <p className="text-sm font-semibold text-slate-500">
              Showing results near {userLocation.label}
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {cityPresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handleCityPreset(preset)}
              disabled={isSearching}
              className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100 disabled:opacity-60"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <aside className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-blue-950/5">
          <div className="border-b border-slate-100 p-5">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
              Nearby results
            </p>
            <h3 className="mt-2 text-2xl font-black text-slate-950">
              {areas.length > 0 ? `${areas.length} parking areas found` : "Search to find parking"}
            </h3>
          </div>

          {areas.length > 0 ? (
            <div className="space-y-3 p-5">
              {nearbyAreas.map((area, index) => {
                const dist = userLocation
                  ? getDistanceKm(area.latitude, area.longitude, userLocation.latitude, userLocation.longitude)
                  : null;
                return (
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
                        {dist !== null ? formatDistance(dist) : (area.address ?? "")}
                      </span>
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-700 ring-1 ring-blue-100">
                      {getAvailableSlotCount(area.slots)} slots
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">
              {searchPerformed
                ? "No results. Try a different location or increase the radius."
                : "Enter a location above and click Search to find real parking areas from OpenStreetMap."}
            </div>
          )}
        </aside>

        <div>
          {isSearching ? (
            <div className="grid gap-5 md:grid-cols-2">
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-80 animate-pulse rounded-[1.75rem] border border-slate-200 bg-white shadow-sm"
                />
              ))}
            </div>
          ) : null}

          {!isSearching && errorMessage ? (
            <div className="rounded-[1.75rem] border border-red-100 bg-red-50 p-6 text-red-800 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.18em]">Search issue</p>
              <p className="mt-3 text-sm leading-6">{errorMessage}</p>
            </div>
          ) : null}

          {!isSearching && !errorMessage && !searchPerformed ? (
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
                OpenStreetMap powered
              </p>
              <h3 className="mt-3 text-2xl font-black text-slate-950">
                Search for real parking areas
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
                Enter a location, suburb, or city name above to find real parking areas from OpenStreetMap.
                Availability and pricing are simulated for demonstration.
              </p>
            </div>
          ) : null}

          {!isSearching && !errorMessage && areas.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              {(areasWithDistance as (ParkingAreaWithSlots & { _distance?: number | null })[]).map((area) => {
                const availableSlots = getAvailableSlotCount(area.slots);
                const totalSlots = area.slots.length || area.total_slots;
                const availabilityPercent = totalSlots
                  ? Math.round((availableSlots / totalSlots) * 100)
                  : 0;
                const canBook = availableSlots > 0;
                const badge = getAvailabilityBadge(availableSlots, totalSlots);
                const dist = area._distance ?? (userLocation
                  ? getDistanceKm(area.latitude, area.longitude, userLocation.latitude, userLocation.longitude)
                  : null);

                return (
                  <article
                    key={area.id}
                    onMouseEnter={() => setSelectedAreaId(area.id)}
                    className={`group rounded-[1.75rem] border bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-950/10 ${
                      selectedArea?.id === area.id ? "border-blue-300 ring-4 ring-blue-100" : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-black text-slate-950 leading-tight">{area.name}</h3>
                        <p className="mt-1 truncate text-sm text-slate-500">
                          {area.address ?? ""}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                          OpenStreetMap
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-blue-50 p-3">
                        <p className="text-xs font-bold text-blue-700">Available</p>
                        <p className="mt-1 text-xl font-black text-slate-950">{availableSlots}<span className="text-sm font-semibold text-slate-400">/{totalSlots}</span></p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs font-bold text-slate-500">Distance</p>
                        <p className="mt-1 text-sm font-black text-slate-950">
                          {dist !== null ? formatDistance(dist) : "—"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs font-bold text-slate-500">Price/hr</p>
                        <p className="mt-1 text-sm font-black text-slate-950">{formatRate(area.slots)}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs font-bold text-slate-500">Coords</p>
                        <p className="mt-1 text-xs font-semibold text-slate-700">
                          {Number(area.latitude).toFixed(4)}, {Number(area.longitude).toFixed(4)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                        <span>Availability (simulated)</span>
                        <span>{availabilityPercent}%</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-blue-100">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all duration-500"
                          style={{ width: `${availabilityPercent}%` }}
                        />
                      </div>
                    </div>

                    {area.description ? (
                      <p className="mt-3 text-xs text-slate-500">{area.description}</p>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {area.slots.some((s) => s.has_ev_charger) ? (
                        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">EV</span>
                      ) : null}
                      {area.slots.some((s) => s.is_accessible) ? (
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">Accessible</span>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBookNow(area)}
                      disabled={!canBook || importingAreaId === area.id}
                      className={`mt-5 inline-flex w-full justify-center rounded-full px-5 py-3 text-sm font-black shadow-xl transition ${
                        canBook
                          ? "bg-blue-600 text-white shadow-blue-600/25 hover:-translate-y-0.5 hover:bg-blue-700"
                          : "bg-slate-200 text-slate-500 shadow-none"
                      }`}
                    >
                      {importingAreaId === area.id
                        ? "Saving..."
                        : canBook
                          ? "Book Now"
                          : "No slots available"}
                    </button>
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
