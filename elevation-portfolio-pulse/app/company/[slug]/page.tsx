import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { COMPANIES } from '../../../data/companies';
import portfolio from '../../../data/portfolio.json';
import { CompanyDetailView } from '../../../components/CompanyDetailView';
import { ParallaxBackground } from '../../../components/ParallaxBackground';
import type { PortfolioSnapshot } from '../../../lib/types';

const snapshot = portfolio as PortfolioSnapshot;

export function generateStaticParams() {
  return COMPANIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const company = COMPANIES.find((c) => c.slug === slug);
  if (!company) return {};
  return {
    title: `${company.name} — Portfolio Pulse`,
    description: `Public momentum signals for ${company.name}: news coverage, founder mentions, and app-store standing.`,
  };
}

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = COMPANIES.find((c) => c.slug === slug);
  const signals = snapshot.companies.find((c) => c.slug === slug);
  if (!company || !signals) notFound();

  return (
    <main className="relative min-h-screen px-6 py-16 sm:px-10 lg:px-12 sm:py-20">
      <ParallaxBackground />
      <CompanyDetailView
        company={company}
        signals={signals}
        generatedAt={snapshot.generatedAt}
      />
    </main>
  );
}
