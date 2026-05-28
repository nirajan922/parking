type StatCardProps = {
  value: string;
  label: string;
  description: string;
};

export function StatCard({ value, label, description }: StatCardProps) {
  return (
    <div className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-950/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-4xl font-black tracking-tight text-slate-950">{value}</p>
          <p className="mt-2 text-sm font-bold capitalize text-slate-700">{label}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100 transition group-hover:bg-blue-600 group-hover:text-white">
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="m5 12 4 4L19 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
