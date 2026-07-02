import Firecrawl from '@mendable/firecrawl-js';
import type { Headline } from '../lib/types';

interface RawSearchResult {
  title?: string;
  url?: string;
  publishedDate?: string | null;
}

export function parseSearchResults(raw: RawSearchResult[]): Headline[] {
  const headlines: Headline[] = [];
  for (const item of raw) {
    if (!item.title || !item.url) continue;
    headlines.push({
      title: item.title,
      url: item.url,
      publishedAt: item.publishedDate ?? null,
    });
  }
  return headlines;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_AGE_DAYS = 90;

const RELATIVE_DATE_PATTERN = /^(\d+)\s+(minute|hour|day|week|month|year)s?\s+ago$/i;
const MS_PER_UNIT: Record<string, number> = {
  minute: 60 * 1000,
  hour: 60 * 60 * 1000,
  day: MS_PER_DAY,
  week: 7 * MS_PER_DAY,
  month: 30 * MS_PER_DAY,
  year: 365 * MS_PER_DAY,
};

// Firecrawl mixes relative ("3 days ago") and absolute ("Sep 25, 2018")
// date strings in the same result set. `Date` parses the absolute form
// natively but returns Invalid Date for the relative form, so that needs
// its own parse path.
export function parsePublishedDate(publishedAt: string, now: Date): Date | null {
  const relative = publishedAt.match(RELATIVE_DATE_PATTERN);
  if (relative) {
    const amount = Number(relative[1]);
    const unitMs = MS_PER_UNIT[relative[2].toLowerCase()];
    return new Date(now.getTime() - amount * unitMs);
  }
  const absolute = new Date(publishedAt);
  return Number.isNaN(absolute.getTime()) ? null : absolute;
}

// Keeps headlines with no date (can't confirm age either way) or a date
// that fails to parse (unknown format — favor not silently dropping real
// results over a strict filter), and drops anything confirmed older than
// maxAgeDays.
export function filterRecent(
  headlines: Headline[],
  maxAgeDays: number,
  now: Date,
): Headline[] {
  return headlines.filter((h) => {
    if (!h.publishedAt) return true;
    const date = parsePublishedDate(h.publishedAt, now);
    if (!date) return true;
    return now.getTime() - date.getTime() <= maxAgeDays * MS_PER_DAY;
  });
}

export async function fetchNews(query: string, apiKey: string): Promise<Headline[]> {
  const firecrawl = new Firecrawl({ apiKey });
  const response = await firecrawl.search(query, { sources: ['news'], limit: 20 });
  const raw: RawSearchResult[] = (response.news ?? []).map((item) => ({
    title: 'title' in item ? item.title : undefined,
    url: 'url' in item ? item.url : undefined,
    publishedDate: 'date' in item ? (item.date ?? null) : null,
  }));
  return filterRecent(parseSearchResults(raw), MAX_AGE_DAYS, new Date());
}
