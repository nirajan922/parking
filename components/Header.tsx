import { navigation } from "@/lib/data";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/70 bg-white/80 shadow-sm shadow-slate-950/5 backdrop-blur-2xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <a
          href="#top"
          className="group flex items-center gap-3"
          aria-label="ParkSense AI home"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-600/30 transition group-hover:-translate-y-0.5">
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 20V4h6.2c3.1 0 5.3 2.1 5.3 5s-2.2 5-5.3 5H10v6H7Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>
            <span className="block text-base font-black tracking-tight text-slate-950">
              ParkSense AI
            </span>
            <span className="block text-xs font-medium text-slate-500">
              Smart parking predictor
            </span>
          </span>
        </a>

        <div className="hidden items-center rounded-full border border-slate-200 bg-white/75 p-1 shadow-sm lg:flex">
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <a
            href="#dashboard"
            className="hidden text-sm font-semibold text-slate-600 transition hover:text-blue-700 sm:inline-flex"
          >
            View demo
          </a>
          <a
            href="#contact"
            className="inline-flex rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-xl shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-700/25"
          >
            Request access
          </a>
        </div>
      </nav>
    </header>
  );
}
