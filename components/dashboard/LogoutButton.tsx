"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/services/authService";

export function LogoutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLogout() {
    setIsSigningOut(true);
    setErrorMessage(null);

    try {
      await signOut();
      router.replace("/login");
      router.refresh();
    } catch {
      setErrorMessage("Unable to sign out. Please try again.");
      setIsSigningOut(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleLogout}
        disabled={isSigningOut}
        className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-xl shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
      >
        {isSigningOut ? "Signing out..." : "Log out"}
      </button>
      {errorMessage ? <p className="text-xs font-semibold text-red-600">{errorMessage}</p> : null}
    </div>
  );
}
