"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getDemoSession } from "@/lib/demoMode";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";

type AuthGateProps = {
  children: ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      if (getDemoSession()) {
        setIsAuthed(true);
        setIsChecking(false);
        return;
      }

      if (!isSupabaseConfigured()) {
        router.replace(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        setIsChecking(false);
        return;
      }

      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setIsAuthed(true);
        } else {
          router.replace(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        }
      } catch {
        router.replace("/login");
      } finally {
        setIsChecking(false);
      }
    }

    checkAuth();
  }, [router]);

  if (isChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </main>
    );
  }

  if (!isAuthed) return null;

  return <>{children}</>;
}
