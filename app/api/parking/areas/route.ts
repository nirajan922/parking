import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { listParkingAreas } from "@/services/parkingService";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const limit = request.nextUrl.searchParams.get("limit");
    const areas = await listParkingAreas({
      client: supabase,
      onlyAvailable: request.nextUrl.searchParams.get("available") === "true",
      limit: limit ? Number(limit) : undefined,
    });

    return NextResponse.json({ data: areas });
  } catch {
    return NextResponse.json(
      { error: "Unable to load parking areas." },
      { status: 500 },
    );
  }
}
