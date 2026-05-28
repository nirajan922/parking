import { navigation } from "@/lib/data";

export function Footer() {
  return (
    <footer id="contact" className="border-t border-slate-200 bg-white px-6 py-12 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-bold text-slate-950">ParkSense AI</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            Smart parking availability predictions for better curbside, campus, and city mobility.
          </p>
        </div>
        <div className="flex flex-wrap gap-5">
          {navigation.map((item) => (
            <a key={item.href} href={item.href} className="text-sm font-medium text-slate-600 hover:text-blue-700">
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
