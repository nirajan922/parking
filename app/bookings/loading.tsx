export default function BookingsLoading() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="h-48 animate-pulse rounded-[2rem] bg-white shadow-xl shadow-blue-950/5" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="h-[34rem] animate-pulse rounded-[2rem] bg-white shadow-xl shadow-blue-950/5" />
          <div className="h-[34rem] animate-pulse rounded-[2rem] bg-white shadow-xl shadow-blue-950/5" />
        </div>
      </div>
    </main>
  );
}
