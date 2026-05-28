import { NextResponse, type NextRequest } from "next/server";
import { getPublicErrorMessage, isUuid, parseJsonBody, parseLimit } from "@/lib/apiValidation";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAuthenticatedUser } from "@/services/authService";
import {
  createParkingBookingForUser,
  listCurrentUserBookings,
  type CreateBookingInput,
} from "@/services/bookingService";

function isBookingRequestBody(value: unknown): value is CreateBookingInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const body = value as Record<string, unknown>;

  return (
    typeof body.parkingAreaId === "string" &&
    isUuid(body.parkingAreaId) &&
    typeof body.parkingSlotId === "string" &&
    isUuid(body.parkingSlotId) &&
    typeof body.vehiclePlate === "string" &&
    typeof body.startTime === "string" &&
    typeof body.endTime === "string"
  );
}

function getStatusFromError(error: unknown) {
  if (error instanceof Error && error.message.includes("Authentication is required")) {
    return 401;
  }

  return 400;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const limit = request.nextUrl.searchParams.get("limit");
    const bookings = await listCurrentUserBookings({
      client: supabase,
      limit: parseLimit(limit),
    });

    return NextResponse.json({ data: bookings });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to load bookings." },
      { status: getStatusFromError(error) },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);

    if (!isBookingRequestBody(body)) {
      return NextResponse.json(
        {
          error:
            "parkingAreaId, parkingSlotId, vehiclePlate, startTime, and endTime are required.",
        },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const user = await requireAuthenticatedUser(supabase);
    const adminClient = createSupabaseAdminClient();
    const booking = await createParkingBookingForUser(
      {
        ...body,
        userId: user.id,
      },
      adminClient,
    );

    return NextResponse.json({ data: booking }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Missing SUPABASE_SERVICE_ROLE_KEY")) {
      return NextResponse.json(
        { error: "Booking service is not configured." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Unable to create booking.") },
      { status: getStatusFromError(error) },
    );
  }
}
