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
