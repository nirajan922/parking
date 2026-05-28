import { stats } from "@/lib/data";
import { PredictionPanel } from "@/components/PredictionPanel";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden px-6 py-20 sm:py-24 lg:px-8">
      <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-blue-100/80 to-transparent" />
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            AI-powered occupancy intelligence
          </div>
          <h1 className="mt-8 max-w-4xl text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
            Predict parking availability before drivers arrive.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            ParkSense AI helps cities, campuses, and mobility teams forecast demand, guide drivers to open spaces, and reduce congestion with real-time predictive analytics.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href="#predictions"
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Explore predictor
            </a>
            <a
              href="#platform"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700"
            >
              See platform
            </a>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm">
                <p className="text-2xl font-bold text-slate-950">{stat.value}</p>
                <p className="mt-1 text-sm leading-5 text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <PredictionPanel />
      </div>
    </section>
  );
}
