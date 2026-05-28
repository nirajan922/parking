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

export type CreateParkingAreaInput = {
  name: string;
  slug: string;
  description?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status?: ParkingAreaStatus;
};

export type UpdateParkingAreaInput = Partial<Omit<CreateParkingAreaInput, "slug">> & {
  parkingAreaId: string;
  slug?: string;
};

export type CreateParkingSlotInput = {
  parkingAreaId: string;
  slotNumber: string;
  level?: string | null;
  status?: ParkingSlotStatus;
  isAccessible?: boolean;
  hasEvCharger?: boolean;
  hourlyRate?: number;
};

export type UpdateParkingSlotInput = Partial<Omit<CreateParkingSlotInput, "parkingAreaId">> & {
  parkingSlotId: string;
  parkingAreaId?: string;
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

function normalizeSlug(slug: string) {
  const normalizedSlug = slug.trim().toLowerCase();

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) {
    throw new Error("Slug must use lowercase letters, numbers, and hyphens.");
  }

  return normalizedSlug;
}

function normalizeRate(rate = 0) {
  if (!Number.isFinite(rate) || rate < 0) {
    throw new Error("Hourly rate must be a non-negative number.");
  }

  return Number(rate.toFixed(2));
}

async function refreshParkingAreaTotalSlots(client: SmartParkingClient, parkingAreaId: string) {
  const { count, error } = await client
    .from("parking_slots")
    .select("id", { count: "exact", head: true })
    .eq("parking_area_id", parkingAreaId);

  if (error) {
    throwServiceError("Unable to recalculate parking area slots.", error);
  }

  const { error: updateError } = await client
    .from("parking_areas")
    .update({
      total_slots: count ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parkingAreaId);

  if (updateError) {
    throwServiceError("Unable to update parking area slot count.", updateError);
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

export async function createParkingArea(
  input: CreateParkingAreaInput,
  client?: SmartParkingClient,
): Promise<ParkingArea> {
  assertNonEmpty(input.name, "Parking area name");
  assertNonEmpty(input.slug, "Parking area slug");

  const { data, error } = await getClient(client)
    .from("parking_areas")
    .insert({
      name: input.name.trim(),
      slug: normalizeSlug(input.slug),
      description: input.description?.trim() || null,
      address: input.address?.trim() || null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      status: input.status ?? "open",
      total_slots: 0,
    })
    .select("*")
    .single();

  if (error) {
    throwServiceError("Unable to create parking area.", error);
  }

  return data;
}

export async function updateParkingArea(
  input: UpdateParkingAreaInput,
  client?: SmartParkingClient,
): Promise<ParkingArea> {
  assertNonEmpty(input.parkingAreaId, "Parking area id");

  const updatePayload: Database["public"]["Tables"]["parking_areas"]["Update"] = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) updatePayload.name = input.name.trim();
  if (input.slug !== undefined) updatePayload.slug = normalizeSlug(input.slug);
  if (input.description !== undefined) updatePayload.description = input.description?.trim() || null;
  if (input.address !== undefined) updatePayload.address = input.address?.trim() || null;
  if (input.latitude !== undefined) updatePayload.latitude = input.latitude;
  if (input.longitude !== undefined) updatePayload.longitude = input.longitude;
  if (input.status !== undefined) updatePayload.status = input.status;

  const { data, error } = await getClient(client)
    .from("parking_areas")
    .update(updatePayload)
    .eq("id", input.parkingAreaId)
    .select("*")
    .single();

  if (error) {
    throwServiceError("Unable to update parking area.", error);
  }

  return data;
}

export async function createParkingSlot(
  input: CreateParkingSlotInput,
  client?: SmartParkingClient,
): Promise<ParkingSlot> {
  assertNonEmpty(input.parkingAreaId, "Parking area id");
  assertNonEmpty(input.slotNumber, "Slot number");

  const activeClient = getClient(client);
  const { data, error } = await activeClient
    .from("parking_slots")
    .insert({
      parking_area_id: input.parkingAreaId,
      slot_number: input.slotNumber.trim(),
      level: input.level?.trim() || null,
      status: input.status ?? "available",
      is_accessible: input.isAccessible ?? false,
      has_ev_charger: input.hasEvCharger ?? false,
      hourly_rate: normalizeRate(input.hourlyRate),
    })
    .select("*")
    .single();

  if (error) {
    throwServiceError("Unable to create parking slot.", error);
  }

  await refreshParkingAreaTotalSlots(activeClient, input.parkingAreaId);

  return data;
}

export async function updateParkingSlot(
  input: UpdateParkingSlotInput,
  client?: SmartParkingClient,
): Promise<ParkingSlot> {
  assertNonEmpty(input.parkingSlotId, "Parking slot id");

  const updatePayload: Database["public"]["Tables"]["parking_slots"]["Update"] = {
    updated_at: new Date().toISOString(),
  };

  if (input.parkingAreaId !== undefined) updatePayload.parking_area_id = input.parkingAreaId;
  if (input.slotNumber !== undefined) updatePayload.slot_number = input.slotNumber.trim();
  if (input.level !== undefined) updatePayload.level = input.level?.trim() || null;
  if (input.status !== undefined) updatePayload.status = input.status;
  if (input.isAccessible !== undefined) updatePayload.is_accessible = input.isAccessible;
  if (input.hasEvCharger !== undefined) updatePayload.has_ev_charger = input.hasEvCharger;
  if (input.hourlyRate !== undefined) updatePayload.hourly_rate = normalizeRate(input.hourlyRate);

  const activeClient = getClient(client);
  const { data, error } = await activeClient
    .from("parking_slots")
    .update(updatePayload)
    .eq("id", input.parkingSlotId)
    .select("*")
    .single();

  if (error) {
    throwServiceError("Unable to update parking slot.", error);
  }

  await refreshParkingAreaTotalSlots(activeClient, data.parking_area_id);

  return data;
}
