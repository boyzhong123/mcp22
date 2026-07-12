import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, Braces, Languages, Radio } from 'lucide-react';
import { AmbientBackdrop, ContactSection, SiteFooter, TopNav } from '@/app/global/_chrome';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Voice AI and Pronunciation Assessment Resources | Chivox AI',
  description: 'Practical guides on speech assessment, pronunciation scoring, voice AI, MCP integration and language-learning product design from Chivox AI.',
  alternates: { canonical: '/blog' },
  openGraph: { title: 'Voice AI and Pronunciation Assessment Resources | Chivox AI', description: 'Practical speech assessment and MCP integration resources for product and engineering teams.', url: absoluteUrl('/blog'), type: 'website' },
};

const RESOURCES = [
  { icon: Braces, href: '/reasoning', eyebrow: 'Payload design', title: 'How structured speech evidence grounds an LLM', body: 'Follow pronunciation, fluency and audio-quality fields from assessment response to learner-facing explanation.' },
  { icon: Languages, href: '/products/mandarin-chinese-assessment', eyebrow: 'Mandarin', title: 'Why tone-level evidence changes the coaching loop', body: 'See how tone and Pinyin detail help a tutor move from a generic score to a focused retry.' },
  { icon: Radio, href: '/runtime', eyebrow: 'Production', title: 'The day-two work behind a reliable speech tool', body: 'Plan keys, limits, observability, privacy and failure handling before production traffic arrives.' },
] as const;

export default function BlogPage() {
  return (
    <div translate="no" lang="en" className="min-h-screen bg-background text-foreground">
      <AmbientBackdrop /><TopNav />
      <main>
        <section className="border-b border-[#e9e2d2]/70">
          <div className="container mx-auto max-w-6xl px-6 pb-20 pt-16 md:pb-24 md:pt-24">
            <div className="max-w-4xl"><div className="text-[11px] font-mono uppercase tracking-[0.22em] text-emerald-700">/resources</div><h1 className="mt-4 text-crisp text-[44px] font-black leading-[1.02] tracking-[-0.04em] text-zinc-900 sm:text-[58px]">Build better speech and voice-AI products.</h1><p className="mt-7 max-w-3xl text-[17px] leading-relaxed text-muted-foreground">Practical explanations for teams integrating pronunciation assessment, designing AI tutor feedback and operating speech tools in production.</p></div>
          </div>
        </section>
        <section className="py-20 md:py-24"><div className="container mx-auto max-w-6xl px-6"><div className="grid gap-5 md:grid-cols-3">{RESOURCES.map(({icon:Icon,...item}) => <article key={item.href} className="flex flex-col rounded-2xl border border-zinc-900/[0.08] bg-white/72 p-7"><Icon className="h-6 w-6 text-emerald-700"/><div className="mt-6 text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-700">/{item.eyebrow}</div><h2 className="mt-2 text-[22px] font-semibold leading-tight tracking-[-0.02em] text-zinc-900">{item.title}</h2><p className="mt-3 flex-1 text-[14px] leading-relaxed text-muted-foreground">{item.body}</p><Link href={item.href} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800">Read the guide <ArrowRight className="h-4 w-4"/></Link></article>)}</div><div className="warm-card mt-10 flex flex-col items-start justify-between gap-6 p-7 md:flex-row md:items-center md:p-10"><div><BookOpen className="h-6 w-6 text-emerald-700"/><h2 className="mt-4 text-[26px] font-semibold tracking-[-0.025em] text-zinc-900">Looking for implementation details?</h2><p className="mt-2 text-[14px] text-muted-foreground">The developer docs contain quickstarts, payload fields, endpoints and integration recipes.</p></div><Link href="/docs" className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-zinc-900 px-5 text-sm font-semibold text-white">Open docs <ArrowRight className="h-4 w-4"/></Link></div></div></section>
      </main>
      <ContactSection /><SiteFooter />
    </div>
  );
}
