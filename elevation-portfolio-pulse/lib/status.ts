import type { CompanySignals } from './types';

export type Status = 'hot' | 'watch' | 'stable';

export const STATUS_COLORS: Record<Status, string> = {
  hot: '#22c55e',
  watch: '#eab308',
  stable: '#94a3b8',
};

export function deriveStatus(signals: CompanySignals): Status {
  const newsCount = signals.news?.length ?? 0;

  if (newsCount >= 15) return 'hot';
  if (newsCount >= 6) return 'watch';
  return 'stable';
}
