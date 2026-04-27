'use client';

import { FadeUp } from '@/components/animated-section';
import {
  AmbientBackdrop,
  BackToOverview,
  ContactSection,
  SiteFooter,
  TopNav,
} from '../_chrome';

const FAQS = [
  {
    q: 'How fast can I integrate?',
    a: 'Minutes. Drop one object into your MCP client config, set the API key, and your agent can call `assess_speech` as a tool. No SDK wrappers, no ML setup.',
  },
  {
    q: 'Which languages are supported?',
    a: 'Mandarin Chinese and English are first-class, both with phoneme-level scoring. Chinese includes dedicated handling for tones, pinyin, neutral tone, erhua and tone sandhi. English includes CEFR-aligned scoring with stress and rhythm diagnostics.',
  },
  {
    q: 'Which MCP clients work?',
    a: 'Cursor, Claude Desktop, Cline, Windsurf, Zed, and any other MCP-compatible client. Also works as a tool inside LangChain, LlamaIndex and the OpenAI Agents SDK via the MCP adapter.',
  },
  {
    q: 'Can I stream audio in real time?',
    a: 'Yes. A WebSocket streaming session accepts mic audio frames and returns scores within a few hundred milliseconds of end-of-speech. File evaluation supports mp3 / wav / m4a / ogg / aac / pcm.',
  },
  {
    q: 'How accurate is the scoring?',
    a: 'The underlying engine has 95%+ correlation with human expert rubrics, validated by national standardized tests used across 100+ cities, with 9.2B+ evaluations per year.',
  },
  {
    q: 'What does it cost?',
    a: 'Free credits on signup. Tiered pricing scales with usage — higher volumes get lower unit prices. Contact sales for enterprise SLAs.',
  },
];

export default function GlobalFaqPage() {
  return (
    <div className="relative">
      <AmbientBackdrop />
      <TopNav />
      <BackToOverview />

      <section className="relative py-16 md:py-20 border-b border-[#e9e2d2]/70">
        <div className="container mx-auto px-6 max-w-3xl">
          <FadeUp className="mb-10">
            <div className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3">/faq</div>
            <h1 className="heading-display text-3xl md:text-4xl tracking-[-0.02em] mb-3 leading-[1.1]">
              Answers to the first six questions every team asks.
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Integration speed, language coverage, clients, streaming, accuracy, pricing. If yours
              is not here, the contact form below is the fastest way to reach the team.
            </p>
          </FadeUp>

          <div className="rounded-2xl border border-zinc-900/[0.08] bg-white/70 backdrop-blur-md divide-y divide-zinc-900/[0.06]">
            {FAQS.map((f) => (
              <details key={f.q} className="group px-5 md:px-6 py-4 md:py-5 open:bg-white/60">
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none">
                  <span className="text-[15px] md:text-base font-semibold tracking-[-0.01em] text-zinc-900">
                    {f.q}
                  </span>
                  <span className="text-muted-foreground font-mono text-lg group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[13.5px] md:text-sm text-muted-foreground leading-relaxed">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <ContactSection />
      <SiteFooter />
    </div>
  );
}
