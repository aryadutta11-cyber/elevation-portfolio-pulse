import { describe, it, expect } from 'vitest';
import { COMPANIES } from '../data/companies';

describe('COMPANIES', () => {
  it('has exactly 10 companies', () => {
    expect(COMPANIES).toHaveLength(10);
  });

  it('has unique slugs', () => {
    const slugs = COMPANIES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('every company has at least one founder and a news query', () => {
    for (const c of COMPANIES) {
      expect(c.founders.length).toBeGreaterThan(0);
      expect(c.newsQuery.length).toBeGreaterThan(0);
    }
  });
});
