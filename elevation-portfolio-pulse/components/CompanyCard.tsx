'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { StatusBadge } from './StatusBadge';
import type { CompanySignals } from '../lib/types';
import { deriveStatus } from '../lib/status';

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export function CompanyCard({
  name,
  slug,
  signals,
  index,
}: {
  name: string;
  slug: string;
  signals: CompanySignals;
  index: number;
}) {
  const reduceMotion = useReducedMotion();
  const status = deriveStatus(signals);
  const newsCount = signals.news?.length ?? 0;
  const founderCount = signals.founderMentions?.length ?? 0;
  const rating =
    signals.appRanks?.find((r) => r.rating !== null)?.rating ?? null;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.65,
        delay: 0.15 + index * 0.07,
        ease: EASE_OUT_EXPO,
      }}
      whileHover={
        reduceMotion ? undefined : { y: -6, transition: { duration: 0.25, ease: 'easeOut' } }
      }
      className="h-full"
    >
      <Link
        href={`/company/${slug}`}
        className="group block h-full rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ec-blue"
        aria-label={`${name} — signal details`}
      >
        <div className="glass-card glass-sheen flex h-full flex-col rounded-2xl p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              {/* Monogram roundel */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ec-glass-1/20 bg-gradient-to-br from-ec-blue/25 to-ec-blue/5 text-base font-semibold text-ec-glass-2 shadow-[inset_0_1px_0_rgba(235,241,250,0.15)]">
                {name.charAt(0)}
              </div>
              <h3 className="text-lg font-semibold leading-snug tracking-tight text-ec-cream">
                {name}
              </h3>
            </div>
            <StatusBadge status={status} />
          </div>

          <dl className="mt-5 space-y-2 border-t border-ec-glass-1/10 pt-4 text-sm">
            <div className="flex items-baseline justify-between">
              <dt className="text-ec-glass-1/60">News mentions</dt>
              <dd className="font-medium tabular-nums text-ec-glass-2">
                {signals.news === null ? '—' : newsCount}
              </dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-ec-glass-1/60">Founder mentions</dt>
              <dd className="font-medium tabular-nums text-ec-glass-2">
                {signals.founderMentions === null ? '—' : founderCount}
              </dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-ec-glass-1/60">App rating</dt>
              <dd className="font-medium tabular-nums text-ec-glass-2">
                {rating !== null ? `★ ${rating.toFixed(1)}` : '—'}
              </dd>
            </div>
          </dl>

          <div className="mt-auto flex items-center gap-1 pt-5 text-sm font-medium text-ec-blue/80 transition-colors group-hover:text-ec-blue">
            View signals
            <span
              aria-hidden
              className="inline-block transition-transform duration-300 ease-out group-hover:translate-x-1"
            >
              &rarr;
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
