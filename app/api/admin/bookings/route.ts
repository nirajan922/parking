import { NextResponse, type NextRequest } from "next/server";
import type { BookingStatus } from "@/lib/database.types";
import { adminErrorResponse, requireAdminClient } from "@/lib/adminApi";
import { parseLimit } from "@/lib/apiValidation";
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
    const supabase = await requireAdminClient();

    const bookings = await listAdminBookingOverview({
      client: supabase,
      limit: parseLimit(request.nextUrl.searchParams.get("limit"), 50, 200),
      status: parseBookingStatus(request.nextUrl.searchParams.get("status")),
    });

    return NextResponse.json({ data: bookings });
  } catch (error) {
    return adminErrorResponse(error, "Unable to load admin booking overview.");
  }
}
