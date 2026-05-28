type FeatureCardProps = {
  title: string;
  description: string;
  icon: string;
  index: number;
};

function FeatureIcon({ icon }: { icon: string }) {
  const commonProps = {
    className: "h-6 w-6",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (icon === "route") {
    return (
      <svg {...commonProps}>
        <path d="M6 19c2.8 0 4-1.5 4-3.5S8.8 12 12 12s4-1.5 4-3.5S17.2 5 20 5" />
        <path d="M4 19h2" />
        <path d="M18 5h2" />
      </svg>
    );
  }

  if (icon === "dashboard") {
    return (
      <svg {...commonProps}>
        <path d="M4 13h7V4H4v9Z" />
        <path d="M13 20h7V4h-7v16Z" />
        <path d="M4 20h7v-5H4v5Z" />
      </svg>
    );
  }

  if (icon === "chart") {
    return (
      <svg {...commonProps}>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="m7 15 3-4 3 2 4-7" />
      </svg>
    );
  }

  if (icon === "calendar") {
    return (
      <svg {...commonProps}>
        <path d="M7 3v4" />
        <path d="M17 3v4" />
        <path d="M4 9h16" />
        <path d="M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
      </svg>
    );
  }

  if (icon === "mobile") {
    return (
      <svg {...commonProps}>
        <path d="M9 2h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
        <path d="M11 18h2" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M4 12a8 8 0 0 1 16 0" />
      <path d="M7 12a5 5 0 0 1 10 0" />
      <path d="M10 12a2 2 0 0 1 4 0" />
      <path d="M12 14v6" />
    </svg>
  );
}

export function FeatureCard({ title, description, icon, index }: FeatureCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-950/10">
      <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-blue-500 to-cyan-400 transition duration-300 group-hover:scale-x-100" />
      <div className="flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100 transition group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-600/25">
          <FeatureIcon icon={icon} />
        </div>
        <span className="text-sm font-black text-slate-200">0{index + 1}</span>
      </div>
      <h3 className="mt-6 text-xl font-bold text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}
