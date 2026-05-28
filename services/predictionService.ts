import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Prediction } from "@/lib/database.types";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

type SmartParkingClient = SupabaseClient<Database>;

export type CreatePredictionInput = {
  parkingAreaId: string;
  predictedAvailableSlots: number;
  confidenceScore: number;
  predictionWindowStart: string;
  predictionWindowEnd: string;
  modelVersion?: string;
  metadata?: Database["public"]["Tables"]["predictions"]["Insert"]["metadata"];
  createdBy?: string | null;
};

type PredictionQueryOptions = {
  client?: SmartParkingClient;
  parkingAreaId?: string;
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

function validatePredictionNumbers(predictedAvailableSlots: number, confidenceScore: number) {
  if (!Number.isInteger(predictedAvailableSlots) || predictedAvailableSlots < 0) {
    throw new Error("Predicted available slots must be a non-negative integer.");
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
  parkingAreaId,
  limit,
}: PredictionQueryOptions = {}): Promise<Prediction[]> {
  let query = getClient(client)
    .from("predictions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(normalizeLimit(limit));

  if (parkingAreaId) {
    query = query.eq("parking_area_id", parkingAreaId);
  }

  const { data, error } = await query;

  if (error) {
    throwServiceError("Unable to load parking predictions.", error);
  }

  return data ?? [];
}

export async function getLatestPredictionForArea(
  parkingAreaId: string,
  client?: SmartParkingClient,
): Promise<Prediction | null> {
  assertNonEmpty(parkingAreaId, "Parking area id");

  const { data, error } = await getClient(client)
    .from("predictions")
    .select("*")
    .eq("parking_area_id", parkingAreaId)
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
  assertNonEmpty(input.parkingAreaId, "Parking area id");
  validatePredictionWindow(input.predictionWindowStart, input.predictionWindowEnd);
  validatePredictionNumbers(input.predictedAvailableSlots, input.confidenceScore);

  const { data, error } = await getClient(client)
    .from("predictions")
    .insert({
      parking_area_id: input.parkingAreaId,
      predicted_available_slots: input.predictedAvailableSlots,
      confidence_score: input.confidenceScore,
      prediction_window_start: new Date(input.predictionWindowStart).toISOString(),
      prediction_window_end: new Date(input.predictionWindowEnd).toISOString(),
      model_version: input.modelVersion ?? null,
      metadata: input.metadata ?? null,
      created_by: input.createdBy ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throwServiceError("Unable to create parking prediction.", error);
  }

  return data;
}
