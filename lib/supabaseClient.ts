import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

function readSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  };
}

let browserClient: SupabaseClient<Database> | undefined;
let cachedUrl = "";

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = readSupabaseEnv();
  return url.length > 0 && anonKey.length > 0;
}

export function createSupabaseBrowserClient(): SupabaseClient<Database> {
  const { url, anonKey } = readSupabaseEnv();

  if (typeof window !== "undefined" && (!url || !anonKey)) {
    console.warn(
      "[SmartParking] Supabase env check — URL:",
      url ? `set (${url.substring(0, 20)}...)` : "MISSING",
      "| ANON_KEY:",
      anonKey ? `set (${anonKey.substring(0, 10)}...)` : "MISSING",
    );
  }

  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not connected. Please verify NEXT_PUBLIC_SUPABASE_URL " +
      "and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your deployment environment, " +
      "then redeploy. You can still use the demo account to try the app.",
    );
  }

  if (!browserClient || cachedUrl !== url) {
    cachedUrl = url;
    browserClient = createBrowserClient<Database>(url, anonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    });
  }

  return browserClient;
}
