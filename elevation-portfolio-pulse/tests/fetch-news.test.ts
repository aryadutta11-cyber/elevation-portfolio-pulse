import { describe, it, expect, vi } from 'vitest';
import { parseSearchResults, parsePublishedDate, filterRecent } from '../scripts/fetch-news';
import type { Headline } from '../lib/types';

describe('parseSearchResults', () => {
  it('maps raw Firecrawl search results to Headline objects', () => {
    const raw = [
      { title: 'Swiggy raises funding', url: 'https://example.com/1', publishedDate: '2026-06-01' },
      { title: 'Swiggy launches feature', url: 'https://example.com/2', publishedDate: null },
    ];
    const result = parseSearchResults(raw);
    expect(result).toEqual([
      { title: 'Swiggy raises funding', url: 'https://example.com/1', publishedAt: '2026-06-01' },
      { title: 'Swiggy launches feature', url: 'https://example.com/2', publishedAt: null },
    ]);
  });

  it('returns an empty array for empty input', () => {
    expect(parseSearchResults([])).toEqual([]);
  });

  it('skips entries missing a title or url', () => {
    const raw = [
      { title: '', url: 'https://example.com/1', publishedDate: null },
      { title: 'Valid', url: '', publishedDate: null },
      { title: 'Valid 2', url: 'https://example.com/2', publishedDate: null },
    ];
    expect(parseSearchResults(raw)).toEqual([
      { title: 'Valid 2', url: 'https://example.com/2', publishedAt: null },
    ]);
  });
});

describe('parsePublishedDate', () => {
  const now = new Date('2026-07-03T00:00:00.000Z');

  it('parses relative dates like "3 days ago"', () => {
    const result = parsePublishedDate('3 days ago', now);
    expect(result?.toISOString()).toBe('2026-06-30T00:00:00.000Z');
  });

  it('parses relative dates in hours, weeks, months, and years', () => {
    expect(parsePublishedDate('9 hours ago', now)?.toISOString()).toBe('2026-07-02T15:00:00.000Z');
    expect(parsePublishedDate('2 weeks ago', now)?.toISOString()).toBe('2026-06-19T00:00:00.000Z');
    expect(parsePublishedDate('1 month ago', now)?.toISOString()).toBe('2026-06-03T00:00:00.000Z');
    expect(parsePublishedDate('2 years ago', now)?.toISOString()).toBe('2024-07-03T00:00:00.000Z');
  });

  it('parses absolute dates like "Sep 25, 2018"', () => {
    const result = parsePublishedDate('Sep 25, 2018', now);
    expect(result?.getUTCFullYear()).toBe(2018);
  });

  it('returns null for unparseable strings', () => {
    expect(parsePublishedDate('a while back', now)).toBeNull();
  });
});

describe('filterRecent', () => {
  const now = new Date('2026-07-03T00:00:00.000Z');

  function headline(publishedAt: string | null): Headline {
    return { title: 'Title', url: 'https://example.com', publishedAt };
  }

  it('keeps headlines within maxAgeDays', () => {
    const headlines = [headline('3 days ago'), headline('1 month ago')];
    expect(filterRecent(headlines, 90, now)).toHaveLength(2);
  });

  it('drops headlines older than maxAgeDays', () => {
    const headlines = [headline('3 days ago'), headline('Sep 25, 2018')];
    const result = filterRecent(headlines, 90, now);
    expect(result).toEqual([headline('3 days ago')]);
  });

  it('keeps headlines with no publishedAt', () => {
    const headlines = [headline(null)];
    expect(filterRecent(headlines, 90, now)).toEqual(headlines);
  });

  it('keeps headlines with an unparseable publishedAt rather than dropping them', () => {
    const headlines = [headline('a while back')];
    expect(filterRecent(headlines, 90, now)).toEqual(headlines);
  });
});
