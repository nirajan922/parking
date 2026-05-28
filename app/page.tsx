import { DashboardPreview } from "@/components/DashboardPreview";
import { FeatureCard } from "@/components/FeatureCard";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { SectionHeading } from "@/components/SectionHeading";
import { StatCard } from "@/components/StatCard";
import { features, howItWorks, stats } from "@/lib/data";

export default function Home() {
  return (
    <main className="overflow-hidden">
      <Header />
      <Hero />

      <section className="px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <StatCard
                key={stat.label}
                value={stat.value}
                label={stat.label}
                description={stat.description}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Features"
            title="Everything teams need to predict, guide, and optimize parking."
            description="A professional product experience that combines forecasting, driver guidance, operations dashboards, and demand intelligence in one responsive interface."
            align="center"
          />

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="relative px-6 py-20 lg:px-8">
        <div className="absolute inset-x-0 top-1/2 -z-10 h-64 bg-blue-50/70" />
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="How it works"
            title="From fragmented parking signals to confident availability decisions."
            description="Smart Parking Availability Predictor organizes every parking data source into a simple operational workflow for planning, real-time response, and driver guidance."
            align="center"
          />

          <div className="relative mt-14 grid gap-6 lg:grid-cols-3">
            <div className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent lg:block" />
            {howItWorks.map((step, index) => (
              <div
                key={step.title}
                className="relative rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-xl shadow-blue-950/5 transition duration-300 hover:-translate-y-2 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-950/10"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white shadow-lg shadow-slate-950/15">
                  {index + 1}
                </div>
                <h3 className="mt-7 text-xl font-bold text-slate-950">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="dashboard" className="px-6 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Dashboard preview"
              title="A startup-grade Smart Parking dashboard for live operations."
              description="Monitor occupancy, predict openings, compare demand curves, and guide drivers from a single SaaS-style command center built for responsive use."
            />
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["Forecast window", "0-6h"],
                ["Demand signals", "18+"],
                ["Operator mode", "Live"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-950/5"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                    {label}
                  </p>
                  <p className="mt-2 text-2xl font-black text-blue-700">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <DashboardPreview />
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-600 via-blue-700 to-slate-950 p-8 text-center text-white shadow-2xl shadow-blue-600/20 sm:p-12">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-blue-100">
              Ready for launch
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              Give every driver and operator a clearer view of parking availability.
            </h2>
            <p className="mt-5 text-base leading-7 text-blue-100">
              Deploy a polished, responsive parking predictor experience that looks credible from the first visit.
            </p>
            <a
              href="mailto:hello@smartparking.ai"
              className="mt-8 inline-flex rounded-full bg-white px-6 py-3.5 text-sm font-bold text-blue-700 shadow-lg transition hover:-translate-y-1 hover:bg-blue-50 hover:shadow-xl"
            >
              Start a Smart Parking conversation
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
