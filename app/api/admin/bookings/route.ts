import { NextResponse, type NextRequest } from "next/server";
import type { BookingStatus } from "@/lib/database.types";
import { parseLimit } from "@/lib/apiValidation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdminUser } from "@/services/authService";
import { listAdminBookingOverview } from "@/services/bookingService";

const bookingStatuses = new Set<BookingStatus>([
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "expired",
]);

function parseBookingStatus(value: string | null): BookingStatus | undefined {
  if (!value) {
    return undefined;
  }

  if (!bookingStatuses.has(value as BookingStatus)) {
    throw new Error("Invalid booking status filter.");
  }

  return value as BookingStatus;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    await requireAdminUser(supabase);

    const bookings = await listAdminBookingOverview({
      client: supabase,
      limit: parseLimit(request.nextUrl.searchParams.get("limit"), 50, 200),
      status: parseBookingStatus(request.nextUrl.searchParams.get("status")),
    });

    return NextResponse.json({ data: bookings });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Authentication is required")) {
      return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes("Administrator access")) {
      return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
    }

    if (error instanceof Error && error.message.includes("Invalid booking status")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Unable to load admin booking overview." },
      { status: 500 },
    );
  }
}
