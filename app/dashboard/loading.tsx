export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-blue-950/5">
          <div className="h-6 w-48 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-8 h-10 w-full max-w-xl animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-4 w-full max-w-2xl animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-44 animate-pulse rounded-[1.75rem] border border-slate-200 bg-white"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
