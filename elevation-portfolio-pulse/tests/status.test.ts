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

describe('deriveStatus', () => {
  it('returns "hot" when there are 5 or more news headlines', () => {
    const signals = makeSignals({
      news: Array.from({ length: 5 }, (_, i) => ({
        title: `Headline ${i}`,
        url: 'https://example.com',
        publishedAt: null,
      })),
    });
    expect(deriveStatus(signals)).toBe('hot');
  });

  it('returns "watch" when there are 1-4 news headlines', () => {
    const signals = makeSignals({
      news: [{ title: 'One headline', url: 'https://example.com', publishedAt: null }],
    });
    expect(deriveStatus(signals)).toBe('watch');
  });

  it('returns "stable" when there is no news', () => {
    const signals = makeSignals({ news: [] });
    expect(deriveStatus(signals)).toBe('stable');
  });

  it('returns "stable" when news data is null (fetch failed)', () => {
    const signals = makeSignals({ news: null });
    expect(deriveStatus(signals)).toBe('stable');
  });
});
