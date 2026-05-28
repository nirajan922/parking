import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Booking, Database } from "@/lib/database.types";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

type SmartParkingClient = SupabaseClient<Database>;

export type CreateBookingInput = {
  parkingZoneId: string;
  vehiclePlate: string;
  startTime: string;
  endTime: string;
};

type ListBookingsOptions = {
  client?: SmartParkingClient;
  limit?: number;
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
  assertNonEmpty(input.parkingZoneId, "Parking zone id");
  validateBookingWindow(input.startTime, input.endTime);

  const activeClient = getClient(client);
  const user = await getAuthenticatedUser(activeClient);
  const vehiclePlate = normalizeVehiclePlate(input.vehiclePlate);

  const { data, error } = await activeClient
    .from("bookings")
    .insert({
      user_id: user.id,
      parking_zone_id: input.parkingZoneId,
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
