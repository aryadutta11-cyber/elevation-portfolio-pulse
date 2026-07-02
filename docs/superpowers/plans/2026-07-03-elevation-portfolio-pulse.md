# Elevation Portfolio Pulse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, visually polished Next.js dashboard tracking public
signals (news, founder mentions, app store rank) across 10 Elevation Capital
portfolio companies.

**Architecture:** A Node refresh script fetches signals from Firecrawl
Search API and app store scraper libraries, writing a JSON snapshot to
`data/portfolio.json`. A static Next.js (App Router) site reads that JSON at
build time and renders a dashboard grid + per-company detail view, styled
with Elevation Capital's brand colors, glassmorphism, parallax scroll, and
Framer Motion animations.

**Tech Stack:** Next.js 14+ (App Router, static export), TypeScript,
Tailwind CSS, Framer Motion, Firecrawl SDK (`@mendable/firecrawl-js`),
`app-store-scraper`, `google-play-scraper`, Vitest for unit tests.

## Global Constraints

- No backend/API routes, no auth, no database — static export only.
- No credit card required anywhere; Firecrawl free tier (1,000
  credits/month), Vercel Hobby tier, app store scrapers (no auth).
- Brand colors, verbatim: background `#0d1b2a` / `#0F172A`, accent
  `#3283FF`, glass tints `#C3DAF8` / `#d6e6ff` / `#EBF1FA`, light surface
  `#f4f2ed`.
- Portfolio companies, exact list: Swiggy, Paytm, MakeMyTrip, Meesho, Urban
  Company, Acko, NoBroker, Spinny, XpressBees, Unacademy.
- Per-signal, per-company failures must degrade to "no data" — never throw
  and block the rest of the refresh run or the page render.
- No test suite beyond what's specified per task below (this is a small
  demo project — tests target the data pipeline's parsing/aggregation logic,
  not UI pixel output).

---

## File Structure

```
elevation-portfolio-pulse/
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── data/
│   ├── companies.ts          # hardcoded portfolio config
│   └── portfolio.json        # generated snapshot (refresh script output)
├── scripts/
│   ├── refresh-data.ts       # orchestrates the refresh
│   ├── fetch-news.ts         # Firecrawl news/founder search
│   └── fetch-app-rank.ts     # app store scraper wrapper
├── lib/
│   ├── types.ts              # shared types: Company, Signal, Snapshot
│   └── status.ts             # badge status derivation logic
├── app/
│   ├── layout.tsx
│   ├── page.tsx               # dashboard grid
│   ├── globals.css
│   └── company/[slug]/page.tsx # detail view
├── components/
│   ├── CompanyCard.tsx
│   ├── StatusBadge.tsx
│   ├── ParallaxBackground.tsx
│   └── RankSparkline.tsx
└── tests/
    ├── status.test.ts
    ├── fetch-news.test.ts
    └── fetch-app-rank.test.ts
```

---

## Task 1: Project scaffold + shared types

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `tailwind.config.ts`
- Create: `app/globals.css`
- Create: `app/layout.tsx`
- Create: `lib/types.ts`
- Test: none (scaffold task, verified by build succeeding)

**Interfaces:**
- Produces: `Company`, `CompanySignals`, `PortfolioSnapshot` types from
  `lib/types.ts`, used by every later task.

- [ ] **Step 1: Initialize the Next.js project**

```bash
cd "/Users/arya/yc try"
npx create-next-app@latest elevation-portfolio-pulse --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm
```

- [ ] **Step 2: Configure static export**

Edit `elevation-portfolio-pulse/next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
};

export default nextConfig;
```

- [ ] **Step 3: Install additional dependencies**

```bash
cd "/Users/arya/yc try/elevation-portfolio-pulse"
npm install framer-motion @mendable/firecrawl-js app-store-scraper google-play-scraper
npm install -D vitest tsx @types/node
```

- [ ] **Step 4: Write shared types**

Create `elevation-portfolio-pulse/lib/types.ts`:

```typescript
export interface Company {
  slug: string;
  name: string;
  founders: string[];
  newsQuery: string;
  appStore?: { iosId?: string; androidId?: string };
}

export interface Headline {
  title: string;
  url: string;
  publishedAt: string | null;
}

export interface AppRank {
  platform: 'ios' | 'android';
  rank: number | null;
  rating: number | null;
  fetchedAt: string;
}

export interface CompanySignals {
  slug: string;
  news: Headline[] | null;
  founderMentions: Headline[] | null;
  appRanks: AppRank[] | null;
}

export interface PortfolioSnapshot {
  generatedAt: string;
  companies: CompanySignals[];
}
```

- [ ] **Step 5: Set brand colors in Tailwind config**

Edit `elevation-portfolio-pulse/tailwind.config.ts`, inside `theme.extend`:

```typescript
    colors: {
      'ec-navy': '#0d1b2a',
      'ec-navy-deep': '#0F172A',
      'ec-blue': '#3283FF',
      'ec-glass-1': '#C3DAF8',
      'ec-glass-2': '#d6e6ff',
      'ec-glass-3': '#EBF1FA',
      'ec-cream': '#f4f2ed',
    },
```

- [ ] **Step 6: Verify the scaffold builds**

Run: `cd "/Users/arya/yc try/elevation-portfolio-pulse" && npm run build`
Expected: build completes successfully with the default Next.js starter
page (no output errors).

- [ ] **Step 7: Commit**

```bash
cd "/Users/arya/yc try"
git add elevation-portfolio-pulse
git commit -m "Scaffold Next.js static export project with brand colors and shared types"
```

---

## Task 2: Portfolio company config

**Files:**
- Create: `elevation-portfolio-pulse/data/companies.ts`
- Test: `elevation-portfolio-pulse/tests/companies.test.ts`

**Interfaces:**
- Consumes: `Company` type from `lib/types.ts` (Task 1)
- Produces: `COMPANIES: Company[]` — the fixed list of 10 companies, used by
  `scripts/refresh-data.ts` (Task 5) and `app/page.tsx` (Task 6)

- [ ] **Step 1: Write the failing test**

Create `elevation-portfolio-pulse/tests/companies.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "/Users/arya/yc try/elevation-portfolio-pulse" && npx vitest run tests/companies.test.ts`
Expected: FAIL with "Cannot find module '../data/companies'"

- [ ] **Step 3: Write the company config**

Create `elevation-portfolio-pulse/data/companies.ts`:

```typescript
import type { Company } from '../lib/types';

export const COMPANIES: Company[] = [
  {
    slug: 'swiggy',
    name: 'Swiggy',
    founders: ['Sriharsha Majety', 'Nandan Reddy'],
    newsQuery: 'Swiggy',
    appStore: { iosId: '1044687540', androidId: 'in.swiggy.android' },
  },
  {
    slug: 'paytm',
    name: 'Paytm',
    founders: ['Vijay Shekhar Sharma'],
    newsQuery: 'Paytm',
    appStore: { iosId: '473941634', androidId: 'net.one97.paytm' },
  },
  {
    slug: 'makemytrip',
    name: 'MakeMyTrip',
    founders: ['Deep Kalra'],
    newsQuery: 'MakeMyTrip',
    appStore: { iosId: '341542235', androidId: 'com.makemytrip' },
  },
  {
    slug: 'meesho',
    name: 'Meesho',
    founders: ['Vidit Aatrey', 'Sanjeev Barnwal'],
    newsQuery: 'Meesho',
    appStore: { iosId: '1140262718', androidId: 'com.meesho.supply' },
  },
  {
    slug: 'urban-company',
    name: 'Urban Company',
    founders: ['Abhiraj Bhal', 'Varun Khaitan', 'Raghav Chandra'],
    newsQuery: 'Urban Company',
    appStore: { iosId: '1042330077', androidId: 'com.urbanclap.urbanclap' },
  },
  {
    slug: 'acko',
    name: 'Acko',
    founders: ['Varun Dua'],
    newsQuery: 'Acko insurance',
    appStore: { iosId: '1451486180', androidId: 'com.acko.android' },
  },
  {
    slug: 'nobroker',
    name: 'NoBroker',
    founders: ['Amit Kumar Agarwal', 'Akhil Gupta', 'Saurabh Garg'],
    newsQuery: 'NoBroker',
    appStore: { iosId: '1044995491', androidId: 'com.nobroker.app' },
  },
  {
    slug: 'spinny',
    name: 'Spinny',
    founders: ['Niraj Singh'],
    newsQuery: 'Spinny cars',
    appStore: { iosId: '1439812376', androidId: 'com.spinny.spinny' },
  },
  {
    slug: 'xpressbees',
    name: 'XpressBees',
    founders: ['Amitava Saha'],
    newsQuery: 'XpressBees',
  },
  {
    slug: 'unacademy',
    name: 'Unacademy',
    founders: ['Gaurav Munjal', 'Roman Saini', 'Hemesh Singh'],
    newsQuery: 'Unacademy',
    appStore: { iosId: '1462031783', androidId: 'com.unacademyapp' },
  },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd "/Users/arya/yc try/elevation-portfolio-pulse" && npx vitest run tests/companies.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
cd "/Users/arya/yc try"
git add elevation-portfolio-pulse/data/companies.ts elevation-portfolio-pulse/tests/companies.test.ts
git commit -m "Add hardcoded Elevation Capital portfolio company config"
```

---

## Task 3: Status badge derivation logic

**Files:**
- Create: `elevation-portfolio-pulse/lib/status.ts`
- Test: `elevation-portfolio-pulse/tests/status.test.ts`

**Interfaces:**
- Consumes: `CompanySignals` type from `lib/types.ts` (Task 1)
- Produces: `deriveStatus(signals: CompanySignals): 'hot' | 'watch' | 'stable'`
  used by `components/StatusBadge.tsx` (Task 7)

- [ ] **Step 1: Write the failing test**

Create `elevation-portfolio-pulse/tests/status.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "/Users/arya/yc try/elevation-portfolio-pulse" && npx vitest run tests/status.test.ts`
Expected: FAIL with "Cannot find module '../lib/status'"

- [ ] **Step 3: Write the implementation**

Create `elevation-portfolio-pulse/lib/status.ts`:

```typescript
import type { CompanySignals } from './types';

export type Status = 'hot' | 'watch' | 'stable';

export function deriveStatus(signals: CompanySignals): Status {
  const newsCount = signals.news?.length ?? 0;

  if (newsCount >= 5) return 'hot';
  if (newsCount >= 1) return 'watch';
  return 'stable';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd "/Users/arya/yc try/elevation-portfolio-pulse" && npx vitest run tests/status.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd "/Users/arya/yc try"
git add elevation-portfolio-pulse/lib/status.ts elevation-portfolio-pulse/tests/status.test.ts
git commit -m "Add status badge derivation logic"
```

---

## Task 4: Firecrawl news fetcher

**Files:**
- Create: `elevation-portfolio-pulse/scripts/fetch-news.ts`
- Test: `elevation-portfolio-pulse/tests/fetch-news.test.ts`

**Interfaces:**
- Consumes: `Headline` type from `lib/types.ts` (Task 1)
- Produces: `fetchNews(query: string, apiKey: string): Promise<Headline[]>`
  used by `scripts/refresh-data.ts` (Task 5)

- [ ] **Step 1: Write the failing test**

Create `elevation-portfolio-pulse/tests/fetch-news.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "/Users/arya/yc try/elevation-portfolio-pulse" && npx vitest run tests/fetch-news.test.ts`
Expected: FAIL with "Cannot find module '../scripts/fetch-news'"

- [ ] **Step 3: Write the implementation**

Create `elevation-portfolio-pulse/scripts/fetch-news.ts`:

```typescript
import FirecrawlApp from '@mendable/firecrawl-js';
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
  const firecrawl = new FirecrawlApp({ apiKey });
  const response = await firecrawl.search(query, { limit: 10 });
  const raw = (response.data ?? []) as RawSearchResult[];
  return parseSearchResults(raw);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd "/Users/arya/yc try/elevation-portfolio-pulse" && npx vitest run tests/fetch-news.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
cd "/Users/arya/yc try"
git add elevation-portfolio-pulse/scripts/fetch-news.ts elevation-portfolio-pulse/tests/fetch-news.test.ts
git commit -m "Add Firecrawl news fetcher with pure parsing function"
```

---

## Task 5: App store rank fetcher

**Files:**
- Create: `elevation-portfolio-pulse/scripts/fetch-app-rank.ts`
- Test: `elevation-portfolio-pulse/tests/fetch-app-rank.test.ts`

**Interfaces:**
- Consumes: `AppRank` type from `lib/types.ts` (Task 1), `Company['appStore']`
  shape from `lib/types.ts` (Task 1)
- Produces: `fetchAppRanks(appStore: Company['appStore']): Promise<AppRank[]>`
  used by `scripts/refresh-data.ts` (Task 6)

- [ ] **Step 1: Write the failing test**

Create `elevation-portfolio-pulse/tests/fetch-app-rank.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "/Users/arya/yc try/elevation-portfolio-pulse" && npx vitest run tests/fetch-app-rank.test.ts`
Expected: FAIL with "Cannot find module '../scripts/fetch-app-rank'"

- [ ] **Step 3: Write the implementation**

Create `elevation-portfolio-pulse/scripts/fetch-app-rank.ts`:

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd "/Users/arya/yc try/elevation-portfolio-pulse" && npx vitest run tests/fetch-app-rank.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
cd "/Users/arya/yc try"
git add elevation-portfolio-pulse/scripts/fetch-app-rank.ts elevation-portfolio-pulse/tests/fetch-app-rank.test.ts
git commit -m "Add app store rank/rating fetcher with pure mapping function"
```

---

## Task 6: Refresh orchestration script

**Files:**
- Create: `elevation-portfolio-pulse/scripts/refresh-data.ts`
- Create: `elevation-portfolio-pulse/data/portfolio.json` (generated output,
  committed as a placeholder until a real Firecrawl key is available)

**Interfaces:**
- Consumes: `COMPANIES` (Task 2), `fetchNews` (Task 4), `fetchAppRanks`
  (Task 5), `PortfolioSnapshot`/`CompanySignals` types (Task 1)
- Produces: `data/portfolio.json` on disk, consumed by `app/page.tsx`
  (Task 7) and `app/company/[slug]/page.tsx` (Task 8)

- [ ] **Step 1: Write the orchestration script**

Create `elevation-portfolio-pulse/scripts/refresh-data.ts`:

```typescript
import { writeFileSync } from 'fs';
import { join } from 'path';
import { COMPANIES } from '../data/companies';
import { fetchNews } from './fetch-news';
import { fetchAppRanks } from './fetch-app-rank';
import type { CompanySignals, PortfolioSnapshot } from '../lib/types';

async function refreshCompany(
  company: (typeof COMPANIES)[number],
  apiKey: string | undefined,
): Promise<CompanySignals> {
  let news: CompanySignals['news'] = null;
  let founderMentions: CompanySignals['founderMentions'] = null;
  let appRanks: CompanySignals['appRanks'] = null;

  if (apiKey) {
    try {
      news = await fetchNews(company.newsQuery, apiKey);
    } catch (err) {
      console.error(`[news] failed for ${company.slug}:`, err);
    }

    try {
      founderMentions = await fetchNews(company.founders.join(' OR '), apiKey);
    } catch (err) {
      console.error(`[founder] failed for ${company.slug}:`, err);
    }
  } else {
    console.warn('FIRECRAWL_API_KEY not set — skipping news/founder fetch');
  }

  try {
    appRanks = await fetchAppRanks(company.appStore);
  } catch (err) {
    console.error(`[apprank] failed for ${company.slug}:`, err);
  }

  return { slug: company.slug, news, founderMentions, appRanks };
}

async function main() {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  const companies: CompanySignals[] = [];

  for (const company of COMPANIES) {
    console.log(`Refreshing ${company.name}...`);
    companies.push(await refreshCompany(company, apiKey));
  }

  const snapshot: PortfolioSnapshot = {
    generatedAt: new Date().toISOString(),
    companies,
  };

  const outPath = join(__dirname, '..', 'data', 'portfolio.json');
  writeFileSync(outPath, JSON.stringify(snapshot, null, 2));
  console.log(`Wrote snapshot to ${outPath}`);
}

main().catch((err) => {
  console.error('Refresh failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Add an npm script to run it**

Edit `elevation-portfolio-pulse/package.json`, add to `"scripts"`:

```json
    "refresh-data": "tsx scripts/refresh-data.ts"
```

- [ ] **Step 3: Run it without a Firecrawl key to generate a placeholder snapshot**

Run: `cd "/Users/arya/yc try/elevation-portfolio-pulse" && npm run refresh-data`
Expected: Logs "FIRECRAWL_API_KEY not set — skipping news/founder fetch" for
each company, attempts app rank fetches (may succeed or fail per-network),
and writes `data/portfolio.json` with 10 company entries, `news: null`,
`founderMentions: null`.

- [ ] **Step 4: Verify the JSON structure**

Run: `cat "/Users/arya/yc try/elevation-portfolio-pulse/data/portfolio.json" | head -30`
Expected: valid JSON with `generatedAt` and a `companies` array of 10
objects, each with `slug`, `news`, `founderMentions`, `appRanks` keys.

- [ ] **Step 5: Commit**

```bash
cd "/Users/arya/yc try"
git add elevation-portfolio-pulse/scripts/refresh-data.ts elevation-portfolio-pulse/package.json elevation-portfolio-pulse/data/portfolio.json
git commit -m "Add refresh orchestration script and initial placeholder snapshot"
```

---

## Task 7: Dashboard grid UI (glassmorphism, parallax, animations)

**Files:**
- Create: `elevation-portfolio-pulse/components/StatusBadge.tsx`
- Create: `elevation-portfolio-pulse/components/ParallaxBackground.tsx`
- Create: `elevation-portfolio-pulse/components/CompanyCard.tsx`
- Modify: `elevation-portfolio-pulse/app/page.tsx`
- Modify: `elevation-portfolio-pulse/app/globals.css`

**Interfaces:**
- Consumes: `PortfolioSnapshot`/`CompanySignals` (Task 1), `data/portfolio.json`
  (Task 6), `deriveStatus` (Task 3), `COMPANIES` (Task 2)
- Produces: dashboard page at `/`, `CompanyCard` component reused by
  `app/company/[slug]/page.tsx` styling conventions (Task 8)

This is the visual centerpiece task — implement using the Fable 5 model.

- [ ] **Step 1: Add glass utility classes to globals.css**

Edit `elevation-portfolio-pulse/app/globals.css`, append:

```css
.glass-card {
  background: linear-gradient(135deg, rgba(195, 218, 248, 0.08), rgba(214, 230, 255, 0.03));
  border: 1px solid rgba(195, 218, 248, 0.18);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
}

body {
  background-color: #0d1b2a;
  color: #f4f2ed;
}
```

- [ ] **Step 2: Write the StatusBadge component**

Create `elevation-portfolio-pulse/components/StatusBadge.tsx`:

```tsx
import type { Status } from '../lib/status';

const STATUS_CONFIG: Record<Status, { label: string; color: string }> = {
  hot: { label: 'Hot', color: '#22c55e' },
  watch: { label: 'Watch', color: '#eab308' },
  stable: { label: 'Stable', color: '#94a3b8' },
};

export function StatusBadge({ status }: { status: Status }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: `${config.color}22`, color: config.color }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </span>
  );
}
```

- [ ] **Step 3: Write the ParallaxBackground component**

Create `elevation-portfolio-pulse/components/ParallaxBackground.tsx`:

```tsx
'use client';

import { useScroll, useTransform, motion } from 'framer-motion';

export function ParallaxBackground() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 800], [0, 200]);

  return (
    <motion.div
      style={{ y }}
      className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-ec-navy via-ec-navy-deep to-black"
    >
      <div className="absolute left-1/4 top-1/3 h-96 w-96 rounded-full bg-ec-blue/10 blur-3xl" />
      <div className="absolute right-1/4 top-2/3 h-72 w-72 rounded-full bg-ec-glass-2/10 blur-3xl" />
    </motion.div>
  );
}
```

- [ ] **Step 4: Write the CompanyCard component**

Create `elevation-portfolio-pulse/components/CompanyCard.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { StatusBadge } from './StatusBadge';
import type { CompanySignals } from '../lib/types';
import { deriveStatus } from '../lib/status';

export function CompanyCard({
  name,
  slug,
  signals,
  index,
}: {
  name: string;
  slug: string;
  signals: CompanySignals;
  index: number;
}) {
  const status = deriveStatus(signals);
  const newsCount = signals.news?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: 'easeOut' }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
    >
      <Link href={`/company/${slug}`}>
        <div className="glass-card rounded-2xl p-6 transition-shadow hover:shadow-[0_0_40px_rgba(50,131,255,0.15)]">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold text-ec-cream">{name}</h3>
            <StatusBadge status={status} />
          </div>
          <p className="mt-3 text-sm text-ec-glass-1">
            {newsCount > 0 ? `${newsCount} recent mentions` : 'No recent mentions'}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
```

- [ ] **Step 5: Wire up the dashboard page**

Edit `elevation-portfolio-pulse/app/page.tsx`, replace contents:

```tsx
import { COMPANIES } from '../data/companies';
import portfolio from '../data/portfolio.json';
import { CompanyCard } from '../components/CompanyCard';
import { ParallaxBackground } from '../components/ParallaxBackground';
import type { PortfolioSnapshot } from '../lib/types';

const snapshot = portfolio as PortfolioSnapshot;

export default function Home() {
  return (
    <main className="relative min-h-screen px-6 py-16 sm:px-12">
      <ParallaxBackground />
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-ec-cream sm:text-4xl">
          Elevation Portfolio Pulse
        </h1>
        <p className="mt-2 text-ec-glass-1">
          Last refreshed {new Date(snapshot.generatedAt).toLocaleString()}
        </p>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {COMPANIES.map((company, index) => {
            const signals = snapshot.companies.find((c) => c.slug === company.slug);
            if (!signals) return null;
            return (
              <CompanyCard
                key={company.slug}
                name={company.name}
                slug={company.slug}
                signals={signals}
                index={index}
              />
            );
          })}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Verify the dashboard renders**

Run: `cd "/Users/arya/yc try/elevation-portfolio-pulse" && npm run dev`
Open `http://localhost:3000` in a browser. Expected: dark navy page with a
parallax glowing background, 10 glassmorphic cards in a grid, each with a
staggered fade-in animation, status badges, and a hover-lift effect.

- [ ] **Step 7: Commit**

```bash
cd "/Users/arya/yc try"
git add elevation-portfolio-pulse/components elevation-portfolio-pulse/app/page.tsx elevation-portfolio-pulse/app/globals.css
git commit -m "Build glassmorphic dashboard grid with parallax background and card animations"
```

---

## Task 8: Company detail view

**Files:**
- Create: `elevation-portfolio-pulse/components/RankSparkline.tsx`
- Create: `elevation-portfolio-pulse/app/company/[slug]/page.tsx`

**Interfaces:**
- Consumes: `COMPANIES` (Task 2), `data/portfolio.json` (Task 6),
  `CompanySignals`/`AppRank` types (Task 1)
- Produces: `/company/[slug]` route, terminal task for this plan

- [ ] **Step 1: Write the RankSparkline component**

Create `elevation-portfolio-pulse/components/RankSparkline.tsx`:

```tsx
import type { AppRank } from '../lib/types';

export function RankSparkline({ ranks }: { ranks: AppRank[] }) {
  if (ranks.length === 0) {
    return <p className="text-sm text-ec-glass-1">No app store data available.</p>;
  }

  return (
    <div className="flex gap-6">
      {ranks.map((r) => (
        <div key={r.platform} className="glass-card rounded-xl px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-ec-glass-1">{r.platform}</p>
          <p className="mt-1 text-2xl font-semibold text-ec-cream">
            {r.rating !== null ? `${r.rating.toFixed(1)}★` : 'No data'}
          </p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Generate static params and build the detail page**

Create `elevation-portfolio-pulse/app/company/[slug]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { COMPANIES } from '../../../data/companies';
import portfolio from '../../../data/portfolio.json';
import { RankSparkline } from '../../../components/RankSparkline';
import { ParallaxBackground } from '../../../components/ParallaxBackground';
import type { PortfolioSnapshot } from '../../../lib/types';

const snapshot = portfolio as PortfolioSnapshot;

export function generateStaticParams() {
  return COMPANIES.map((c) => ({ slug: c.slug }));
}

export default function CompanyDetail({ params }: { params: { slug: string } }) {
  const company = COMPANIES.find((c) => c.slug === params.slug);
  const signals = snapshot.companies.find((c) => c.slug === params.slug);
  if (!company || !signals) notFound();

  return (
    <main className="relative min-h-screen px-6 py-16 sm:px-12">
      <ParallaxBackground />
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-ec-cream">{company.name}</h1>
        <p className="mt-1 text-ec-glass-1">
          Founders: {company.founders.join(', ')}
        </p>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-ec-cream">App store</h2>
          <div className="mt-3">
            <RankSparkline ranks={signals.appRanks ?? []} />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-ec-cream">Recent news</h2>
          <ul className="mt-3 space-y-3">
            {(signals.news ?? []).length === 0 && (
              <li className="text-sm text-ec-glass-1">No recent news available.</li>
            )}
            {(signals.news ?? []).map((h) => (
              <li key={h.url} className="glass-card rounded-xl px-4 py-3">
                <a href={h.url} target="_blank" rel="noopener noreferrer" className="text-ec-cream hover:text-ec-blue">
                  {h.title}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-ec-cream">Founder mentions</h2>
          <ul className="mt-3 space-y-3">
            {(signals.founderMentions ?? []).length === 0 && (
              <li className="text-sm text-ec-glass-1">No founder mentions available.</li>
            )}
            {(signals.founderMentions ?? []).map((h) => (
              <li key={h.url} className="glass-card rounded-xl px-4 py-3">
                <a href={h.url} target="_blank" rel="noopener noreferrer" className="text-ec-cream hover:text-ec-blue">
                  {h.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify the detail page renders**

Run: `cd "/Users/arya/yc try/elevation-portfolio-pulse" && npm run dev`
Open `http://localhost:3000/company/swiggy`. Expected: page renders with
Swiggy's name, founders, app store section (showing "No data" since no
Firecrawl key is set yet), and empty-state messages for news/founder
mentions.

- [ ] **Step 4: Verify the full static build succeeds**

Run: `cd "/Users/arya/yc try/elevation-portfolio-pulse" && npm run build`
Expected: build completes, `out/` directory generated with static HTML for
`/` and all 10 `/company/[slug]` routes.

- [ ] **Step 5: Run the full test suite**

Run: `cd "/Users/arya/yc try/elevation-portfolio-pulse" && npx vitest run`
Expected: all tests across `tests/companies.test.ts`, `tests/status.test.ts`,
`tests/fetch-news.test.ts`, `tests/fetch-app-rank.test.ts` pass.

- [ ] **Step 6: Commit**

```bash
cd "/Users/arya/yc try"
git add elevation-portfolio-pulse/components/RankSparkline.tsx "elevation-portfolio-pulse/app/company"
git commit -m "Add company detail view with app rank, news, and founder mentions"
```

---

## Post-plan: deployment (requires user action)

Not part of this plan's automatable tasks — needs the user's own accounts:

1. Sign up for a free Firecrawl account, get an API key, set it as
   `FIRECRAWL_API_KEY` locally, re-run `npm run refresh-data` to get real
   data (replacing the placeholder snapshot from Task 6).
2. Push `elevation-portfolio-pulse/` to a GitHub repo under the user's
   account.
3. Connect that repo to a new Vercel project (Hobby/free tier) — Vercel
   auto-detects the Next.js static export config from Task 1.
4. Optional: set up a scheduled GitHub Action to run `refresh-data` and
   push the updated JSON periodically.
