import { NextResponse, type NextRequest } from "next/server";
import { getApiErrorStatus, isUuid } from "@/lib/apiValidation";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAuthenticatedUser } from "@/services/authService";
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

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid booking id." }, { status: 400 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { status?: string };

    if (body.status !== "cancelled") {
      return NextResponse.json({ error: "Only booking cancellation is supported." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const user = await requireAuthenticatedUser(supabase);
    const booking = await getCurrentUserBookingById(id, supabase);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    if (!["pending", "confirmed"].includes(booking.status)) {
      return NextResponse.json(
        { error: "Only pending or confirmed bookings can be cancelled." },
        { status: 400 },
      );
    }

    const admin = createSupabaseAdminClient();
    const { data: cancelledBooking, error } = await admin
      .from("bookings")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: "Unable to cancel booking." }, { status: 500 });
    }

    const { count } = await admin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("parking_slot_id", booking.parking_slot_id)
      .in("status", ["pending", "confirmed"]);

    if (!count) {
      await admin
        .from("parking_slots")
        .update({
          status: "available",
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.parking_slot_id)
        .eq("status", "reserved");
    }

    return NextResponse.json({ data: cancelledBooking });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to cancel booking." },
      { status: getApiErrorStatus(error) },
    );
  }
}
