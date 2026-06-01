import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

function readPublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return { url, anonKey };
}

function requirePublicEnv() {
  const { url, anonKey } = readPublicEnv();

  if (!url || !anonKey) {
    console.error(
      "[SmartParking:server] Supabase env check — URL:",
      url ? "set" : "MISSING",
      "| ANON_KEY:",
      anonKey ? "set" : "MISSING",
    );
    throw new Error("Supabase is not connected on the server.");
  }

  return { url, anonKey };
}

function requireServiceRoleEnv() {
  const { url, anonKey } = requirePublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!serviceRoleKey) {
    console.error("[SmartParking:server] SUPABASE_SERVICE_ROLE_KEY is MISSING");
    throw new Error("Supabase service role key is not configured on the server.");
  }

  return { url, anonKey, serviceRoleKey };
}

export async function createSupabaseServerClient(): Promise<SupabaseClient<Database>> {
  const { url, anonKey } = requirePublicEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies; route handlers and server actions can.
        }
      },
    },
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

export function createSupabaseAdminClient(): SupabaseClient<Database> {
  const { url, serviceRoleKey } = requireServiceRoleEnv();

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
