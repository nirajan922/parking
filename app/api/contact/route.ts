import { NextResponse, type NextRequest } from "next/server";
import { parseJsonBody } from "@/lib/apiValidation";
import { createSupabaseAdminClient } from "@/lib/supabaseServer";

type ContactBody = {
  fullName: string;
  email: string;
  subject: string;
  message: string;
};

function isContactBody(value: unknown): value is ContactBody {
  if (!value || typeof value !== "object") return false;
  const body = value as Record<string, unknown>;

  return (
    typeof body.fullName === "string" &&
    typeof body.email === "string" &&
    typeof body.subject === "string" &&
    typeof body.message === "string"
  );
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim().toLowerCase());
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);

    if (!isContactBody(body)) {
      return NextResponse.json({ error: "All contact fields are required." }, { status: 400 });
    }

    if (!isEmail(body.email)) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("contact_messages")
      .insert({
        full_name: body.fullName.trim().slice(0, 120),
        email: body.email.trim().toLowerCase().slice(0, 180),
        subject: body.subject.trim().slice(0, 160),
        message: body.message.trim().slice(0, 2000),
      })
      .select("id, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: "Unable to save contact message." }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("service role key is not configured") ||
        error.message.includes("Supabase is not connected"))
    ) {
      return NextResponse.json({ error: "Contact service is not configured." }, { status: 500 });
    }

    return NextResponse.json({ error: "Unable to send contact message." }, { status: 400 });
  }
}
