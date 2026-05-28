import { NextResponse, type NextRequest } from "next/server";
import { isUuid, parseIsoDate, parseJsonBody, parseLimit } from "@/lib/apiValidation";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabaseServer";
import { getParkingAreaById } from "@/services/parkingService";
import { createPrediction, listLatestPredictions } from "@/services/predictionService";
import { requireAuthenticatedUser } from "@/services/authService";

type PredictionRequestBody = {
  parkingAreaId: string;
  predictionWindowStart?: string;
  predictionWindowEnd?: string;
};

type AvailabilityLevel = "high" | "medium" | "low" | "full";

type RuleBasedPredictionInput = {
  currentAvailableSlots: number;
  totalSlots: number;
  predictionTime: Date;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getTimeSegment(hour: number) {
  if (hour >= 7 && hour <= 9) {
    return "morning_peak";
  }

  if (hour >= 11 && hour <= 13) {
    return "midday";
  }

  if (hour >= 16 && hour <= 18) {
    return "evening_peak";
  }

  if (hour >= 19 && hour <= 22) {
    return "evening";
  }

  if (hour >= 23 || hour <= 5) {
    return "overnight";
  }

  return "standard";
}

function getDemandFactor(hour: number, isWeekend: boolean) {
  const timeSegment = getTimeSegment(hour);

  if (isWeekend) {
    if (hour >= 10 && hour <= 18) {
      return { factor: 0.82, timeSegment };
    }

    if (timeSegment === "evening") {
      return { factor: 0.9, timeSegment };
    }

    if (timeSegment === "overnight") {
      return { factor: 1.12, timeSegment };
    }

    return { factor: 1.02, timeSegment };
  }

  if (timeSegment === "morning_peak" || timeSegment === "evening_peak") {
    return { factor: 0.68, timeSegment };
  }

  if (timeSegment === "midday") {
    return { factor: 0.84, timeSegment };
  }

  if (timeSegment === "standard") {
    return { factor: 0.92, timeSegment };
  }

  if (timeSegment === "evening") {
    return { factor: 1.03, timeSegment };
  }

  return { factor: 1.15, timeSegment };
}

function getAvailabilityLevel(estimatedAvailableSlots: number, totalSlots: number): AvailabilityLevel {
  if (estimatedAvailableSlots <= 0 || totalSlots <= 0) {
    return "full";
  }

  const availabilityRatio = estimatedAvailableSlots / totalSlots;

  if (availabilityRatio >= 0.5) {
    return "high";
  }

  if (availabilityRatio >= 0.25) {
    return "medium";
  }

  return "low";
}

function getRecommendationMessage(
  availabilityLevel: AvailabilityLevel,
  estimatedAvailableSlots: number,
  timeSegment: string,
  isWeekend: boolean,
) {
  const dayContext = isWeekend ? "weekend" : "weekday";

  if (availabilityLevel === "high") {
    return `Availability looks strong for this ${dayContext} ${timeSegment.replace("_", " ")} window. This is a good time to park.`;
  }

  if (availabilityLevel === "medium") {
    return `Availability is moderate with about ${estimatedAvailableSlots} slots expected. Consider booking soon.`;
  }

  if (availabilityLevel === "low") {
    return `Availability is limited during this ${timeSegment.replace("_", " ")} period. Reserve now or check nearby parking areas.`;
  }

  return "Parking is expected to be full or nearly full. Choose another area or a later time window.";
}

function calculateRuleBasedPrediction({
  currentAvailableSlots,
  totalSlots,
  predictionTime,
}: RuleBasedPredictionInput) {
  const day = predictionTime.getDay();
  const hour = predictionTime.getHours();
  const isWeekend = day === 0 || day === 6;
  const { factor, timeSegment } = getDemandFactor(hour, isWeekend);
  const utilizationRatio = totalSlots > 0 ? currentAvailableSlots / totalSlots : 0;
  const estimatedAvailableSlots = clamp(
    Math.round(currentAvailableSlots * factor),
    0,
    totalSlots,
  );
  const availabilityLevel = getAvailabilityLevel(estimatedAvailableSlots, totalSlots);
  const peakPenalty = timeSegment.includes("peak") ? 0.08 : 0;
  const capacityBoost = totalSlots >= 100 ? 0.07 : totalSlots >= 25 ? 0.04 : 0;
  const dataQualityBoost = totalSlots > 0 ? 0.08 : 0;
  const confidenceScore = Number(
    clamp(0.72 + capacityBoost + dataQualityBoost - peakPenalty, 0.5, 0.95).toFixed(2),
  );

  return {
    availabilityLevel,
    estimatedAvailableSlots,
    confidenceScore,
    recommendationMessage: getRecommendationMessage(
      availabilityLevel,
      estimatedAvailableSlots,
      timeSegment,
      isWeekend,
    ),
    ruleContext: {
      isWeekend,
      timeSegment,
      demandFactor: factor,
      currentAvailabilityRatio: Number(utilizationRatio.toFixed(4)),
    },
  };
}

function isPredictionRequestBody(value: unknown): value is PredictionRequestBody {
  if (!value || typeof value !== "object") {
    return false;
  }

  const body = value as Record<string, unknown>;

  return (
    typeof body.parkingAreaId === "string" &&
    isUuid(body.parkingAreaId) &&
    (body.predictionWindowStart === undefined ||
      typeof body.predictionWindowStart === "string") &&
    (body.predictionWindowEnd === undefined || typeof body.predictionWindowEnd === "string")
  );
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const limit = request.nextUrl.searchParams.get("limit");
    const parkingAreaId = request.nextUrl.searchParams.get("parkingAreaId");

    if (parkingAreaId && !isUuid(parkingAreaId)) {
      return NextResponse.json({ error: "Invalid parking area id." }, { status: 400 });
    }

    const predictions = await listLatestPredictions({
      client: supabase,
      parkingAreaId: parkingAreaId ?? undefined,
      limit: parseLimit(limit, 20),
    });

    return NextResponse.json({ data: predictions });
  } catch {
    return NextResponse.json(
      { error: "Unable to load parking predictions." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);

    if (!isPredictionRequestBody(body)) {
      return NextResponse.json(
        { error: "parkingAreaId is required and must be a valid UUID." },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const user = await requireAuthenticatedUser(supabase);
    const area = await getParkingAreaById(body.parkingAreaId, supabase);

    if (!area) {
      return NextResponse.json({ error: "Parking area not found." }, { status: 404 });
    }

    const now = new Date();
    const windowStart = body.predictionWindowStart
      ? parseIsoDate(body.predictionWindowStart, "predictionWindowStart")
      : now;
    const windowEnd = body.predictionWindowEnd
      ? parseIsoDate(body.predictionWindowEnd, "predictionWindowEnd")
      : new Date(windowStart.getTime() + 60 * 60 * 1000);

    if (windowEnd <= windowStart) {
      return NextResponse.json(
        { error: "predictionWindowEnd must be after predictionWindowStart." },
        { status: 400 },
      );
    }

    const [
      { count: availableSlots, error: availableError },
      { count: totalSlots, error: totalError },
    ] = await Promise.all([
      supabase
        .from("parking_slots")
        .select("id", { count: "exact", head: true })
        .eq("parking_area_id", body.parkingAreaId)
        .eq("status", "available"),
      supabase
        .from("parking_slots")
        .select("id", { count: "exact", head: true })
        .eq("parking_area_id", body.parkingAreaId),
    ]);

    if (availableError || totalError) {
      return NextResponse.json(
        { error: "Unable to calculate parking availability." },
        { status: 500 },
      );
    }

    const safeAvailableSlots = availableSlots ?? 0;
    const safeTotalSlots = totalSlots && totalSlots > 0 ? totalSlots : area.total_slots;
    const predictionResult = calculateRuleBasedPrediction({
      currentAvailableSlots: safeAvailableSlots,
      totalSlots: safeTotalSlots,
      predictionTime: windowStart,
    });
    const adminClient = createSupabaseAdminClient();

    const prediction = await createPrediction(
      {
        parkingAreaId: body.parkingAreaId,
        predictedAvailableSlots: predictionResult.estimatedAvailableSlots,
        confidenceScore: predictionResult.confidenceScore,
        predictionWindowStart: windowStart.toISOString(),
        predictionWindowEnd: windowEnd.toISOString(),
        modelVersion: "rule-based-mvp-v1",
        createdBy: user.id,
        metadata: {
          source: "api_prediction_request",
          currentAvailableSlots: safeAvailableSlots,
          totalSlots: safeTotalSlots,
          availabilityLevel: predictionResult.availabilityLevel,
          recommendationMessage: predictionResult.recommendationMessage,
          ruleContext: predictionResult.ruleContext,
          requestedAt: now.toISOString(),
        },
      },
      adminClient,
    );

    return NextResponse.json(
      {
        data: {
          predictionId: prediction.id,
          parkingAreaId: prediction.parking_area_id,
          availabilityLevel: predictionResult.availabilityLevel,
          estimatedAvailableSlots: prediction.predicted_available_slots,
          currentAvailableSlots: safeAvailableSlots,
          totalSlots: safeTotalSlots,
          confidenceScore: prediction.confidence_score,
          recommendationMessage: predictionResult.recommendationMessage,
          predictionWindowStart: prediction.prediction_window_start,
          predictionWindowEnd: prediction.prediction_window_end,
          savedAt: prediction.created_at,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("Authentication is required")) {
      return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    }

    if (
      error instanceof Error &&
      (error.message.includes("Missing SUPABASE_SERVICE_ROLE_KEY") ||
        error.message.includes("Missing Supabase public environment variables"))
    ) {
      return NextResponse.json(
        { error: "Prediction service is not configured." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Unable to create prediction request." },
      { status: 400 },
    );
  }
}
