import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

function getPublicSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return { supabaseUrl, supabaseAnonKey };
}

function requirePublicSupabaseEnv() {
  const env = getPublicSupabaseEnv();

  if (!env) {
    throw new Error(
      "Supabase environment variables are not configured. " +
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return env;
}

function requireServerSupabaseEnv() {
  const env = requirePublicSupabaseEnv();
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY for privileged server database access.",
    );
  }

  return { ...env, supabaseServiceRoleKey };
}

export async function createSupabaseServerClient(): Promise<SupabaseClient<Database>> {
  const env = requirePublicSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
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
  const env = requireServerSupabaseEnv();

  return createClient<Database>(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
