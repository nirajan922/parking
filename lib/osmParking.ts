import type { ParkingArea, ParkingSlot } from "@/lib/database.types";

export type OsmParkingResult = ParkingArea & {
  slots: ParkingSlot[];
  source: "openstreetmap";
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
};

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: {
    name?: string;
    capacity?: string;
    fee?: string;
    parking?: string;
    access?: string;
    operator?: string;
    "addr:street"?: string;
    "addr:housenumber"?: string;
    "addr:suburb"?: string;
    "addr:city"?: string;
  };
};

function toRadians(deg: number) {
  return (deg * Math.PI) / 180;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildAddress(tags: OverpassElement["tags"]): string | null {
  if (!tags) return null;
  const parts: string[] = [];
  if (tags["addr:housenumber"] && tags["addr:street"]) {
    parts.push(`${tags["addr:housenumber"]} ${tags["addr:street"]}`);
  } else if (tags["addr:street"]) {
    parts.push(tags["addr:street"]);
  }
  if (tags["addr:suburb"]) parts.push(tags["addr:suburb"]);
  if (tags["addr:city"]) parts.push(tags["addr:city"]);
  return parts.length > 0 ? parts.join(", ") : null;
}

function generateSimulatedSlots(areaId: string, capacity: number, rate: number): ParkingSlot[] {
  const slots: ParkingSlot[] = [];
  const now = new Date().toISOString();

  for (let i = 1; i <= capacity; i++) {
    const seed = areaId.charCodeAt(areaId.length - 1) + i;
    const isOccupied = seed % 4 === 0 || seed % 7 === 0;
    slots.push({
      id: `osm-${areaId}-slot-${i}`,
      parking_area_id: areaId,
      slot_number: `P-${i}`,
      level: capacity > 30 ? `Level ${Math.ceil(i / 20)}` : null,
      status: isOccupied ? "occupied" : "available",
      is_accessible: i === 1,
      has_ev_charger: i === 2,
      hourly_rate: rate,
      created_at: now,
      updated_at: now,
    });
  }
  return slots;
}

function estimateRate(tags: OverpassElement["tags"]): number {
  if (tags?.fee === "no") return 0;
  const hash = JSON.stringify(tags).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return Number((5 + (hash % 15)).toFixed(2));
}

export async function geocodeLocation(query: string): Promise<{ lat: number; lon: number; displayName: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;

  const response = await fetch(url, {
    headers: { "User-Agent": "SmartParkingPredictor/1.0 (student-project)" },
  });

  if (!response.ok) {
    console.error("[OSM] Nominatim error:", response.status);
    return null;
  }

  const results: NominatimResult[] = await response.json();
  if (results.length === 0) return null;

  return {
    lat: parseFloat(results[0].lat),
    lon: parseFloat(results[0].lon),
    displayName: results[0].display_name,
  };
}

export async function searchParkingNearby(
  lat: number,
  lon: number,
  radiusMeters: number = 2000,
): Promise<OsmParkingResult[]> {
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="parking"](around:${radiusMeters},${lat},${lon});
      way["amenity"="parking"](around:${radiusMeters},${lat},${lon});
      relation["amenity"="parking"](around:${radiusMeters},${lat},${lon});
    );
    out center tags 20;
  `;

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    console.error("[OSM] Overpass error:", response.status);
    throw new Error(`Overpass API returned ${response.status}. Try again in a moment.`);
  }

  const data = await response.json();
  const elements: OverpassElement[] = data.elements ?? [];
  const now = new Date().toISOString();

  const results: OsmParkingResult[] = elements.map((el) => {
    const elLat = el.lat ?? el.center?.lat ?? lat;
    const elLon = el.lon ?? el.center?.lon ?? lon;
    const tags = el.tags ?? {};
    const name = tags.name || "Public Parking Area";
    const capacity = parseInt(tags.capacity ?? "0", 10) || (12 + (el.id % 30));
    const areaId = `osm-${el.type}-${el.id}`;
    const address = buildAddress(tags)
      ?? `${elLat.toFixed(5)}, ${elLon.toFixed(5)}`;
    const rate = estimateRate(tags);
    const slug = `osm-${el.id}`;

    const area: ParkingArea = {
      id: areaId,
      name,
      slug,
      description: tags.operator ? `Operated by ${tags.operator}` : (tags.parking ? `Type: ${tags.parking}` : null),
      address,
      latitude: elLat,
      longitude: elLon,
      total_slots: capacity,
      status: "open",
      created_at: now,
      updated_at: now,
    };

    const slots = generateSimulatedSlots(areaId, capacity, rate);

    return { ...area, slots, source: "openstreetmap" as const };
  });

  results.sort((a, b) => {
    const dA = haversineKm(lat, lon, Number(a.latitude), Number(a.longitude));
    const dB = haversineKm(lat, lon, Number(b.latitude), Number(b.longitude));
    return dA - dB;
  });

  return results;
}
