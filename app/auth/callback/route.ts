import { NextResponse, type NextRequest } from "next/server";
import { isSafeRedirectPath } from "@/lib/apiValidation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

function getSafeRedirectPath(request: NextRequest) {
  const nextPath = request.nextUrl.searchParams.get("next");

  if (!isSafeRedirectPath(nextPath)) {
    return "/";
  }

  return nextPath;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = getSafeRedirectPath(request);
  redirectUrl.search = "";

  if (!code) {
    redirectUrl.searchParams.set("auth_error", "missing_code");
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirectUrl.pathname = "/";
    redirectUrl.searchParams.set("auth_error", "callback_failed");
  }

  return NextResponse.redirect(redirectUrl);
}
