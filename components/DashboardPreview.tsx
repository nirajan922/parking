import { dashboardMetrics, parkingZones, zoneForecast } from "@/lib/data";

export function DashboardPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-[2.5rem] bg-blue-500/20 blur-3xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-slate-950 p-3 shadow-2xl shadow-blue-950/25">
        <div className="rounded-[1.5rem] border border-white/10 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div>
              <p className="text-sm font-bold text-slate-950">
                Smart Parking Operations Dashboard
              </p>
              <p className="mt-1 text-xs text-slate-500">Live demand forecast and capacity guidance</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Live sync
            </div>
          </div>

          <div className="grid gap-4 p-5 lg:grid-cols-[0.75fr_1.25fr]">
            <div className="space-y-4">
              {dashboardMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-blue-950/5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                      {metric.label}
                    </p>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                      {metric.trend}
                    </span>
                  </div>
                  <p className="mt-3 text-3xl font-black text-slate-950">{metric.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-50 to-blue-50/70 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-950">Demand forecast</p>
                  <p className="mt-1 text-xs text-slate-500">Next six operating hours</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700 shadow-sm">
                  +18% downtown
                </span>
              </div>

              <div className="mt-8 flex h-48 items-end gap-3">
                {zoneForecast.map((item) => (
                  <div key={item.hour} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-36 w-full items-end rounded-full bg-white shadow-inner">
                      <div
                        className="w-full rounded-full bg-gradient-to-t from-blue-700 to-cyan-400 shadow-lg shadow-blue-600/20"
                        style={{ height: item.demand }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-500">{item.hour}:00</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {parkingZones.map((zone) => (
                  <div key={zone.name} className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold text-slate-500">{zone.name}</p>
                    <p className="mt-2 text-xl font-black text-slate-950">{zone.available}</p>
                    <p className="text-xs text-blue-700">{zone.status}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
