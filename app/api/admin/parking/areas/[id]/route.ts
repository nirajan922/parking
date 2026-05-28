import { NextResponse, type NextRequest } from "next/server";
import type { ParkingAreaStatus } from "@/lib/database.types";
import { adminErrorResponse, requireAdminClient } from "@/lib/adminApi";
import { isUuid, parseJsonBody } from "@/lib/apiValidation";
import { updateParkingArea, type UpdateParkingAreaInput } from "@/services/parkingService";

const areaStatuses = new Set<ParkingAreaStatus>(["open", "busy", "full", "maintenance"]);

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function isUpdateAreaBody(value: unknown): value is Omit<UpdateParkingAreaInput, "parkingAreaId"> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const body = value as Record<string, unknown>;

  return (
    (body.name === undefined || typeof body.name === "string") &&
    (body.slug === undefined || typeof body.slug === "string") &&
    (body.description === undefined || typeof body.description === "string" || body.description === null) &&
    (body.address === undefined || typeof body.address === "string" || body.address === null) &&
    (body.latitude === undefined || typeof body.latitude === "number" || body.latitude === null) &&
    (body.longitude === undefined || typeof body.longitude === "number" || body.longitude === null) &&
    (body.status === undefined || areaStatuses.has(body.status as ParkingAreaStatus))
  );
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid parking area id." }, { status: 400 });
  }

  try {
    const supabase = await requireAdminClient();
    const body = await parseJsonBody(request);

    if (!isUpdateAreaBody(body)) {
      return NextResponse.json({ error: "Invalid parking area update body." }, { status: 400 });
    }

    const area = await updateParkingArea({ ...body, parkingAreaId: id }, supabase);

    return NextResponse.json({ data: area });
  } catch (error) {
    return adminErrorResponse(error, "Unable to update parking area.");
  }
}
