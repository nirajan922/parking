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

function throwServiceError(message: string, cause: unknown): never {
  throw new Error(message, { cause });
}

export async function signInWithEmail(
  { email, password }: EmailPasswordCredentials,
  client?: SmartParkingClient,
): Promise<Session> {
  validatePassword(password);

  const { data, error } = await getClient(client).auth.signInWithPassword({
    email: normalizeEmail(email),
    password,
  });

  if (error) {
    throwServiceError("Unable to sign in with the provided credentials.", error);
  }

  if (!data.session) {
    throw new Error("Authentication did not return a session.");
  }

  return data.session;
}

export async function signUpWithEmail(
  { email, password }: EmailPasswordCredentials,
  client?: SmartParkingClient,
): Promise<SignUpResult> {
  validatePassword(password);

  const { data, error } = await getClient(client).auth.signUp({
    email: normalizeEmail(email),
    password,
  });

  if (error) {
    throwServiceError("Unable to create an account with the provided credentials.", error);
  }

  return {
    user: data.user,
    session: data.session,
  };
}

export async function signOut(client?: SmartParkingClient): Promise<void> {
  const { error } = await getClient(client).auth.signOut();

  if (error) {
    throwServiceError("Unable to sign out.", error);
  }
}

export async function getCurrentUser(client?: SmartParkingClient): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await getClient(client).auth.getUser();

  if (error) {
    throwServiceError("Unable to load the current user.", error);
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
    throwServiceError("Unable to load the current user profile.", error);
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
    throwServiceError("Unable to verify administrator permissions.", error);
  }

  if (data?.role !== "admin") {
    throw new Error("Administrator access is required.");
  }

  return user;
}
