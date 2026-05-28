import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

function getPublicSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return { supabaseUrl, supabaseAnonKey };
}

let browserClient: SupabaseClient<Database> | undefined;
let cachedUrl: string | undefined;
let cachedKey: string | undefined;

export function createSupabaseBrowserClient(): SupabaseClient<Database> {
  const env = getPublicSupabaseEnv();

  if (!env) {
    throw new Error(
      "Supabase environment variables are not configured. " +
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  if (!browserClient || cachedUrl !== env.supabaseUrl || cachedKey !== env.supabaseAnonKey) {
    cachedUrl = env.supabaseUrl;
    cachedKey = env.supabaseAnonKey;
    browserClient = createBrowserClient<Database>(
      env.supabaseUrl,
      env.supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
        },
      },
    );
  }

  return browserClient;
}

export function isSupabaseConfigured(): boolean {
  return getPublicSupabaseEnv() !== null;
}
