# Elevation Portfolio Pulse — Design Spec

## Purpose

A small, visually polished dashboard tracking public signals across a curated
set of Elevation Capital portfolio companies. Built as a portfolio piece for
VC job interviews — demonstrates product sense around portfolio monitoring
(a real category, e.g. Affinity, Cabal) without requiring a real fund's
internal data.

## Scope

Static site. No backend, no API routes, no auth, no database. Data is
fetched by a script run ahead of time (or on a schedule) and committed as a
JSON snapshot that the site renders at build time.

## Portfolio companies (hardcoded, ~10)

Swiggy, Paytm, MakeMyTrip, Meesho, Urban Company, Acko, NoBroker, Spinny,
XpressBees, Unacademy.

Each entry in `data/companies.ts` (or similar config) includes: display name,
founder name(s), news search query, and app store IDs (iOS/Android) where
applicable.

## Signals

1. **News mentions** — via Firecrawl Search API. Free tier (1,000
   credits/month, no card required), well within needs for ~10 companies
   refreshed periodically.
2. **Founder mentions** — same Firecrawl Search call, filtered by founder
   name instead of company name.
3. **App store rank** — via `app-store-scraper` / `google-play-scraper` npm
   packages. Public endpoints, no auth, no key.

If a signal fails for a given company during refresh, that field is omitted
/ marked "no data" in the JSON. One company's failure does not block the
rest of the refresh run.

## Data pipeline

- `scripts/refresh-data.ts` — Node script, run manually or via a scheduled
  GitHub Action. Fetches all three signals for all companies, writes the
  result to `data/portfolio.json`.
- To refresh: run the script, commit the updated JSON, push (Vercel
  redeploys automatically on push via its git integration).

## Frontend

- Next.js (App Router), static export.
- **Dashboard view**: grid of cards, one per company. Each card shows a
  status badge (🟢/🟡/⚪) derived from recent news volume + rank movement.
- **Detail view** (click a card): recent headlines, founder-mention
  headlines, app rank number with a rank-history sparkline where data
  supports it.
- No accounts, no login — single shared read-only view.

## Visual design

Real Elevation Capital brand colors, pulled from their live site CSS:

- Background: deep navy (`#0d1b2a` / `#0F172A`)
- Primary accent: electric blue (`#3283FF`)
- Glass/highlight tints: `#C3DAF8`, `#d6e6ff`, `#EBF1FA`
- Light surfaces/text: `#f4f2ed`

Design language: dark glassmorphic cards (`backdrop-blur` + translucent,
blue-tinted borders), electric blue accents on status badges and highlights,
subtle parallax on scroll (grid drifts at a different speed than
background), smooth Framer Motion animations (staggered fade-in on load,
hover lift on cards). No animation/UI libraries beyond Framer Motion — kept
lightweight.

Frontend/visual implementation is done using the Fable 5 model, since this
is the piece where visual/design judgment matters most.

## Hosting & cost

- Vercel Hobby tier, default `*.vercel.app` domain. Free, no credit card.
- Firecrawl free tier. Free, no credit card, 1,000 credits/month (plenty
  for ~10 companies refreshed periodically).
- `app-store-scraper` / `google-play-scraper`. Free, no key.
- **Total cost: $0, no credit card required anywhere.**

## Error handling

- Per-signal, per-company failures degrade gracefully to "no data" — never
  block the refresh script or break the page render.

## Testing

- No formal test suite, given the scope. Manual verification: run the
  refresh script, check the JSON output for 2-3 sample companies looks
  sane, confirm the page renders correctly before calling it done.
