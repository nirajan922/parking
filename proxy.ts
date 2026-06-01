import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

function redirectToDashboard(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/dashboard";
  redirectUrl.search = "";
  redirectUrl.searchParams.set("admin_error", "forbidden");

  return NextResponse.redirect(redirectUrl);
}

function redirectToLogin(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/login";
  redirectUrl.search = "";
  redirectUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);

  return NextResponse.redirect(redirectUrl);
}

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let response = NextResponse.next({ request });

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (request.cookies.get("smartparking_demo_auth")?.value === "1") {
      if (request.nextUrl.pathname.startsWith("/admin")) {
        return redirectToDashboard(request);
      }

      return response;
    }

    return redirectToLogin(request);
  }

  if (request.nextUrl.pathname.startsWith("/admin")) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error || profile?.role !== "admin") {
      return redirectToDashboard(request);
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/bookings/:path*", "/my-bookings/:path*", "/admin/:path*"],
};
