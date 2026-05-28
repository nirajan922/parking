import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Prediction } from "@/lib/database.types";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

type SmartParkingClient = SupabaseClient<Database>;

export type CreatePredictionInput = {
  parkingZoneId: string;
  predictedAvailableSpaces: number;
  confidenceScore: number;
  predictionWindowStart: string;
  predictionWindowEnd: string;
  modelVersion?: string;
  metadata?: Database["public"]["Tables"]["predictions"]["Insert"]["metadata"];
};

type PredictionQueryOptions = {
  client?: SmartParkingClient;
  parkingZoneId?: string;
  limit?: number;
};

function getClient(client?: SmartParkingClient) {
  return client ?? createSupabaseBrowserClient();
}

function normalizeLimit(limit = 20) {
  if (!Number.isFinite(limit)) {
    return 20;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), 100);
}

function assertNonEmpty(value: string, fieldName: string) {
  if (!value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }
}

function validatePredictionWindow(startTime: string, endTime: string) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Prediction window values must be valid ISO date strings.");
  }

  if (start >= end) {
    throw new Error("Prediction window end must be after the start.");
  }
}

function validatePredictionNumbers(predictedAvailableSpaces: number, confidenceScore: number) {
  if (!Number.isInteger(predictedAvailableSpaces) || predictedAvailableSpaces < 0) {
    throw new Error("Predicted available spaces must be a non-negative integer.");
  }

  if (!Number.isFinite(confidenceScore) || confidenceScore < 0 || confidenceScore > 1) {
    throw new Error("Confidence score must be a number between 0 and 1.");
  }
}

function throwServiceError(message: string, cause: unknown): never {
  throw new Error(message, { cause });
}

export async function listLatestPredictions({
  client,
  parkingZoneId,
  limit,
}: PredictionQueryOptions = {}): Promise<Prediction[]> {
  let query = getClient(client)
    .from("predictions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(normalizeLimit(limit));

  if (parkingZoneId) {
    query = query.eq("parking_zone_id", parkingZoneId);
  }

  const { data, error } = await query;

  if (error) {
    throwServiceError("Unable to load parking predictions.", error);
  }

  return data ?? [];
}

export async function getLatestPredictionForZone(
  parkingZoneId: string,
  client?: SmartParkingClient,
): Promise<Prediction | null> {
  assertNonEmpty(parkingZoneId, "Parking zone id");

  const { data, error } = await getClient(client)
    .from("predictions")
    .select("*")
    .eq("parking_zone_id", parkingZoneId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throwServiceError("Unable to load latest parking prediction.", error);
  }

  return data;
}

export async function createPrediction(
  input: CreatePredictionInput,
  client?: SmartParkingClient,
): Promise<Prediction> {
  assertNonEmpty(input.parkingZoneId, "Parking zone id");
  validatePredictionWindow(input.predictionWindowStart, input.predictionWindowEnd);
  validatePredictionNumbers(input.predictedAvailableSpaces, input.confidenceScore);

  const { data, error } = await getClient(client)
    .from("predictions")
    .insert({
      parking_zone_id: input.parkingZoneId,
      predicted_available_spaces: input.predictedAvailableSpaces,
      confidence_score: input.confidenceScore,
      prediction_window_start: new Date(input.predictionWindowStart).toISOString(),
      prediction_window_end: new Date(input.predictionWindowEnd).toISOString(),
      model_version: input.modelVersion ?? null,
      metadata: input.metadata ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throwServiceError("Unable to create parking prediction.", error);
  }

  return data;
}
