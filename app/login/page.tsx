import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      description="Sign in with your Supabase account to access your protected Smart Parking dashboard."
      footerText="New to Smart Parking?"
      footerHref="/register"
      footerLinkText="Create an account"
    >
      <Suspense fallback={<p className="mt-8 text-sm text-slate-500">Loading sign in...</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
