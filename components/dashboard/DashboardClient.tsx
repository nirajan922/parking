"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { getDemoBookings, getDemoSession, getSydneyDemoSlots, SYDNEY_PARKING_AREAS, type DemoUser } from "@/lib/demoMode";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";

type UserInfo = {
  email: string;
  displayName: string;
  id: string;
  isDemo: boolean;
};

type DashboardSummary = {
  totalParkingAreas: number;
  totalSlots: number;
  availableSlots: number;
  activeBookings: number;
  averageConfidence: number;
  availabilityRate: number;
  parkingAreas: Array<{ id: string; name: string; total_slots: number; status: string }>;
  recentPredictions: Array<{
    id: string;
    parking_area_id: string;
    predicted_available_slots: number;
    confidence_score: number;
    prediction_window_start: string;
    prediction_window_end: string;
    model_version: string | null;
    created_at: string;
    metadata: {
      availabilityLevel?: string;
      recommendationMessage?: string;
      ruleContext?: {
        timeSegment?: string;
      };
    } | null;
  }>;
  demandSummary: Record<string, number>;
};

function buildDemoSummary(): DashboardSummary {
  const slots = getSydneyDemoSlots();
  const bookings = getDemoBookings();
  const availableSlots = slots.filter((slot) => slot.status === "available").length;

  return {
    totalParkingAreas: SYDNEY_PARKING_AREAS.length,
    totalSlots: slots.length,
    availableSlots,
    activeBookings: bookings.filter((booking) => ["pending", "confirmed"].includes(booking.status)).length,
    averageConfidence: 0.82,
    availabilityRate: Math.round((availableSlots / slots.length) * 100),
    parkingAreas: SYDNEY_PARKING_AREAS.map((area) => ({
      id: area.id,
      name: area.name,
      total_slots: area.total_slots,
      status: area.status,
    })),
    recentPredictions: [],
    demandSummary: {
      baseline: 1,
      morning_peak: 1,
      evening_peak: 1,
    },
  };
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function DashboardClient() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [predictionTime, setPredictionTime] = useState("");
  const [predictionMessage, setPredictionMessage] = useState<string | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const demoUser: DemoUser | null = getDemoSession();
      if (demoUser) {
        setUser({
          email: demoUser.email,
          displayName: demoUser.fullName,
          id: demoUser.id,
          isDemo: true,
        });
        const demoSummary = buildDemoSummary();
        setSummary(demoSummary);
        setSelectedAreaId(demoSummary.parkingAreas[0]?.id ?? "");
        setIsLoading(false);
        return;
      }

      if (!isSupabaseConfigured()) {
        router.replace("/login?next=/dashboard");
        setIsLoading(false);
        return;
      }

      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user: sbUser } } = await supabase.auth.getUser();
        if (!sbUser) {
          router.replace("/login?next=/dashboard");
          return;
        }
        setUser({
          email: sbUser.email ?? "No email",
          displayName:
            sbUser.user_metadata?.full_name?.toString() || sbUser.email || "User",
          id: sbUser.id,
          isDemo: false,
        });
        const response = await fetch("/api/dashboard", { cache: "no-store" });
        const payload = (await response.json()) as { data?: DashboardSummary; error?: string };
        if (response.ok && payload.data) {
          setSummary(payload.data);
          setSelectedAreaId(payload.data.parkingAreas[0]?.id ?? "");
        } else {
          setDashboardError(payload.error ?? "Unable to load dashboard summary.");
        }
      } catch {
        router.replace("/login?next=/dashboard");
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [router]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="h-48 animate-pulse rounded-[2rem] bg-white shadow-xl shadow-blue-950/5" />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-[1.75rem] bg-white shadow-sm" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!user) return null;
  const currentUser = user;

  async function refreshDashboard() {
    if (currentUser.isDemo) {
      setSummary(buildDemoSummary());
      return;
    }

    const response = await fetch("/api/dashboard", { cache: "no-store" });
    const payload = (await response.json()) as { data?: DashboardSummary; error?: string };
    if (response.ok && payload.data) {
      setSummary(payload.data);
    }
  }

  async function handleGeneratePrediction() {
    if (!summary?.parkingAreas.length || !selectedAreaId) return;

    if (currentUser.isDemo) {
      setPredictionMessage("Demo mode shows sample dashboard evidence. Sign in with Supabase to store predictions.");
      return;
    }

    setIsPredicting(true);
    setPredictionMessage(null);
    setDashboardError(null);

    try {
      const start = predictionTime ? new Date(predictionTime) : new Date();
      const response = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parkingAreaId: selectedAreaId,
          predictionWindowStart: start.toISOString(),
          predictionWindowEnd: new Date(start.getTime() + 60 * 60 * 1000).toISOString(),
        }),
      });
      const payload = (await response.json()) as {
        data?: {
          availabilityLevel: string;
          estimatedAvailableSlots: number;
          confidenceScore: number;
          recommendationMessage: string;
        };
        error?: string;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Unable to generate prediction.");
      }

      setPredictionMessage(
        `${payload.data.availabilityLevel.toUpperCase()}: ${payload.data.estimatedAvailableSlots} slots expected, ${Math.round(payload.data.confidenceScore * 100)}% confidence. ${payload.data.recommendationMessage}`,
      );
      await refreshDashboard();
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : "Unable to generate prediction.");
    } finally {
      setIsPredicting(false);
    }
  }

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
                  Protected dashboard
                </span>
              </span>
            </Link>
            <h1 className="mt-8 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Welcome, {user.displayName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Your authenticated Smart Parking dashboard is ready for live bookings, availability predictions, and parking area operations.
            </p>
            {user.isDemo ? (
              <span className="mt-3 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-100">
                Demo mode
              </span>
            ) : null}
          </div>
          <LogoutButton />
        </header>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          {(
            [
              ["Parking Areas", String(summary?.totalParkingAreas ?? 0), "Saved Supabase parking areas, including imported OSM results."],
              ["Available Slots", `${summary?.availableSlots ?? 0}/${summary?.totalSlots ?? 0}`, `${summary?.availabilityRate ?? 0}% currently marked available.`],
              ["Active Bookings", String(summary?.activeBookings ?? 0), "Pending or confirmed bookings for this user."],
            ] as const
          ).map(([label, value, description]) => (
            <article
              key={label}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/10"
            >
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                {label}
              </p>
              <p className="mt-4 text-3xl font-black text-slate-950">{value}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </section>

        {dashboardError ? (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {dashboardError}
          </div>
        ) : null}

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-blue-950/5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                Baseline prediction engine
              </p>
              <h2 className="mt-3 text-2xl font-black text-slate-950">Generate availability forecast</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                This stores a rule-based baseline prediction using current availability, selected time, weekday/weekend, and demand segment.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
              <select
                value={selectedAreaId}
                onChange={(event) => setSelectedAreaId(event.target.value)}
                className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              >
                {summary?.parkingAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
              <input
                type="datetime-local"
                value={predictionTime}
                onChange={(event) => setPredictionTime(event.target.value)}
                className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={handleGeneratePrediction}
                disabled={isPredicting || !selectedAreaId}
                className="rounded-full bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-xl shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPredicting ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
          {predictionMessage ? (
            <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              {predictionMessage}
            </div>
          ) : null}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Average Confidence</p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {Math.round((summary?.averageConfidence ?? 0) * 100)}%
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Recent Predictions</p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {summary?.recentPredictions.length ?? 0}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Demand Segments</p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {Object.keys(summary?.demandSummary ?? {}).length}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-blue-950/5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                Recent predictions
              </p>
              <h2 className="mt-3 text-2xl font-black text-slate-950">Prediction history</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">
              Avg confidence {Math.round((summary?.averageConfidence ?? 0) * 100)}%
            </span>
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-5 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              <span>Window</span>
              <span>Availability</span>
              <span>Slots</span>
              <span>Confidence</span>
              <span>Model</span>
            </div>
            {summary?.recentPredictions.length ? (
              summary.recentPredictions.map((prediction) => (
                <div
                  key={prediction.id}
                  className="grid grid-cols-5 gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-700"
                >
                  <span className="font-semibold">{formatDateTime(prediction.prediction_window_start)}</span>
                  <span className="font-black capitalize text-slate-950">
                    {prediction.metadata?.availabilityLevel ?? "baseline"}
                  </span>
                  <span>{prediction.predicted_available_slots}</span>
                  <span>{Math.round(prediction.confidence_score * 100)}%</span>
                  <span className="break-all">{prediction.model_version ?? "baseline-rule-v1"}</span>
                </div>
              ))
            ) : (
              <p className="border-t border-slate-100 px-4 py-6 text-sm font-semibold text-slate-500">
                No stored predictions yet. Generate one above to populate this table.
              </p>
            )}
          </div>
        </section>

        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/parking/search"
            className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10"
          >
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Search</p>
            <p className="mt-3 text-lg font-black text-slate-950">Find Parking</p>
            <p className="mt-2 text-sm text-slate-600">Search nearby parking areas</p>
          </Link>
          <Link
            href="/bookings"
            className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10"
          >
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Book</p>
            <p className="mt-3 text-lg font-black text-slate-950">Book a Slot</p>
            <p className="mt-2 text-sm text-slate-600">Reserve available parking</p>
          </Link>
          <Link
            href="/my-bookings"
            className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10"
          >
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">History</p>
            <p className="mt-3 text-lg font-black text-slate-950">My Bookings</p>
            <p className="mt-2 text-sm text-slate-600">View your reservations</p>
          </Link>
          <Link
            href="/"
            className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10"
          >
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Home</p>
            <p className="mt-3 text-lg font-black text-slate-950">Landing Page</p>
            <p className="mt-2 text-sm text-slate-600">Back to the homepage</p>
          </Link>
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-blue-950/5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                Account
              </p>
              <h2 className="mt-3 text-2xl font-black text-slate-950">Authenticated user</h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100">
              Signed in
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Email</p>
              <p className="mt-2 break-all text-sm font-semibold text-slate-800">
                {user.email}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                User ID
              </p>
              <p className="mt-2 break-all text-sm font-semibold text-slate-800">{user.id}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
