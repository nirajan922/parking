import type { SupabaseClient, User } from "@supabase/supabase-js";
import type {
  Booking,
  BookingStatus,
  Database,
  ParkingArea,
  ParkingSlot,
  Profile,
} from "@/lib/database.types";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

type SmartParkingClient = SupabaseClient<Database>;

export type CreateBookingInput = {
  parkingAreaId: string;
  parkingSlotId: string;
  vehiclePlate: string;
  startTime: string;
  endTime: string;
};

type ListBookingsOptions = {
  client?: SmartParkingClient;
  limit?: number;
};

type ListAdminBookingsOptions = {
  client?: SmartParkingClient;
  limit?: number;
  status?: BookingStatus;
};

export type AdminBookingOverviewItem = Booking & {
  profile: Pick<Profile, "id" | "full_name" | "role"> | null;
  parkingArea: Pick<ParkingArea, "id" | "name" | "slug" | "address"> | null;
  parkingSlot: Pick<ParkingSlot, "id" | "slot_number" | "level" | "status"> | null;
};

function getClient(client?: SmartParkingClient) {
  return client ?? createSupabaseBrowserClient();
}

function normalizeLimit(limit = 25) {
  if (!Number.isFinite(limit)) {
    return 25;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), 100);
}

function assertNonEmpty(value: string, fieldName: string) {
  if (!value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }
}

function normalizeVehiclePlate(vehiclePlate: string) {
  const normalizedPlate = vehiclePlate.trim().toUpperCase();

  if (!/^[A-Z0-9 -]{2,16}$/.test(normalizedPlate)) {
    throw new Error("Vehicle plate must be 2-16 letters, numbers, spaces, or hyphens.");
  }

  return normalizedPlate;
}

function validateBookingWindow(startTime: string, endTime: string) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Booking start and end times must be valid ISO date strings.");
  }

  if (start >= end) {
    throw new Error("Booking end time must be after the start time.");
  }
}

function throwServiceError(message: string, cause: unknown): never {
  throw new Error(message, { cause });
}

async function getAuthenticatedUser(client: SmartParkingClient): Promise<User> {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error) {
    throwServiceError("Unable to verify the authenticated user.", error);
  }

  if (!user) {
    throw new Error("Authentication is required for booking operations.");
  }

  return user;
}

export async function createParkingBooking(
  input: CreateBookingInput,
  client?: SmartParkingClient,
): Promise<Booking> {
  assertNonEmpty(input.parkingAreaId, "Parking area id");
  assertNonEmpty(input.parkingSlotId, "Parking slot id");
  validateBookingWindow(input.startTime, input.endTime);

  const activeClient = getClient(client);
  const user = await getAuthenticatedUser(activeClient);
  const vehiclePlate = normalizeVehiclePlate(input.vehiclePlate);
  const { data: slot, error: slotError } = await activeClient
    .from("parking_slots")
    .select("id, parking_area_id, status")
    .eq("id", input.parkingSlotId)
    .maybeSingle();

  if (slotError) {
    throwServiceError("Unable to verify the parking slot.", slotError);
  }

  if (!slot) {
    throw new Error("Parking slot not found.");
  }

  if (slot.parking_area_id !== input.parkingAreaId) {
    throw new Error("Parking slot does not belong to the selected parking area.");
  }

  if (slot.status !== "available") {
    throw new Error("Parking slot is not available.");
  }

  const { data, error } = await activeClient
    .from("bookings")
    .insert({
      user_id: user.id,
      parking_area_id: input.parkingAreaId,
      parking_slot_id: input.parkingSlotId,
      vehicle_plate: vehiclePlate,
      start_time: new Date(input.startTime).toISOString(),
      end_time: new Date(input.endTime).toISOString(),
      status: "pending",
    })
    .select("*")
    .single();

  if (error) {
    throwServiceError("Unable to create parking booking.", error);
  }

  return data;
}

export async function listCurrentUserBookings({
  client,
  limit,
}: ListBookingsOptions = {}): Promise<Booking[]> {
  const activeClient = getClient(client);
  const user = await getAuthenticatedUser(activeClient);

  const { data, error } = await activeClient
    .from("bookings")
    .select("*")
    .eq("user_id", user.id)
    .order("start_time", { ascending: false })
    .limit(normalizeLimit(limit));

  if (error) {
    throwServiceError("Unable to load parking bookings.", error);
  }

  return data ?? [];
}

export async function cancelParkingBooking(
  bookingId: string,
  client?: SmartParkingClient,
): Promise<Booking> {
  assertNonEmpty(bookingId, "Booking id");

  const activeClient = getClient(client);
  const user = await getAuthenticatedUser(activeClient);

  const { data, error } = await activeClient
    .from("bookings")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    throwServiceError("Unable to cancel parking booking.", error);
  }

  return data;
}

export async function listAdminBookingOverview({
  client,
  limit,
  status,
}: ListAdminBookingsOptions = {}): Promise<AdminBookingOverviewItem[]> {
  const activeClient = getClient(client);
  let query = activeClient
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(normalizeLimit(limit));

  if (status) {
    query = query.eq("status", status);
  }

  const { data: bookings, error } = await query;

  if (error) {
    throwServiceError("Unable to load admin booking overview.", error);
  }

  if (!bookings?.length) {
    return [];
  }

  const userIds = [...new Set(bookings.map((booking) => booking.user_id))];
  const areaIds = [...new Set(bookings.map((booking) => booking.parking_area_id))];
  const slotIds = [...new Set(bookings.map((booking) => booking.parking_slot_id))];

  const [
    { data: profiles, error: profilesError },
    { data: parkingAreas, error: areasError },
    { data: parkingSlots, error: slotsError },
  ] = await Promise.all([
    activeClient.from("profiles").select("id, full_name, role").in("id", userIds),
    activeClient.from("parking_areas").select("id, name, slug, address").in("id", areaIds),
    activeClient.from("parking_slots").select("id, slot_number, level, status").in("id", slotIds),
  ]);

  if (profilesError || areasError || slotsError) {
    throwServiceError("Unable to load admin booking overview details.", {
      profilesError,
      areasError,
      slotsError,
    });
  }

  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const areasById = new Map((parkingAreas ?? []).map((area) => [area.id, area]));
  const slotsById = new Map((parkingSlots ?? []).map((slot) => [slot.id, slot]));

  return bookings.map((booking) => ({
    ...booking,
    profile: profilesById.get(booking.user_id) ?? null,
    parkingArea: areasById.get(booking.parking_area_id) ?? null,
    parkingSlot: slotsById.get(booking.parking_slot_id) ?? null,
  }));
}
