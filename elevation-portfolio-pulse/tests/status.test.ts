import { describe, it, expect } from 'vitest';
import { deriveStatus } from '../lib/status';
import type { CompanySignals } from '../lib/types';

function makeSignals(overrides: Partial<CompanySignals>): CompanySignals {
  return {
    slug: 'test',
    news: [],
    founderMentions: [],
    appRanks: null,
    ...overrides,
  };
}

function headlines(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    title: `Headline ${i}`,
    url: 'https://example.com',
    publishedAt: null,
  }));
}

describe('deriveStatus', () => {
  it('returns "hot" when there are 15 or more news headlines', () => {
    expect(deriveStatus(makeSignals({ news: headlines(15) }))).toBe('hot');
    expect(deriveStatus(makeSignals({ news: headlines(20) }))).toBe('hot');
  });

  it('returns "watch" when there are 6-14 news headlines', () => {
    expect(deriveStatus(makeSignals({ news: headlines(6) }))).toBe('watch');
    expect(deriveStatus(makeSignals({ news: headlines(14) }))).toBe('watch');
  });

  it('returns "stable" when there are 5 or fewer news headlines', () => {
    expect(deriveStatus(makeSignals({ news: headlines(5) }))).toBe('stable');
    expect(deriveStatus(makeSignals({ news: [] }))).toBe('stable');
  });

  it('returns "stable" when news data is null (fetch failed)', () => {
    const signals = makeSignals({ news: null });
    expect(deriveStatus(signals)).toBe('stable');
  });
});
