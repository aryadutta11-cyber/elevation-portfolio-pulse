import { describe, it, expect } from 'vitest';
import { toAppRank } from '../scripts/fetch-app-rank';

describe('toAppRank', () => {
  it('builds an AppRank from a successful lookup result', () => {
    const result = toAppRank('ios', { score: 4.5 }, '2026-07-03T00:00:00.000Z');
    expect(result).toEqual({
      platform: 'ios',
      rank: null,
      rating: 4.5,
      fetchedAt: '2026-07-03T00:00:00.000Z',
    });
  });

  it('handles missing rating gracefully', () => {
    const result = toAppRank('android', {}, '2026-07-03T00:00:00.000Z');
    expect(result).toEqual({
      platform: 'android',
      rank: null,
      rating: null,
      fetchedAt: '2026-07-03T00:00:00.000Z',
    });
  });
});
