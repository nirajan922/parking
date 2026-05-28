import { stats } from "@/lib/data";
import { PredictionPanel } from "@/components/PredictionPanel";

export function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden px-6 pb-20 pt-16 sm:pb-24 sm:pt-20 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.20),transparent_32rem),linear-gradient(135deg,#f8fbff_0%,#eef6ff_45%,#ffffff_100%)]" />
      <div className="absolute left-1/2 top-12 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-300/20 blur-3xl" />
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.03fr_0.97fr]">
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/85 px-4 py-2 text-sm font-bold text-blue-700 shadow-sm shadow-blue-950/5 backdrop-blur">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-600" />
            </span>
            Predictive parking intelligence for modern cities
          </div>
          <h1 className="mx-auto mt-8 max-w-5xl text-5xl font-black tracking-tight text-slate-950 sm:text-6xl lg:mx-0 lg:text-7xl">
            Know where parking will be available before demand peaks.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 lg:mx-0">
            ParkSense AI turns live occupancy, historic usage, events, and traffic signals into reliable availability predictions for cities, campuses, and parking operators.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <a
              href="#dashboard"
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-600/25 transition hover:-translate-y-1 hover:bg-blue-700 hover:shadow-blue-700/30"
            >
              Explore dashboard
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:text-blue-700 hover:shadow-lg hover:shadow-blue-950/5"
            >
              See how it works
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-semibold text-slate-500 lg:justify-start">
            <span className="text-slate-400">Trusted data inputs:</span>
            <span>IoT sensors</span>
            <span>Meter feeds</span>
            <span>Event data</span>
            <span>Traffic APIs</span>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4">
            {stats.slice(0, 2).map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl border border-white/80 bg-white/80 p-5 text-left shadow-lg shadow-blue-950/5 backdrop-blur transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/10"
              >
                <p className="text-3xl font-black text-slate-950">{stat.value}</p>
                <p className="mt-1 text-sm font-bold capitalize text-slate-700">{stat.label}</p>
                <p className="mt-2 hidden text-xs leading-5 text-slate-500 sm:block">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <PredictionPanel />
      </div>
    </section>
  );
}
