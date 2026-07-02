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

export async function fetchNews(query: string, apiKey: string): Promise<Headline[]> {
  const firecrawl = new Firecrawl({ apiKey });
  const response = await firecrawl.search(query, { sources: ['news'], limit: 10 });
  const raw: RawSearchResult[] = (response.news ?? []).map((item) => ({
    title: 'title' in item ? item.title : undefined,
    url: 'url' in item ? item.url : undefined,
    publishedDate: 'date' in item ? (item.date ?? null) : null,
  }));
  return parseSearchResults(raw);
}
