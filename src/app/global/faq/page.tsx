import Link from 'next/link';
import { ArrowRight, ChevronDown } from 'lucide-react';
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
    category: 'Integration',
    q: 'How fast can I integrate?',
    a: 'Minutes. Drop one object into your MCP client config, set the API key, and your agent can call `assess_speech` as a tool. No SDK wrappers, no ML setup.',
  },
  {
    category: 'Capability',
    q: 'Which languages are supported?',
    a: 'Mandarin Chinese and English are first-class, both with phoneme-level scoring. Chinese includes dedicated handling for tones, pinyin, neutral tone, erhua and tone sandhi. English includes CEFR-aligned scoring with stress and rhythm diagnostics.',
  },
  {
    category: 'Integration',
    q: 'Which MCP clients work?',
    a: 'Cursor, Claude Desktop, Cline, Windsurf, Zed, and any other MCP-compatible client. Also works as a tool inside LangChain, LlamaIndex and the OpenAI Agents SDK via the MCP adapter.',
  },
  {
    category: 'Capability',
    q: 'Can I stream audio in real time?',
    a: 'Yes. A WebSocket streaming session accepts mic audio frames and returns scores within a few hundred milliseconds of end-of-speech. File evaluation supports mp3 / wav / m4a / ogg / aac / pcm.',
  },
  {
    category: 'Trust',
    q: 'How accurate is the scoring?',
    a: 'The underlying engine has 95%+ correlation with human expert rubrics, validated by national standardized tests used across 100+ cities, with 9.2B+ evaluations per year.',
  },
  {
    category: 'Commercial',
    q: 'What does it cost?',
    a: 'Free credits on signup. Tiered pricing scales with usage — higher volumes get lower unit prices. Contact sales for enterprise SLAs.',
  },
];

const FAQ_CATEGORIES = ['Integration', 'Capability', 'Trust', 'Commercial'] as const;

export default function GlobalFaqPage() {
  return (
    <div className="marketing-page relative">
      <AmbientBackdrop />
      <TopNav />
      <BackToOverview current="FAQ" containerClassName="container mx-auto px-6 max-w-3xl pt-6" />

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

          <div className="space-y-8">
            {FAQ_CATEGORIES.map((category) => {
              const items = FAQS.filter((faq) => faq.category === category);
              return (
                <section key={category} aria-labelledby={`faq-${category.toLowerCase()}`}>
                  <div className="mb-3 flex items-center justify-between gap-4 px-1">
                    <h2
                      id={`faq-${category.toLowerCase()}`}
                      className="text-[11px] font-mono uppercase tracking-[0.18em] text-emerald-700"
                    >
                      /{category}
                    </h2>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {items.length} {items.length === 1 ? 'answer' : 'answers'}
                    </span>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-zinc-900/[0.08] bg-white/70 backdrop-blur-md divide-y divide-zinc-900/[0.06]">
                    {items.map((f, index) => (
                      <details
                        key={f.q}
                        open={category === 'Integration' && index === 0}
                        className="group px-5 py-4 open:bg-white/65 md:px-6 md:py-5"
                      >
                        <summary className="flex min-h-7 cursor-pointer list-none items-center justify-between gap-4 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/60 focus-visible:ring-offset-4">
                          <span className="text-[15px] font-semibold tracking-[-0.01em] text-zinc-900 md:text-base">
                            {f.q}
                          </span>
                          <ChevronDown
                            aria-hidden
                            className="h-4 w-4 shrink-0 text-zinc-500 transition-transform group-open:rotate-180"
                          />
                        </summary>
                        <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground md:text-sm">
                          {f.a}
                        </p>
                      </details>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          <FadeUp delay={0.1} className="mt-10 grid gap-3 sm:grid-cols-2">
            <Link
              href="/docs"
              className="group rounded-2xl border border-zinc-900/[0.08] bg-white/65 p-5 transition-colors hover:border-emerald-500/30 hover:bg-white"
            >
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-700">/implement</span>
              <span className="mt-2 flex items-center justify-between gap-3 font-semibold text-zinc-900">
                Read the developer docs
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
            <Link
              href="/pricing"
              className="group rounded-2xl border border-zinc-900/[0.08] bg-white/65 p-5 transition-colors hover:border-emerald-500/30 hover:bg-white"
            >
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-700">/commercial</span>
              <span className="mt-2 flex items-center justify-between gap-3 font-semibold text-zinc-900">
                Compare pricing options
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </FadeUp>
        </div>
      </section>

      <ContactSection />
      <SiteFooter />
    </div>
  );
}
