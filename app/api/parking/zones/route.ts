import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { listParkingZones } from "@/services/parkingService";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const limit = request.nextUrl.searchParams.get("limit");
    const zones = await listParkingZones({
      client: supabase,
      onlyAvailable: request.nextUrl.searchParams.get("available") === "true",
      limit: limit ? Number(limit) : undefined,
    });

    return NextResponse.json({ data: zones });
  } catch {
    return NextResponse.json(
      { error: "Unable to load parking zones." },
      { status: 500 },
    );
  }
}
