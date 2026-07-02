'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { StatusBadge } from './StatusBadge';
import { RankSparkline } from './RankSparkline';
import { deriveStatus } from '../lib/status';
import type { Company, CompanySignals, Headline } from '../lib/types';

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const DATE_FORMAT = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeZone: 'Asia/Kolkata',
});

const TIMESTAMP_FORMAT = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Kolkata',
});

// Firecrawl returns relative strings like "3 days ago" as often as ISO
// timestamps, so publishedAt isn't reliably Date-parseable. Format when it
// is, otherwise show the source string as-is rather than crash or drop it.
function formatPublishedAt(publishedAt: string): { display: string; iso: string | null } {
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) {
    return { display: publishedAt, iso: null };
  }
  return { display: DATE_FORMAT.format(date), iso: date.toISOString() };
}

function HeadlineList({
  headlines,
  emptyLabel,
}: {
  headlines: Headline[] | null;
  emptyLabel: string;
}) {
  if (headlines === null) {
    return (
      <p className="text-sm text-ec-glass-1/60">
        &mdash; Not fetched yet. Headlines will appear after the next data
        refresh.
      </p>
    );
  }

  if (headlines.length === 0) {
    return <p className="text-sm text-ec-glass-1/60">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-3">
      {headlines.map((h) => (
        <li key={h.url}>
          <a
            href={h.url}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card glass-sheen group flex items-baseline justify-between gap-4 rounded-2xl px-5 py-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ec-blue"
          >
            <span>
              <span className="block text-sm font-medium leading-snug text-ec-cream transition-colors group-hover:text-ec-glass-2">
                {h.title}
              </span>
              {h.publishedAt && (() => {
                const { display, iso } = formatPublishedAt(h.publishedAt);
                return (
                  <time
                    dateTime={iso ?? undefined}
                    className="mt-1.5 block text-xs text-ec-glass-1/50"
                  >
                    {display}
                  </time>
                );
              })()}
            </span>
            <span
              aria-hidden
              className="shrink-0 text-sm text-ec-blue/70 transition-all duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ec-blue"
            >
              &#8599;
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function CompanyDetailView({
  company,
  signals,
  generatedAt,
}: {
  company: Company;
  signals: CompanySignals;
  generatedAt: string;
}) {
  const reduceMotion = useReducedMotion();
  const status = deriveStatus(signals);

  const sections: { title: string; body: React.ReactNode }[] = [
    {
      title: 'App-store standing',
      body: <RankSparkline ranks={signals.appRanks} />,
    },
    {
      title: 'Recent news',
      body: (
        <HeadlineList
          headlines={signals.news}
          emptyLabel="No recent coverage found in the last refresh."
        />
      ),
    },
    {
      title: 'Founder mentions',
      body: (
        <HeadlineList
          headlines={signals.founderMentions}
          emptyLabel="No founder mentions found in the last refresh."
        />
      ),
    },
  ];

  const enter = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.65, delay, ease: EASE_OUT_EXPO },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <motion.div {...enter(0)}>
        <Link
          href="/"
          className="group inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-ec-glass-1/60 transition-colors hover:text-ec-blue focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ec-blue"
        >
          <span
            aria-hidden
            className="inline-block transition-transform duration-300 ease-out group-hover:-translate-x-1"
          >
            &larr;
          </span>
          Portfolio Pulse
        </Link>
      </motion.div>

      <motion.header className="mt-8" {...enter(0.08)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Monogram roundel — same language as the dashboard cards */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-ec-glass-1/20 bg-gradient-to-br from-ec-blue/25 to-ec-blue/5 text-2xl font-semibold text-ec-glass-2 shadow-[inset_0_1px_0_rgba(235,241,250,0.15)]">
              {company.name.charAt(0)}
            </div>
            <h1 className="text-gradient-brand text-4xl font-bold tracking-tight sm:text-5xl">
              {company.name}
            </h1>
          </div>
          <div className="pt-2">
            <StatusBadge status={status} />
          </div>
        </div>

        <dl className="mt-6 flex flex-wrap items-baseline gap-x-8 gap-y-2 text-sm">
          <div className="flex items-baseline gap-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ec-glass-1/50">
              {company.founders.length > 1 ? 'Founders' : 'Founder'}
            </dt>
            <dd className="font-medium text-ec-glass-2">
              {company.founders.join(', ')}
            </dd>
          </div>
          <div className="flex items-baseline gap-2 text-ec-glass-1/50">
            <dt>Last refreshed</dt>
            <dd>
              <time dateTime={generatedAt} className="text-ec-glass-1/70">
                {TIMESTAMP_FORMAT.format(new Date(generatedAt))} IST
              </time>
            </dd>
          </div>
        </dl>
      </motion.header>

      {sections.map((section, i) => (
        <motion.section
          key={section.title}
          className="mt-12"
          {...enter(0.16 + i * 0.08)}
        >
          <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-ec-blue">
            {section.title}
          </h2>
          <div className="mt-4">{section.body}</div>
        </motion.section>
      ))}

      <motion.footer
        className="mt-16 border-t border-ec-glass-1/10 pt-6 text-xs text-ec-glass-1/40"
        {...enter(0.16 + sections.length * 0.08)}
      >
        Signals are derived from public sources and refreshed on a schedule.
        Static snapshot &mdash; not investment advice.
      </motion.footer>
    </div>
  );
}
