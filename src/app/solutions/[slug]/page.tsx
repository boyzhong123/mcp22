import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SeoDetailPage } from '@/app/_marketing/seo-detail-page';
import { SOLUTION_PAGES } from '@/app/_marketing/seo-content';
import { absoluteUrl } from '@/lib/site';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(SOLUTION_PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = SOLUTION_PAGES[(await params).slug];
  if (!page) return {};
  return {
    title: `${page.title} | Chivox AI`,
    description: page.description,
    alternates: { canonical: page.path },
    openGraph: { title: page.title, description: page.description, url: absoluteUrl(page.path), type: 'website' },
  };
}

export default async function SolutionPage({ params }: Props) {
  const page = SOLUTION_PAGES[(await params).slug];
  if (!page) notFound();
  return <SeoDetailPage page={page} />;
}
