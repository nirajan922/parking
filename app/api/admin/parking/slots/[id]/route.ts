import { NextResponse, type NextRequest } from "next/server";
import type { ParkingSlotStatus } from "@/lib/database.types";
import { adminErrorResponse, requireAdminClient } from "@/lib/adminApi";
import { isUuid, parseJsonBody } from "@/lib/apiValidation";
import { updateParkingSlot, type UpdateParkingSlotInput } from "@/services/parkingService";

const slotStatuses = new Set<ParkingSlotStatus>([
  "available",
  "occupied",
  "reserved",
  "maintenance",
]);

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function isUpdateSlotBody(value: unknown): value is Omit<UpdateParkingSlotInput, "parkingSlotId"> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const body = value as Record<string, unknown>;

  return (
    (body.parkingAreaId === undefined ||
      (typeof body.parkingAreaId === "string" && isUuid(body.parkingAreaId))) &&
    (body.slotNumber === undefined || typeof body.slotNumber === "string") &&
    (body.level === undefined || typeof body.level === "string" || body.level === null) &&
    (body.status === undefined || slotStatuses.has(body.status as ParkingSlotStatus)) &&
    (body.isAccessible === undefined || typeof body.isAccessible === "boolean") &&
    (body.hasEvCharger === undefined || typeof body.hasEvCharger === "boolean") &&
    (body.hourlyRate === undefined || typeof body.hourlyRate === "number")
  );
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid parking slot id." }, { status: 400 });
  }

  try {
    const supabase = await requireAdminClient();
    const body = await parseJsonBody(request);

    if (!isUpdateSlotBody(body)) {
      return NextResponse.json({ error: "Invalid parking slot update body." }, { status: 400 });
    }

    const slot = await updateParkingSlot({ ...body, parkingSlotId: id }, supabase);

    return NextResponse.json({ data: slot });
  } catch (error) {
    return adminErrorResponse(error, "Unable to update parking slot.");
  }
}
