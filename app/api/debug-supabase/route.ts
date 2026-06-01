import { NextResponse } from "next/server";

function statusFor(value: string | undefined) {
  return value ? "FOUND" : "MISSING";
}

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: statusFor(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: statusFor(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: statusFor(process.env.SUPABASE_SERVICE_ROLE_KEY),
  });
}
