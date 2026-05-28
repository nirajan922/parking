import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  ParkingArea,
  ParkingAreaStatus,
  ParkingSlot,
  ParkingSlotStatus,
} from "@/lib/database.types";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

type SmartParkingClient = SupabaseClient<Database>;

type ListParkingAreasOptions = {
  client?: SmartParkingClient;
  onlyAvailable?: boolean;
  limit?: number;
};

type ListParkingSlotsOptions = {
  client?: SmartParkingClient;
  parkingAreaId?: string;
  status?: ParkingSlotStatus;
  limit?: number;
};

type AreaStatusUpdate = {
  parkingAreaId: string;
  status: ParkingAreaStatus;
};

type SlotStatusUpdate = {
  parkingSlotId: string;
  status: ParkingSlotStatus;
};

function getClient(client?: SmartParkingClient) {
  return client ?? createSupabaseBrowserClient();
}

function normalizeLimit(limit = 50) {
  if (!Number.isFinite(limit)) {
    return 50;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), 100);
}

function assertNonEmpty(value: string, fieldName: string) {
  if (!value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }
}

function throwServiceError(message: string, cause: unknown): never {
  throw new Error(message, { cause });
}

export async function listParkingAreas({
  client,
  onlyAvailable = false,
  limit,
}: ListParkingAreasOptions = {}): Promise<ParkingArea[]> {
  let query = getClient(client)
    .from("parking_areas")
    .select("*")
    .order("name", { ascending: true })
    .limit(normalizeLimit(limit));

  if (onlyAvailable) {
    query = query.in("status", ["open", "busy"]);
  }

  const { data, error } = await query;

  if (error) {
    throwServiceError("Unable to load parking areas.", error);
  }

  return data ?? [];
}

export async function getParkingAreaBySlug(
  slug: string,
  client?: SmartParkingClient,
): Promise<ParkingArea | null> {
  assertNonEmpty(slug, "Parking area slug");

  const { data, error } = await getClient(client)
    .from("parking_areas")
    .select("*")
    .eq("slug", slug.trim().toLowerCase())
    .maybeSingle();

  if (error) {
    throwServiceError("Unable to load parking area.", error);
  }

  return data;
}

export async function getParkingAreaById(
  parkingAreaId: string,
  client?: SmartParkingClient,
): Promise<ParkingArea | null> {
  assertNonEmpty(parkingAreaId, "Parking area id");

  const { data, error } = await getClient(client)
    .from("parking_areas")
    .select("*")
    .eq("id", parkingAreaId)
    .maybeSingle();

  if (error) {
    throwServiceError("Unable to load parking area.", error);
  }

  return data;
}

export async function listParkingSlots({
  client,
  parkingAreaId,
  status,
  limit,
}: ListParkingSlotsOptions = {}): Promise<ParkingSlot[]> {
  let query = getClient(client)
    .from("parking_slots")
    .select("*")
    .order("slot_number", { ascending: true })
    .limit(normalizeLimit(limit));

  if (parkingAreaId) {
    query = query.eq("parking_area_id", parkingAreaId);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throwServiceError("Unable to load parking slots.", error);
  }

  return data ?? [];
}

export async function updateParkingAreaStatus(
  { parkingAreaId, status }: AreaStatusUpdate,
  client?: SmartParkingClient,
): Promise<ParkingArea> {
  assertNonEmpty(parkingAreaId, "Parking area id");

  const { data, error } = await getClient(client)
    .from("parking_areas")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parkingAreaId)
    .select("*")
    .single();

  if (error) {
    throwServiceError("Unable to update parking area status.", error);
  }

  return data;
}

export async function updateParkingSlotStatus(
  { parkingSlotId, status }: SlotStatusUpdate,
  client?: SmartParkingClient,
): Promise<ParkingSlot> {
  assertNonEmpty(parkingSlotId, "Parking slot id");

  const { data, error } = await getClient(client)
    .from("parking_slots")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parkingSlotId)
    .select("*")
    .single();

  if (error) {
    throwServiceError("Unable to update parking slot status.", error);
  }

  return data;
}
