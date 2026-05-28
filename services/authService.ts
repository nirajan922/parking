import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

type SmartParkingClient = SupabaseClient<Database>;

export type EmailPasswordCredentials = {
  email: string;
  password: string;
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
): Promise<User | null> {
  validatePassword(password);

  const { data, error } = await getClient(client).auth.signUp({
    email: normalizeEmail(email),
    password,
  });

  if (error) {
    throwServiceError("Unable to create an account with the provided credentials.", error);
  }

  return data.user;
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
