import { NextResponse, type NextRequest } from "next/server";
import type { ParkingSlotStatus } from "@/lib/database.types";
import { adminErrorResponse, requireAdminClient } from "@/lib/adminApi";
import { isUuid, parseJsonBody, parseLimit } from "@/lib/apiValidation";
import {
  createParkingSlot,
  listParkingSlots,
  type CreateParkingSlotInput,
} from "@/services/parkingService";

const slotStatuses = new Set<ParkingSlotStatus>([
  "available",
  "occupied",
  "reserved",
  "maintenance",
]);

function isCreateSlotBody(value: unknown): value is CreateParkingSlotInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const body = value as Record<string, unknown>;

  return (
    typeof body.parkingAreaId === "string" &&
    isUuid(body.parkingAreaId) &&
    typeof body.slotNumber === "string" &&
    (body.level === undefined || typeof body.level === "string" || body.level === null) &&
    (body.status === undefined || slotStatuses.has(body.status as ParkingSlotStatus)) &&
    (body.isAccessible === undefined || typeof body.isAccessible === "boolean") &&
    (body.hasEvCharger === undefined || typeof body.hasEvCharger === "boolean") &&
    (body.hourlyRate === undefined || typeof body.hourlyRate === "number")
  );
}

export async function GET(request: NextRequest) {
  try {
    const parkingAreaId = request.nextUrl.searchParams.get("parkingAreaId");

    if (parkingAreaId && !isUuid(parkingAreaId)) {
      return NextResponse.json({ error: "Invalid parking area id." }, { status: 400 });
    }

    const supabase = await requireAdminClient();
    const slots = await listParkingSlots({
      client: supabase,
      parkingAreaId: parkingAreaId ?? undefined,
      limit: parseLimit(request.nextUrl.searchParams.get("limit"), 100, 500),
    });

    return NextResponse.json({ data: slots });
  } catch (error) {
    return adminErrorResponse(error, "Unable to load parking slots.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await requireAdminClient();
    const body = await parseJsonBody(request);

    if (!isCreateSlotBody(body)) {
      return NextResponse.json(
        { error: "parkingAreaId and slotNumber are required; status must be valid." },
        { status: 400 },
      );
    }

    const slot = await createParkingSlot(body, supabase);

    return NextResponse.json({ data: slot }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error, "Unable to create parking slot.");
  }
}
