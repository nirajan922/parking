import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { listLatestPredictions } from "@/services/predictionService";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const limit = request.nextUrl.searchParams.get("limit");
    const predictions = await listLatestPredictions({
      client: supabase,
      parkingAreaId: request.nextUrl.searchParams.get("parkingAreaId") ?? undefined,
      limit: limit ? Number(limit) : undefined,
    });

    return NextResponse.json({ data: predictions });
  } catch {
    return NextResponse.json(
      { error: "Unable to load parking predictions." },
      { status: 500 },
    );
  }
}
