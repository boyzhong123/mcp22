import type { ReactNode } from 'react';
import { HtmlLangSync } from '@/components/html-lang-sync';
import { ForceLightTheme } from './_force-light';

export const metadata = {
  title: 'Chivox MCP — Speech assessment for AI language agents',
  description:
    'Give your LLM phoneme-level pronunciation scoring for Mandarin Chinese and English through a single MCP call. Built for developers building AI tutors, conversation partners and reading coaches.',
  openGraph: {
    title: 'Chivox MCP — Speech assessment for AI language agents',
    description:
      'One MCP call gives your LLM phoneme-level scoring for Mandarin and English. Build AI tutors, conversation partners, and reading coaches with production-grade feedback.',
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
      <ForceLightTheme />
      <div translate="no" lang="en" className="min-h-screen flex flex-col bg-background text-foreground">
        {children}
      </div>
    </>
  );
}
