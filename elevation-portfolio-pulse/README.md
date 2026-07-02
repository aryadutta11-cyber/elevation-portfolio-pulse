# Elevation Portfolio Pulse

A static dashboard tracking public momentum signals — news coverage,
founder mentions, and app-store rank — across 10 Elevation Capital
portfolio companies. Built as a portfolio piece for a VC-adjacent
interview.

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Refreshing data

```bash
npm run refresh-data
```

This re-scrapes news, founder mentions, and app-store ranks into
`data/portfolio.json`. It requires a `FIRECRAWL_API_KEY` environment
variable — get a free Firecrawl account (no credit card needed for the
free tier used here) and copy `.env.example` to `.env` with your key.
Without the key, the script skips news/founder fetching and only
refreshes app-store ranks.

## Build & deploy

```bash
npm run build
```

This produces a static export in `out/`, deployable to Vercel's free
Hobby tier (or any static host).
