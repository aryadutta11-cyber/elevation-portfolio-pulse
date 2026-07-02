import { describe, it, expect, vi } from 'vitest';
import { parseSearchResults } from '../scripts/fetch-news';

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
