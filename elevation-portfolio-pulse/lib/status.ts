import type { CompanySignals } from './types';

export type Status = 'hot' | 'watch' | 'stable';

export function deriveStatus(signals: CompanySignals): Status {
  const newsCount = signals.news?.length ?? 0;

  if (newsCount >= 5) return 'hot';
  if (newsCount >= 1) return 'watch';
  return 'stable';
}
