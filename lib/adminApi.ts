import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdminUser } from "@/services/authService";

export async function requireAdminClient(): Promise<SupabaseClient<Database>> {
  const supabase = await createSupabaseServerClient();
  await requireAdminUser(supabase);

  return supabase;
}

export function adminErrorResponse(error: unknown, fallback = "Admin request failed.") {
  if (error instanceof Error && error.message.includes("Authentication is required")) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  if (error instanceof Error && error.message.includes("Administrator access")) {
    return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
  }

  if (
    error instanceof Error &&
    error.message.includes("Supabase is not connected")
  ) {
    return NextResponse.json({ error: "Admin service is not configured." }, { status: 500 });
  }

  if (
    error instanceof Error &&
    (error.message.includes("required") ||
      error.message.includes("Invalid") ||
      error.message.includes("Slug") ||
      error.message.includes("Hourly rate"))
  ) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ error: fallback }, { status: 500 });
}
