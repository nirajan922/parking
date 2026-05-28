import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ParkingZone, ParkingZoneStatus } from "@/lib/database.types";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

type SmartParkingClient = SupabaseClient<Database>;

type ListParkingZonesOptions = {
  client?: SmartParkingClient;
  onlyAvailable?: boolean;
  limit?: number;
};

type ZoneAvailabilityUpdate = {
  parkingZoneId: string;
  availableSpaces: number;
  status?: ParkingZoneStatus;
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

export async function listParkingZones({
  client,
  onlyAvailable = false,
  limit,
}: ListParkingZonesOptions = {}): Promise<ParkingZone[]> {
  let query = getClient(client)
    .from("parking_zones")
    .select("*")
    .order("name", { ascending: true })
    .limit(normalizeLimit(limit));

  if (onlyAvailable) {
    query = query.gt("available_spaces", 0).in("status", ["open", "busy"]);
  }

  const { data, error } = await query;

  if (error) {
    throwServiceError("Unable to load parking zones.", error);
  }

  return data ?? [];
}

export async function getParkingZoneBySlug(
  slug: string,
  client?: SmartParkingClient,
): Promise<ParkingZone | null> {
  assertNonEmpty(slug, "Parking zone slug");

  const { data, error } = await getClient(client)
    .from("parking_zones")
    .select("*")
    .eq("slug", slug.trim().toLowerCase())
    .maybeSingle();

  if (error) {
    throwServiceError("Unable to load parking zone.", error);
  }

  return data;
}

export async function updateParkingZoneAvailability(
  { parkingZoneId, availableSpaces, status }: ZoneAvailabilityUpdate,
  client?: SmartParkingClient,
): Promise<ParkingZone> {
  assertNonEmpty(parkingZoneId, "Parking zone id");

  if (!Number.isInteger(availableSpaces) || availableSpaces < 0) {
    throw new Error("Available spaces must be a non-negative integer.");
  }

  const { data, error } = await getClient(client)
    .from("parking_zones")
    .update({
      available_spaces: availableSpaces,
      ...(status ? { status } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", parkingZoneId)
    .select("*")
    .single();

  if (error) {
    throwServiceError("Unable to update parking availability.", error);
  }

  return data;
}
