import { NextResponse, type NextRequest } from "next/server";
import type { ParkingSlotStatus } from "@/lib/database.types";
import { parseJsonBody } from "@/lib/apiValidation";
import { createSupabaseAdminClient } from "@/lib/supabaseServer";

type ImportSlotInput = {
  slotNumber?: string;
  level?: string | null;
  status?: ParkingSlotStatus;
  isAccessible?: boolean;
  hasEvCharger?: boolean;
  hourlyRate?: number;
};

type ImportParkingBody = {
  externalId: string;
  name: string;
  description?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  totalSlots?: number;
  slots?: ImportSlotInput[];
};

function isImportBody(value: unknown): value is ImportParkingBody {
  if (!value || typeof value !== "object") return false;
  const body = value as Record<string, unknown>;

  return (
    typeof body.externalId === "string" &&
    typeof body.name === "string" &&
    (body.description === undefined || typeof body.description === "string" || body.description === null) &&
    (body.address === undefined || typeof body.address === "string" || body.address === null) &&
    (body.latitude === undefined || typeof body.latitude === "number" || body.latitude === null) &&
    (body.longitude === undefined || typeof body.longitude === "number" || body.longitude === null) &&
    (body.totalSlots === undefined || typeof body.totalSlots === "number") &&
    (body.slots === undefined || Array.isArray(body.slots))
  );
}

function slugify(value: string) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return base || "imported-parking";
}

function normalizeRate(value: unknown) {
  const rate = typeof value === "number" && Number.isFinite(value) ? value : 8;
  return Number(Math.max(rate, 0).toFixed(2));
}

function buildSlotRows(parkingAreaId: string, slots: ImportSlotInput[] | undefined, totalSlots: number) {
  const safeTotal = Math.min(Math.max(Math.trunc(totalSlots || slots?.length || 12), 1), 80);
  const sourceSlots = slots?.length ? slots.slice(0, safeTotal) : [];

  return Array.from({ length: safeTotal }, (_, index) => {
    const slot = sourceSlots[index];
    const slotNumber = slot?.slotNumber?.trim() || `P-${index + 1}`;
    const seed = parkingAreaId.charCodeAt(0) + index + 1;

    return {
      parking_area_id: parkingAreaId,
      slot_number: slotNumber,
      level: slot?.level?.trim() || (safeTotal > 24 ? `Level ${Math.ceil((index + 1) / 20)}` : null),
      status: slot?.status ?? (seed % 5 === 0 ? "occupied" : "available"),
      is_accessible: slot?.isAccessible ?? index === 0,
      has_ev_charger: slot?.hasEvCharger ?? index === 1,
      hourly_rate: normalizeRate(slot?.hourlyRate),
    };
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);

    if (!isImportBody(body)) {
      return NextResponse.json(
        { error: "externalId and name are required for importing parking." },
        { status: 400 },
      );
    }

    const admin = createSupabaseAdminClient();
    const externalId = body.externalId.trim().slice(0, 120);
    const importedSlug = `osm-${slugify(externalId)}`;
    const now = new Date().toISOString();

    const { data: existingArea, error: existingError } = await admin
      .from("parking_areas")
      .select("*")
      .eq("source", "openstreetmap")
      .eq("external_id", externalId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: "Unable to check imported parking area." }, { status: 500 });
    }

    const areaPayload = {
      name: body.name.trim().slice(0, 120) || "Imported Parking Area",
      slug: existingArea?.slug ?? importedSlug,
      description: body.description?.trim() || "Imported from OpenStreetMap for booking prototype.",
      address: body.address?.trim() || null,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      source: "openstreetmap",
      external_id: externalId,
      total_slots: Math.min(Math.max(Math.trunc(body.totalSlots || body.slots?.length || 12), 1), 80),
      status: "open" as const,
      updated_at: now,
    };

    const writeQuery = existingArea
      ? admin
          .from("parking_areas")
          .update(areaPayload)
          .eq("id", existingArea.id)
          .select("*")
          .single()
      : admin
          .from("parking_areas")
          .insert(areaPayload)
          .select("*")
          .single();

    const { data: area, error: upsertError } = await writeQuery;

    if (upsertError) {
      return NextResponse.json({ error: "Unable to import parking area." }, { status: 500 });
    }

    const { count, error: countError } = await admin
      .from("parking_slots")
      .select("id", { count: "exact", head: true })
      .eq("parking_area_id", area.id);

    if (countError) {
      return NextResponse.json({ error: "Unable to inspect imported parking slots." }, { status: 500 });
    }

    if (!count) {
      const { error: slotError } = await admin
        .from("parking_slots")
        .insert(buildSlotRows(area.id, body.slots, area.total_slots));

      if (slotError) {
        return NextResponse.json({ error: "Unable to create imported parking slots." }, { status: 500 });
      }
    }

    const { data: slots, error: slotsError } = await admin
      .from("parking_slots")
      .select("*")
      .eq("parking_area_id", area.id)
      .order("slot_number", { ascending: true })
      .limit(100);

    if (slotsError) {
      return NextResponse.json({ error: "Imported parking area saved, but slots could not be loaded." }, { status: 500 });
    }

    return NextResponse.json({ data: { ...area, slots: slots ?? [] } }, { status: existingArea ? 200 : 201 });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("service role key is not configured") ||
        error.message.includes("Supabase is not connected"))
    ) {
      return NextResponse.json({ error: "Parking import is not configured." }, { status: 500 });
    }

    return NextResponse.json({ error: "Unable to import parking area." }, { status: 400 });
  }
}
