import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footerText: string;
  footerHref: string;
  footerLinkText: string;
};

export function AuthShell({
  title,
  description,
  children,
  footerText,
  footerHref,
  footerLinkText,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.18),transparent_32rem),linear-gradient(135deg,#f8fbff_0%,#eef6ff_48%,#ffffff_100%)] px-6 py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-2xl shadow-blue-950/10 backdrop-blur lg:grid-cols-[0.95fr_1.05fr]">
          <section className="bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-8 text-white sm:p-10">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sm font-black ring-1 ring-white/20">
                SP
              </span>
              <span>
                <span className="block text-lg font-black">Smart Parking</span>
                <span className="block text-xs font-medium text-blue-100">
                  Availability Predictor
                </span>
              </span>
            </Link>

            <div className="mt-16 max-w-md">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-200">
                Secure access
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                Manage parking intelligence with confidence.
              </h1>
              <p className="mt-5 text-sm leading-7 text-blue-100">
                Sign in to monitor predictions, bookings, parking areas, and operational decisions from a protected dashboard.
              </p>
            </div>
          </section>

          <section className="p-8 sm:p-10">
            <div className="mx-auto max-w-md">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
                  Smart Parking
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  {title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
              </div>

              {children}

              <p className="mt-8 text-center text-sm text-slate-500">
                {footerText}{" "}
                <Link href={footerHref} className="font-bold text-blue-700 hover:text-blue-800">
                  {footerLinkText}
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
