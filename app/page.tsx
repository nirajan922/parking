import { FeatureCard } from "@/components/FeatureCard";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { InsightCard } from "@/components/InsightCard";
import { SectionHeading } from "@/components/SectionHeading";
import { features, timeline } from "@/lib/data";

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />

      <section id="platform" className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Platform"
            title="A clean command center for smarter parking decisions."
            description="Use predictive demand signals to connect drivers with available spaces while giving operators the visibility they need to manage capacity."
            align="center"
          />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                title={feature.title}
                description={feature.description}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="predictions" className="px-6 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 rounded-[2.5rem] bg-slate-950 p-8 shadow-2xl shadow-blue-950/20 sm:p-10 lg:grid-cols-[0.95fr_1.05fr] lg:p-14">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-300">
              Prediction engine
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Turn fragmented parking data into clear availability forecasts.
            </h2>
            <p className="mt-5 text-base leading-7 text-blue-100">
              The predictor blends live occupancy, meter activity, nearby events, commuter peaks, and seasonal patterns into location-level recommendations that stay useful as demand changes.
            </p>
            <div className="mt-8 space-y-4">
              {timeline.map((item, index) => (
                <div key={item} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-sm leading-6 text-blue-50">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <InsightCard
              title="Forecast window"
              value="0-6h"
              description="Short-term availability views for journey planning and dynamic guidance."
            />
            <InsightCard
              title="Demand signals"
              value="18+"
              description="From weather and events to local occupancy history and arrival rates."
            />
            <InsightCard
              title="Operator mode"
              value="Live"
              description="Monitor neighborhoods, lots, zones, and curbside inventory in one view."
            />
            <InsightCard
              title="Driver impact"
              value="-12m"
              description="Reduce average search loops and improve arrival confidence."
            />
          </div>
        </div>
      </section>

      <section id="insights" className="px-6 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <SectionHeading
            eyebrow="Insights"
            title="Designed for city-scale operations and everyday drivers."
            description="A responsive SaaS-style interface keeps critical information legible on executive dashboards, tablets in the field, and mobile devices."
          />

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-blue-950/10">
            <div className="grid gap-4 sm:grid-cols-3">
              {["Sensor feeds", "Historic demand", "Route context"].map((label) => (
                <div key={label} className="rounded-2xl bg-blue-50 p-4 text-center">
                  <p className="text-sm font-semibold text-blue-700">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-3xl bg-gradient-to-br from-blue-600 to-slate-950 p-6 text-white">
              <p className="text-sm font-semibold text-blue-100">Next best action</p>
              <h3 className="mt-3 text-2xl font-bold">Redirect drivers to Riverside Station.</h3>
              <p className="mt-3 text-sm leading-6 text-blue-100">
                Availability is projected to stay above 60% for the next 45 minutes while downtown demand rises.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ["Confidence", "94%"],
                  ["Walk time", "4 min"],
                  ["CO2 saved", "18 kg"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs text-blue-100">{label}</p>
                    <p className="mt-1 text-xl font-bold">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-blue-100 bg-blue-600 p-8 text-center text-white shadow-2xl shadow-blue-600/20 sm:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-100">
            Ready for deployment
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
            Launch a smarter parking experience with predictive availability from day one.
          </h2>
          <a
            href="mailto:hello@parksense.ai"
            className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
          >
            Start a conversation
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
