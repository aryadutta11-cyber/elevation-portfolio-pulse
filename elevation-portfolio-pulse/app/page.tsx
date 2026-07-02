import { COMPANIES } from '../data/companies';
import portfolio from '../data/portfolio.json';
import { CompanyCard } from '../components/CompanyCard';
import { ParallaxBackground } from '../components/ParallaxBackground';
import { deriveStatus, type Status } from '../lib/status';
import type { PortfolioSnapshot } from '../lib/types';

const snapshot = portfolio as PortfolioSnapshot;

const TIMESTAMP_FORMAT = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Kolkata',
});

const STATUS_ORDER: Status[] = ['hot', 'watch', 'stable'];

const STATUS_SUMMARY_STYLE: Record<Status, string> = {
  hot: 'text-emerald-400',
  watch: 'text-yellow-400',
  stable: 'text-slate-400',
};

export default function Home() {
  const statusCounts = snapshot.companies.reduce<Record<Status, number>>(
    (acc, signals) => {
      acc[deriveStatus(signals)] += 1;
      return acc;
    },
    { hot: 0, watch: 0, stable: 0 },
  );

  return (
    <main className="relative min-h-screen px-6 py-16 sm:px-10 lg:px-12 sm:py-20">
      <ParallaxBackground />

      <div className="mx-auto max-w-6xl">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ec-blue">
            Elevation Capital
          </p>
          <h1 className="text-gradient-brand mt-3 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Portfolio Pulse
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ec-glass-1/70">
            Public momentum signals across the portfolio — news coverage,
            founder mentions, and app-store standing at a glance.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ec-glass-1/60">
            <span>
              Last refreshed{' '}
              <time
                dateTime={snapshot.generatedAt}
                className="font-medium text-ec-glass-2"
              >
                {TIMESTAMP_FORMAT.format(new Date(snapshot.generatedAt))} IST
              </time>
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-ec-glass-1/30 sm:inline-block" />
            <span className="flex items-center gap-4">
              {STATUS_ORDER.map((status) => (
                <span key={status} className="flex items-center gap-1.5">
                  <span
                    className={`font-semibold tabular-nums ${STATUS_SUMMARY_STYLE[status]}`}
                  >
                    {statusCounts[status]}
                  </span>
                  <span className="capitalize">{status}</span>
                </span>
              ))}
            </span>
          </div>
        </header>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {COMPANIES.map((company, index) => {
            const signals = snapshot.companies.find(
              (c) => c.slug === company.slug,
            );
            if (!signals) return null;
            return (
              <CompanyCard
                key={company.slug}
                name={company.name}
                slug={company.slug}
                signals={signals}
                index={index}
              />
            );
          })}
        </div>

        <footer className="mt-16 border-t border-ec-glass-1/10 pt-6 text-xs text-ec-glass-1/40">
          Signals are derived from public sources and refreshed on a schedule.
          Static snapshot — not investment advice.
        </footer>
      </div>
    </main>
  );
}
