import { NextResponse, type NextRequest } from "next/server";
import { getApiErrorStatus, isUuid } from "@/lib/apiValidation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getCurrentUserBookingById } from "@/services/bookingService";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid booking id." }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const booking = await getCurrentUserBookingById(id, supabase);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    return NextResponse.json({ data: booking });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to load booking." },
      { status: getApiErrorStatus(error) },
    );
  }
}
