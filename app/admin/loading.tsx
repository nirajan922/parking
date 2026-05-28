export default function AdminLoading() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="h-56 animate-pulse rounded-[2rem] bg-white shadow-xl shadow-blue-950/5" />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-36 animate-pulse rounded-[1.75rem] bg-white" />
          ))}
        </div>
      </div>
    </main>
  );
}
