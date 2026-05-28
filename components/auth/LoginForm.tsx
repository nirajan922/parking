"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { isSafeRedirectPath } from "@/lib/apiValidation";
import { signInWithEmail } from "@/services/authService";
import {
  isDemoCredentials,
  setDemoSession,
  getDemoSession,
  DEMO_EMAIL,
} from "@/lib/demoMode";

function getSafeNextPath(nextPath: string | null) {
  if (!isSafeRedirectPath(nextPath)) {
    return "/dashboard";
  }

  return nextPath;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectPath = useMemo(
    () => getSafeNextPath(searchParams.get("next")),
    [searchParams],
  );
  const registered = searchParams.get("registered") === "true";

  useEffect(() => {
    if (getDemoSession()) {
      router.replace("/dashboard");
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    if (isDemoCredentials(email, password)) {
      setDemoSession();
      router.replace(redirectPath);
      router.refresh();
      setIsSubmitting(false);
      return;
    }

    try {
      await signInWithEmail({ email, password });
      router.replace(redirectPath);
      router.refresh();
    } catch (error: unknown) {
      let message = "We could not sign you in. Check your credentials and try again.";
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
      {registered ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Account created. You can now sign in.
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
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          placeholder="Enter your password"
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
      >
        {isSubmitting ? "Signing in..." : "Sign in to dashboard"}
      </button>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
        <p className="text-xs font-bold text-blue-700">Demo account</p>
        <p className="mt-1 text-xs text-blue-600">
          Email: <span className="font-mono font-semibold">{DEMO_EMAIL}</span>
          <br />
          Password: <span className="font-mono font-semibold">Demo12345</span>
        </p>
      </div>
    </form>
  );
}
