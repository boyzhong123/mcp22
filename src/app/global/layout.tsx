import type { ReactNode } from 'react';
import { HtmlLangSync } from '@/components/html-lang-sync';

export const metadata = {
  title: 'Speech & Pronunciation Assessment MCP for EdTech and Voice AI | Chivox AI',
  description:
    'Chivox AI provides real-time speech assessment, pronunciation scoring API and MCP server for AI language tutors, voice agents and EdTech platforms. Backed by 20 years of R&D.',
  openGraph: {
    title: 'Speech & Pronunciation Assessment MCP for EdTech and Voice AI | Chivox AI',
    description:
      'Real-time speech assessment, pronunciation scoring API and MCP server for AI language tutors, voice agents and EdTech platforms.',
    url: '/global',
    type: 'website',
  },
  alternates: {
    canonical: '/global',
  },
};

export default function GlobalLayout({ children }: { children: ReactNode }) {
  // Dedicated standalone English landing for overseas developers.
  // Lives outside next-intl routing so it never interferes with the
  // bilingual [locale] site; Chrome auto-translate is also disabled
  // so technical copy (prompts, code, phoneme symbols) survives intact.
  return (
    <>
      <HtmlLangSync lang="en" />
      <div translate="no" lang="en" className="min-h-screen flex flex-col bg-background text-foreground">
        {children}
      </div>
    </>
  );
}
