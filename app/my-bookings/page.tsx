import { MyBookingsClient } from "@/components/booking/MyBookingsClient";
import { AuthGate } from "@/components/auth/AuthGate";

export const dynamic = "force-dynamic";

export default function MyBookingsPage() {
  return (
    <AuthGate>
      <MyBookingsClient />
    </AuthGate>
  );
}
