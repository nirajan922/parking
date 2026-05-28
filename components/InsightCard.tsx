type InsightCardProps = {
  title: string;
  value: string;
  description: string;
};

export function InsightCard({ title, value, description }: InsightCardProps) {
  return (
    <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-6 text-white shadow-2xl shadow-blue-950/20 backdrop-blur">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">{title}</p>
      <p className="mt-5 text-4xl font-bold">{value}</p>
      <p className="mt-3 text-sm leading-6 text-blue-100">{description}</p>
    </div>
  );
}
