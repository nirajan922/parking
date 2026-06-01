import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAuthenticatedUser } from "@/services/authService";

type PredictionMetadata = {
  availabilityLevel?: string;
  ruleContext?: {
    timeSegment?: string;
  };
};

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await requireAuthenticatedUser(supabase);

    const [
      { count: totalAreas, error: areasError },
      { count: totalSlots, error: slotsError },
      { count: availableSlots, error: availableError },
      { count: activeBookings, error: bookingsError },
      { data: areas, error: areaListError },
      { data: predictions, error: predictionsError },
    ] = await Promise.all([
      supabase.from("parking_areas").select("id", { count: "exact", head: true }),
      supabase.from("parking_slots").select("id", { count: "exact", head: true }),
      supabase
        .from("parking_slots")
        .select("id", { count: "exact", head: true })
        .eq("status", "available"),
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("status", ["pending", "confirmed"]),
      supabase
        .from("parking_areas")
        .select("id, name, slug, total_slots, status")
        .order("name", { ascending: true })
        .limit(20),
      supabase
        .from("predictions")
        .select("id, parking_area_id, predicted_available_slots, confidence_score, prediction_window_start, prediction_window_end, model_version, created_at, metadata")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    if (areasError || slotsError || availableError || bookingsError || areaListError || predictionsError) {
      return NextResponse.json({ error: "Unable to load dashboard summary." }, { status: 500 });
    }

    const confidenceValues = (predictions ?? []).map((prediction) => prediction.confidence_score);
    const averageConfidence = confidenceValues.length
      ? Number(
          (
            confidenceValues.reduce((total, confidence) => total + confidence, 0) /
            confidenceValues.length
          ).toFixed(2),
        )
      : 0;

    const availabilityRate = totalSlots
      ? Math.round(((availableSlots ?? 0) / totalSlots) * 100)
      : 0;

    const demandSummary = (predictions ?? []).reduce<Record<string, number>>((summary, prediction) => {
      const metadata = prediction.metadata as PredictionMetadata | null;
      const key = metadata?.ruleContext?.timeSegment ?? "baseline";
      summary[key] = (summary[key] ?? 0) + 1;
      return summary;
    }, {});

    return NextResponse.json({
      data: {
        totalParkingAreas: totalAreas ?? 0,
        totalSlots: totalSlots ?? 0,
        availableSlots: availableSlots ?? 0,
        activeBookings: activeBookings ?? 0,
        parkingAreas: areas ?? [],
        recentPredictions: predictions ?? [],
        averageConfidence,
        availabilityRate,
        demandSummary,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Authentication is required")) {
      return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    }

    return NextResponse.json({ error: "Dashboard service is not configured." }, { status: 500 });
  }
}
