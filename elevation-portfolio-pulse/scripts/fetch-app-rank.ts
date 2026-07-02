import type { AppRank, Company } from '../lib/types';

// These packages ship CommonJS with no types; require() avoids friction.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const appStoreScraper = require('app-store-scraper');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const gplayScraper = require('google-play-scraper');

interface LookupResult {
  score?: number;
}

export function toAppRank(
  platform: 'ios' | 'android',
  result: LookupResult,
  fetchedAt: string,
): AppRank {
  return {
    platform,
    rank: null,
    rating: typeof result.score === 'number' ? result.score : null,
    fetchedAt,
  };
}

export async function fetchAppRanks(
  appStore: Company['appStore'],
): Promise<AppRank[]> {
  if (!appStore) return [];

  const fetchedAt = new Date().toISOString();
  const ranks: AppRank[] = [];

  if (appStore.iosId) {
    try {
      const result = await appStoreScraper.app({ id: appStore.iosId });
      ranks.push(toAppRank('ios', result, fetchedAt));
    } catch {
      ranks.push({ platform: 'ios', rank: null, rating: null, fetchedAt });
    }
  }

  if (appStore.androidId) {
    try {
      const result = await gplayScraper.app({ appId: appStore.androidId });
      ranks.push(toAppRank('android', result, fetchedAt));
    } catch {
      ranks.push({ platform: 'android', rank: null, rating: null, fetchedAt });
    }
  }

  return ranks;
}
