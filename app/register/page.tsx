import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      description="Register with Supabase Auth to start managing parking bookings, predictions, and area insights securely."
      footerText="Already have an account?"
      footerHref="/login"
      footerLinkText="Sign in"
    >
      <RegisterForm />
    </AuthShell>
  );
}
