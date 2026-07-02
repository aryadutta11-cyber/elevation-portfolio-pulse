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
