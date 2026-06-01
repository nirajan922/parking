import type { ParkingArea, ParkingSlot, Booking } from "@/lib/database.types";

export const DEMO_EMAIL = "demo@smartparking.com";
export const DEMO_PASSWORD = "Demo12345";

const DEMO_USER_ID = "demo-user-00000000-0000-0000-0000-000000000001";
const BOOKINGS_STORAGE_KEY = "smartparking_demo_bookings";
const AUTH_STORAGE_KEY = "smartparking_demo_auth";
const AUTH_COOKIE_KEY = "smartparking_demo_auth";

export type DemoUser = {
  id: string;
  email: string;
  fullName: string;
};

export function isDemoCredentials(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === DEMO_EMAIL.toLowerCase() && password === DEMO_PASSWORD
  );
}

export function getDemoUser(): DemoUser {
  return {
    id: DEMO_USER_ID,
    email: DEMO_EMAIL,
    fullName: "Demo User",
  };
}

export function setDemoSession(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(getDemoUser()));
  document.cookie = `${AUTH_COOKIE_KEY}=1; path=/; max-age=86400; SameSite=Lax`;
}

export function clearDemoSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
  document.cookie = `${AUTH_COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

export function getDemoSession(): DemoUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoUser;
  } catch {
    return null;
  }
}

export function isDemoMode(): boolean {
  return getDemoSession() !== null;
}

const now = new Date().toISOString();

export const SYDNEY_PARKING_AREAS: ParkingArea[] = [
  {
    id: "demo-area-001",
    name: "Westfield Sydney Parking",
    slug: "westfield-sydney",
    description: "Multi-level parking at Westfield Sydney, Pitt Street Mall",
    address: "188 Pitt St, Sydney NSW 2000",
    latitude: -33.8708,
    longitude: 151.2087,
    source: "demo",
    external_id: "demo-area-001",
    total_slots: 45,
    status: "open",
    created_at: now,
    updated_at: now,
  },
  {
    id: "demo-area-002",
    name: "Circular Quay Car Park",
    slug: "circular-quay",
    description: "Underground parking near the Opera House and Harbour Bridge",
    address: "1 Alfred St, Circular Quay NSW 2000",
    latitude: -33.8614,
    longitude: 151.2114,
    source: "demo",
    external_id: "demo-area-002",
    total_slots: 30,
    status: "open",
    created_at: now,
    updated_at: now,
  },
  {
    id: "demo-area-003",
    name: "Darling Harbour Parking",
    slug: "darling-harbour",
    description: "Covered parking next to the ICC and SEA LIFE Aquarium",
    address: "500 Sussex St, Sydney NSW 2000",
    latitude: -33.8752,
    longitude: 151.2008,
    source: "demo",
    external_id: "demo-area-003",
    total_slots: 60,
    status: "open",
    created_at: now,
    updated_at: now,
  },
  {
    id: "demo-area-004",
    name: "Bondi Beach Parking",
    slug: "bondi-beach",
    description: "Outdoor council parking along Queen Elizabeth Drive",
    address: "Queen Elizabeth Dr, Bondi Beach NSW 2026",
    latitude: -33.8915,
    longitude: 151.2767,
    source: "demo",
    external_id: "demo-area-004",
    total_slots: 25,
    status: "busy",
    created_at: now,
    updated_at: now,
  },
  {
    id: "demo-area-005",
    name: "Chatswood Interchange",
    slug: "chatswood-interchange",
    description: "Multi-level parking integrated with train and bus interchange",
    address: "Victor St, Chatswood NSW 2067",
    latitude: -33.7969,
    longitude: 151.1811,
    source: "demo",
    external_id: "demo-area-005",
    total_slots: 50,
    status: "open",
    created_at: now,
    updated_at: now,
  },
  {
    id: "demo-area-006",
    name: "Parramatta CBD Parking",
    slug: "parramatta-cbd",
    description: "Convenient parking in the heart of Parramatta",
    address: "Smith St, Parramatta NSW 2150",
    latitude: -33.8151,
    longitude: 151.0011,
    source: "demo",
    external_id: "demo-area-006",
    total_slots: 40,
    status: "open",
    created_at: now,
    updated_at: now,
  },
];

function generateDemoSlots(area: ParkingArea): ParkingSlot[] {
  const slots: ParkingSlot[] = [];
  const total = area.total_slots;
  const rates: Record<string, number> = {
    "demo-area-001": 15.0,
    "demo-area-002": 18.0,
    "demo-area-003": 12.0,
    "demo-area-004": 8.0,
    "demo-area-005": 10.0,
    "demo-area-006": 9.0,
  };
  const rate = rates[area.id] ?? 10.0;

  for (let i = 1; i <= total; i++) {
    const seed = area.id.charCodeAt(area.id.length - 1) + i;
    const isOccupied = seed % 5 === 0 || seed % 7 === 0;
    slots.push({
      id: `${area.id}-slot-${String(i).padStart(3, "0")}`,
      parking_area_id: area.id,
      slot_number: `${area.slug.charAt(0).toUpperCase()}-${i}`,
      level: total > 30 ? `Level ${Math.ceil(i / 15)}` : null,
      status: isOccupied ? "occupied" : "available",
      is_accessible: i === 1,
      has_ev_charger: i === 2 || i === 3,
      hourly_rate: rate,
      created_at: now,
      updated_at: now,
    });
  }
  return slots;
}

export function getSydneyDemoSlots(): ParkingSlot[] {
  return SYDNEY_PARKING_AREAS.flatMap(generateDemoSlots);
}

export function getDemoBookings(): Booking[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Booking[];
  } catch {
    return [];
  }
}

export function saveDemoBooking(booking: Booking): void {
  if (typeof window === "undefined") return;
  const existing = getDemoBookings();
  existing.unshift(booking);
  localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(existing));
}

export function createDemoBookingId(): string {
  return `demo-booking-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
