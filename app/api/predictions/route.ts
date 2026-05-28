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
    const safeTotalSlots = totalSlots ?? area.total_slots;
    const predictedAvailableSlots = Math.max(0, Math.round(safeAvailableSlots * 0.92));
    const confidenceScore = safeTotalSlots > 0 ? 0.86 : 0.5;
    const adminClient = createSupabaseAdminClient();

    const prediction = await createPrediction(
      {
        parkingAreaId: body.parkingAreaId,
        predictedAvailableSlots,
        confidenceScore,
        predictionWindowStart: windowStart.toISOString(),
        predictionWindowEnd: windowEnd.toISOString(),
        modelVersion: "baseline-api-v1",
        createdBy: user.id,
        metadata: {
          source: "api_prediction_request",
          availableSlots: safeAvailableSlots,
          totalSlots: safeTotalSlots,
        },
      },
      adminClient,
    );

    return NextResponse.json({ data: prediction }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Authentication is required")) {
      return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes("Missing SUPABASE_SERVICE_ROLE_KEY")) {
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
