import { navigation } from "@/lib/data";

export function Footer() {
  return (
    <footer id="contact" className="bg-slate-950 px-6 py-12 text-white lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 border-b border-white/10 pb-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-2xl font-black tracking-tight">ParkSense AI</p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Smart parking availability predictions for cities, campuses, mobility teams, and operators who want cleaner streets and better arrival experiences.
            </p>
          </div>
          <a
            href="mailto:hello@parksense.ai"
            className="inline-flex justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-blue-600/25 transition hover:-translate-y-1 hover:bg-blue-500"
          >
            Request a demo
          </a>
        </div>

        <div className="flex flex-col gap-6 pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-400">
            (c) 2026 ParkSense AI. Built for smarter parking operations.
          </p>
          <div className="flex flex-wrap gap-5">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-slate-300 transition hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
