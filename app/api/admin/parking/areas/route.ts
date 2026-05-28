import { NextResponse, type NextRequest } from "next/server";
import type { ParkingAreaStatus } from "@/lib/database.types";
import { adminErrorResponse, requireAdminClient } from "@/lib/adminApi";
import { parseJsonBody, parseLimit } from "@/lib/apiValidation";
import {
  createParkingArea,
  listParkingAreas,
  type CreateParkingAreaInput,
} from "@/services/parkingService";

const areaStatuses = new Set<ParkingAreaStatus>(["open", "busy", "full", "maintenance"]);

function isCreateAreaBody(value: unknown): value is CreateParkingAreaInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const body = value as Record<string, unknown>;

  return (
    typeof body.name === "string" &&
    typeof body.slug === "string" &&
    (body.description === undefined || typeof body.description === "string") &&
    (body.address === undefined || typeof body.address === "string") &&
    (body.latitude === undefined || typeof body.latitude === "number" || body.latitude === null) &&
    (body.longitude === undefined || typeof body.longitude === "number" || body.longitude === null) &&
    (body.status === undefined || areaStatuses.has(body.status as ParkingAreaStatus))
  );
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await requireAdminClient();
    const areas = await listParkingAreas({
      client: supabase,
      limit: parseLimit(request.nextUrl.searchParams.get("limit"), 100, 250),
    });

    return NextResponse.json({ data: areas });
  } catch (error) {
    return adminErrorResponse(error, "Unable to load parking areas.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await requireAdminClient();
    const body = await parseJsonBody(request);

    if (!isCreateAreaBody(body)) {
      return NextResponse.json(
        { error: "name and slug are required; status must be valid when provided." },
        { status: 400 },
      );
    }

    const area = await createParkingArea(body, supabase);

    return NextResponse.json({ data: area }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error, "Unable to create parking area.");
  }
}
