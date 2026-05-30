import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import type { Database, Profile } from "@/lib/database.types";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

type SmartParkingClient = SupabaseClient<Database>;

export type EmailPasswordCredentials = {
  email: string;
  password: string;
};

export type SignUpResult = {
  user: User | null;
  session: Session | null;
  confirmationRequired: boolean;
};

function getClient(client?: SmartParkingClient) {
  return client ?? createSupabaseBrowserClient();
}

function normalizeEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("A valid email address is required.");
  }

  return normalizedEmail;
}

function validatePassword(password: string) {
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }
}

export async function signInWithEmail(
  { email, password }: EmailPasswordCredentials,
  client?: SmartParkingClient,
): Promise<Session> {
  validatePassword(password);

  const supabase = getClient(client);

  console.log("[SmartParking:auth] signInWithPassword — calling Supabase...");

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizeEmail(email),
    password,
  });

  if (error) {
    console.error("[SmartParking:auth] signInWithPassword FAILED:", error.message, error.status);
    throw new Error(error.message);
  }

  if (!data.session) {
    throw new Error("Authentication did not return a session.");
  }

  console.log("[SmartParking:auth] signInWithPassword SUCCESS — user:", data.user?.id);
  return data.session;
}

export async function signUpWithEmail(
  { email, password }: EmailPasswordCredentials,
  client?: SmartParkingClient,
): Promise<SignUpResult> {
  validatePassword(password);

  const supabase = getClient(client);

  console.log("[SmartParking:auth] signUp — calling Supabase...");

  const { data, error } = await supabase.auth.signUp({
    email: normalizeEmail(email),
    password,
  });

  if (error) {
    console.error("[SmartParking:auth] signUp FAILED:", error.message, error.status);
    throw new Error(error.message);
  }

  const confirmationRequired = !data.session && data.user?.identities?.length === 0
    ? false
    : !data.session;

  console.log("[SmartParking:auth] signUp result — user:", data.user?.id,
    "| session:", data.session ? "YES" : "NO",
    "| confirmationRequired:", confirmationRequired);

  return {
    user: data.user,
    session: data.session,
    confirmationRequired,
  };
}

export async function signOut(client?: SmartParkingClient): Promise<void> {
  const { error } = await getClient(client).auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

export async function getCurrentUser(client?: SmartParkingClient): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await getClient(client).auth.getUser();

  if (error) {
    return null;
  }

  return user;
}

export async function requireAuthenticatedUser(client?: SmartParkingClient): Promise<User> {
  const user = await getCurrentUser(client);

  if (!user) {
    throw new Error("Authentication is required.");
  }

  return user;
}

export async function getCurrentUserProfile(
  client?: SmartParkingClient,
): Promise<Profile | null> {
  const activeClient = getClient(client);
  const user = await requireAuthenticatedUser(activeClient);

  const { data, error } = await activeClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load the current user profile.");
  }

  return data;
}

export async function requireAdminUser(client?: SmartParkingClient): Promise<User> {
  const activeClient = getClient(client);
  const user = await requireAuthenticatedUser(activeClient);
  const { data, error } = await activeClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to verify administrator permissions.");
  }

  if (data?.role !== "admin") {
    throw new Error("Administrator access is required.");
  }

  return user;
}
