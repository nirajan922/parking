import { NextResponse, type NextRequest } from "next/server";
import {
  buildFallbackParkingResults,
  geocodeLocation,
  searchParkingNearby,
  type OsmParkingResult,
} from "@/lib/osmParking";
import { parseJsonBody } from "@/lib/apiValidation";

export const dynamic = "force-dynamic";

type ParkingSearchBody = {
  query?: string;
  radiusKm?: number;
  latitude?: number;
  longitude?: number;
  label?: string;
};

type SearchLocation = {
  lat: number;
  lon: number;
  label: string;
};

function parseRadiusKm(value: unknown) {
  const radius = typeof value === "string" || typeof value === "number" ? Number(value) : 2;

  if (!Number.isFinite(radius)) {
    throw new Error("Search radius must be a number.");
  }

  if (radius <= 0) {
    throw new Error("Search radius must be greater than zero.");
  }

  return Math.min(Math.max(radius, 0.1), 10);
}

function parseCoordinate(value: unknown, fieldName: string) {
  const coordinate = typeof value === "string" || typeof value === "number" ? Number(value) : NaN;

  if (!Number.isFinite(coordinate)) {
    throw new Error(`${fieldName} must be a valid coordinate.`);
  }

  return coordinate;
}

function validateCoordinates(lat: number, lon: number) {
  if (lat < -90 || lat > 90) {
    throw new Error("Latitude must be between -90 and 90.");
  }

  if (lon < -180 || lon > 180) {
    throw new Error("Longitude must be between -180 and 180.");
  }
}

function validateQuery(query: unknown) {
  if (typeof query !== "string") {
    throw new Error("Location query is required.");
  }

  const trimmed = query.trim();

  if (trimmed.length < 2) {
    throw new Error("Location query must be at least 2 characters.");
  }

  if (trimmed.length > 160) {
    throw new Error("Location query must be 160 characters or less.");
  }

  return trimmed;
}

async function resolveSearchLocation(input: ParkingSearchBody): Promise<SearchLocation> {
  if (input.latitude !== undefined || input.longitude !== undefined) {
    const lat = parseCoordinate(input.latitude, "Latitude");
    const lon = parseCoordinate(input.longitude, "Longitude");
    validateCoordinates(lat, lon);

    return {
      lat,
      lon,
      label: typeof input.label === "string" && input.label.trim() ? input.label.trim().slice(0, 120) : "Your location",
    };
  }

  const query = validateQuery(input.query);
  const geo = await geocodeLocation(query);

  if (!geo) {
    throw new Error(`Could not find location: "${query}". Try a more specific address or suburb.`);
  }

  return {
    lat: geo.lat,
    lon: geo.lon,
    label: typeof input.label === "string" && input.label.trim() ? input.label.trim().slice(0, 120) : query,
  };
}

async function runParkingSearch(input: ParkingSearchBody) {
  const radiusKm = parseRadiusKm(input.radiusKm);
  const location = await resolveSearchLocation(input);
  let results: OsmParkingResult[] = [];
  let isFallback = false;

  try {
    results = await searchParkingNearby(location.lat, location.lon, Math.round(radiusKm * 1000));
  } catch (error) {
    console.error("[Parking Search] Overpass failed, using demo fallback:", error);
    results = buildFallbackParkingResults(location.lat, location.lon, location.label);
    isFallback = true;
  }

  if (results.length === 0) {
    results = buildFallbackParkingResults(location.lat, location.lon, location.label);
    isFallback = true;
  }

  return {
    location: {
      latitude: location.lat,
      longitude: location.lon,
      label: location.label,
    },
    radiusKm,
    results,
    fallback: isFallback,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const data = await runParkingSearch({
      query: searchParams.get("q") ?? undefined,
      radiusKm: searchParams.get("radius") ? Number(searchParams.get("radius")) : undefined,
      latitude: searchParams.get("lat") ? Number(searchParams.get("lat")) : undefined,
      longitude: searchParams.get("lon") ? Number(searchParams.get("lon")) : undefined,
      label: searchParams.get("label") ?? undefined,
    });

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Parking search is temporarily unavailable.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await parseJsonBody(request)) as ParkingSearchBody;
    const data = await runParkingSearch(body);

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Parking search is temporarily unavailable.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
