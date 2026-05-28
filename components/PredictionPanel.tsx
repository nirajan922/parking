import { parkingZones } from "@/lib/data";

function AvailabilityRing({ percentage }: { percentage: number }) {
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative h-32 w-32">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        <circle
          cx="50"
          cy="50"
          r="42"
          stroke="currentColor"
          strokeWidth="10"
          fill="none"
          className="text-blue-100"
        />
        <circle
          cx="50"
          cy="50"
          r="42"
          stroke="currentColor"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-blue-600"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-950">{percentage}%</span>
        <span className="text-xs font-medium text-slate-500">available</span>
      </div>
    </div>
  );
}

export function PredictionPanel() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -inset-6 rounded-[2.5rem] bg-blue-500/20 blur-3xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-2xl shadow-blue-950/15 backdrop-blur">
        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
          <div>
            <p className="text-sm font-semibold text-blue-600">Live prediction</p>
            <h3 className="mt-1 text-xl font-bold text-slate-950">8:30 AM city outlook</h3>
          </div>
          <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Model online
          </div>
        </div>

        <div className="grid gap-6 py-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <AvailabilityRing percentage={72} />
          <div>
            <p className="text-sm font-medium text-slate-500">Recommended destination</p>
            <h4 className="mt-2 text-2xl font-bold text-slate-950">Riverside Station Garage</h4>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Highest confidence availability with lower congestion and a 4 minute walk to transit.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {parkingZones.map((zone) => {
            const percentage = Math.round((zone.available / zone.capacity) * 100);

            return (
              <div
                key={zone.name}
                className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{zone.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{zone.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-950">{zone.available}</p>
                    <p className="text-xs text-slate-500">spaces</p>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
