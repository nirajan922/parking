import { NextResponse, type NextRequest } from "next/server";
import { isUuid } from "@/lib/apiValidation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getParkingAreaById, listParkingSlots } from "@/services/parkingService";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid parking area id." }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const area = await getParkingAreaById(id, supabase);

    if (!area) {
      return NextResponse.json({ error: "Parking area not found." }, { status: 404 });
    }

    const slots = await listParkingSlots({
      client: supabase,
      parkingAreaId: id,
      limit: 100,
    });

    return NextResponse.json({ data: { ...area, slots } });
  } catch {
    return NextResponse.json(
      { error: "Unable to load parking area." },
      { status: 500 },
    );
  }
}
