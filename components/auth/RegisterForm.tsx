"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { signUpWithEmail } from "@/services/authService";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { getDemoSession } from "@/lib/demoMode";

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (getDemoSession()) {
      router.replace("/dashboard");
      return;
    }

    async function checkExistingSession() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          router.replace("/dashboard");
        }
      } catch {
        // No session
      }
    }
    checkExistingSession();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signUpWithEmail({ email, password });

      if (result.session) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      setSuccessMessage("Account created successfully! You can now sign in.");
      setTimeout(() => {
        router.replace("/login?registered=true");
      }, 1500);
    } catch (error: unknown) {
      let message = "We could not create your account. Please check your details and try again.";
      if (error instanceof Error) {
        const cause = error.cause;
        if (cause && typeof cause === "object" && "message" in cause) {
          message = String((cause as { message: string }).message);
        } else if (error.message) {
          message = error.message;
        }
      }
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      {successMessage ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <label className="block">
        <span className="text-sm font-bold text-slate-700">Email address</span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          placeholder="you@example.com"
        />
      </label>

      <label className="block">
        <span className="text-sm font-bold text-slate-700">Password</span>
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          placeholder="Create a secure password"
        />
      </label>

      <label className="block">
        <span className="text-sm font-bold text-slate-700">Confirm password</span>
        <input
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          minLength={8}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          placeholder="Repeat your password"
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
      >
        {isSubmitting ? "Creating account..." : "Create Smart Parking account"}
      </button>
    </form>
  );
}
