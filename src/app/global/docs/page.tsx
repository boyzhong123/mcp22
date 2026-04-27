'use client';

/**
 * /global/docs — English-only developer documentation for Chivox MCP.
 *
 * This is intentionally separate from `/[locale]/docs`. It targets the same
 * Western audience as `/global`, keeps the same warm-cream + emerald palette,
 * and is tuned for the "copy the snippet → it works" browsing pattern.
 *
 * Layout: three columns on desktop —
 *   [ sidebar nav ] [ main content ] [ on-this-page ]
 *
 * Everything is inlined (nav, content, brand) so editing the docs only ever
 * touches this file.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  AudioWaveform,
  BookOpen,
  Boxes,
  Check,
  Copy,
  FileJson,
  GraduationCap,
  Lightbulb,
  Mic,
  Network,
  Plug,
  Rocket,
  Server,
  Sparkles,
  Terminal,
  Waves,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { HeaderAuthCTA } from '../_chrome';

/* ────────────────────────────────────────────────────────────────
 *  Nav structure — groups → children.
 *  Every `id` below must match an element `id` in the content.
 * ──────────────────────────────────────────────────────────────── */

type DocChild = { id: string; label: string };
type DocGroup = { id: string; label: string; icon: React.ElementType; children: DocChild[] };

const DOC_NAV: DocGroup[] = [
  {
    id: 'get-started',
    label: 'Get started',
    icon: Rocket,
    children: [
      { id: 'introduction', label: 'Introduction' },
      { id: 'architecture', label: 'Architecture' },
      { id: 'requirements', label: 'Requirements' },
      { id: 'quickstart', label: 'Quickstart' },
      { id: 'authentication', label: 'Authentication' },
    ],
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: Plug,
    children: [
      { id: 'client-cursor', label: 'Cursor' },
      { id: 'client-claude', label: 'Claude Desktop' },
      { id: 'client-claude-code', label: 'Claude Code' },
      { id: 'client-misc-ides', label: 'Windsurf · Zed · Continue' },
      { id: 'client-frameworks', label: 'LangChain · Mastra · Agents SDK' },
    ],
  },
  {
    id: 'concepts',
    label: 'Core concepts',
    icon: Boxes,
    children: [
      { id: 'what-you-get', label: 'What the engine returns' },
      { id: 'mandarin-scoring', label: 'Mandarin tonal scoring' },
      { id: 'english-scoring', label: 'English phoneme scoring' },
      { id: 'eval-modes', label: 'Streaming vs file evaluation' },
    ],
  },
  {
    id: 'guides',
    label: 'Guides',
    icon: GraduationCap,
    children: [
      { id: 'ai-tutor', label: 'Build an AI pronunciation tutor' },
      { id: 'secondary-analysis', label: 'Secondary analysis with LLM' },
      { id: 'long-term', label: 'Long-term student profiling' },
      { id: 'prompts', label: 'Prompt templates' },
    ],
  },
  {
    id: 'reference',
    label: 'API reference',
    icon: FileJson,
    children: [
      { id: 'tools-en', label: 'English tools · 10' },
      { id: 'tools-cn', label: 'Mandarin tools · 6' },
      { id: 'response-schema', label: 'Response fields' },
      { id: 'error-codes', label: 'Error codes' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: Server,
    children: [
      { id: 'endpoints', label: 'Endpoints' },
      { id: 'limits', label: 'Limits' },
      { id: 'privacy', label: 'Privacy & data handling' },
      { id: 'faq', label: 'FAQ' },
      { id: 'changelog', label: 'Changelog' },
    ],
  },
];

/* Flat list of every leaf id — drives active-state tracking + on-this-page. */
const ALL_IDS = DOC_NAV.flatMap((g) => [g.id, ...g.children.map((c) => c.id)]);

/* ────────────────────────────────────────────────────────────────
 *  Page
 * ──────────────────────────────────────────────────────────────── */

export default function GlobalDocsPage() {
  const [activeId, setActiveId] = useState<string>('introduction');
  const articleRef = useRef<HTMLDivElement | null>(null);

  // Scrollspy tied to the MIDDLE scroll container (on desktop) or the window
  // (on mobile, where the three-pane layout collapses). Only the active-state
  // highlight follows the reader — left nav + right rail never move in sync
  // with article scrolling (联动, not co-scrolling).
  useEffect(() => {
    const els = ALL_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => !!el,
    );
    if (els.length === 0) return;

    const mq = window.matchMedia('(min-width: 1024px)');
    let io: IntersectionObserver | null = null;

    const attach = () => {
      io?.disconnect();
      const useInner = mq.matches && articleRef.current;
      io = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          if (visible[0]) setActiveId(visible[0].target.id);
        },
        {
          root: useInner ? articleRef.current : null,
          rootMargin: useInner ? '-12% 0px -70% 0px' : '-25% 0px -60% 0px',
          threshold: [0, 0.25, 0.5, 0.75, 1],
        },
      );
      els.forEach((el) => io!.observe(el));
    };

    attach();
    mq.addEventListener('change', attach);
    return () => {
      mq.removeEventListener('change', attach);
      io?.disconnect();
    };
  }, []);

  // Intercept anchor clicks so they scroll the correct container. On desktop
  // that's the article pane (window has overflow-hidden); on mobile it's the
  // window itself. Also instantly sets activeId, which feels snappier than
  // waiting a frame for the observer.
  const handleJump = (id: string) => {
    setActiveId(id);
    const target = document.getElementById(id);
    if (!target) return;
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    const root = articleRef.current;
    if (isDesktop && root) {
      const top =
        target.getBoundingClientRect().top -
        root.getBoundingClientRect().top +
        root.scrollTop -
        12;
      root.scrollTo({ top, behavior: 'smooth' });
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <main className="relative min-h-screen lg:h-[100dvh] bg-[#fbf6e9] text-zinc-900 flex flex-col lg:overflow-hidden">
      {/* warm ambient backdrop — matches /global */}
      <AmbientBackdrop />

      <DocsHeader />

      {/* Desktop (lg+) gets a real three-pane layout: each column has its own
          scroll container, so wheel events stay inside that column.
          Below lg, we fall back to normal page scroll (mobile UX). */}
      <div className="relative z-[1] lg:flex-1 lg:min-h-0">
        <div className="mx-auto lg:h-full max-w-[1400px] px-4 sm:px-6 lg:px-8 pt-24 lg:pt-28 pb-16 lg:pb-0">
          <div className="grid gap-8 lg:h-full lg:grid-cols-[16rem_minmax(0,1fr)_14rem] xl:grid-cols-[17rem_minmax(0,1fr)_15rem]">
            <SidebarNav activeId={activeId} onPick={handleJump} />

            <article
              ref={articleRef}
              onClick={(e) => {
                // Intercept in-page hash links so they scroll THIS pane, not
                // the (non-scrolling) window.
                const a = (e.target as HTMLElement).closest('a');
                if (!a) return;
                const href = a.getAttribute('href') ?? '';
                if (!href.startsWith('#')) return;
                const id = href.slice(1);
                if (!id) return;
                if (!document.getElementById(id)) return;
                e.preventDefault();
                handleJump(id);
              }}
              className="min-w-0 lg:h-full lg:overflow-y-auto lg:pr-4 docs-scroll-pane"
            >
              <DocsHero />
              <div className="mt-10 docs-prose">
                <Content />
                <NextPrev activeId={activeId} onPick={handleJump} />
              </div>
              <DocsFooter />
            </article>

            <OnThisPage activeId={activeId} onPick={handleJump} />
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* Make the middle pane's scrollbar a thin, warm hairline that
           matches the cream surface instead of the OS default. */
        .docs-scroll-pane {
          scrollbar-width: thin;
          scrollbar-color: rgba(16, 185, 129, 0.35) transparent;
        }
        .docs-scroll-pane::-webkit-scrollbar { width: 8px; }
        .docs-scroll-pane::-webkit-scrollbar-track { background: transparent; }
        .docs-scroll-pane::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.28);
          border-radius: 999px;
        }
        .docs-scroll-pane::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.5);
        }
        .docs-prose h2 {
          font-size: 30px;
          line-height: 1.15;
          letter-spacing: -0.025em;
          font-weight: 700;
          margin: 0 0 14px;
          color: #18181b;
        }
        .docs-prose h3 {
          font-size: 20px;
          line-height: 1.3;
          letter-spacing: -0.015em;
          font-weight: 700;
          margin: 44px 0 10px;
          color: #18181b;
          scroll-margin-top: 120px;
        }
        .docs-prose h2 {
          scroll-margin-top: 120px;
        }
        .docs-prose p {
          color: #3f3f46;
          font-size: 15.5px;
          line-height: 1.72;
          margin: 0 0 14px;
        }
        .docs-prose p strong {
          color: #18181b;
          font-weight: 600;
        }
        .docs-prose ul,
        .docs-prose ol {
          color: #3f3f46;
          font-size: 15.5px;
          line-height: 1.72;
          padding-left: 1.2em;
          margin: 0 0 14px;
        }
        .docs-prose li { margin: 4px 0; }
        .docs-prose li::marker { color: #10b981; }
        .docs-prose :not(pre) > code {
          font-family: var(--font-geist-mono, ui-monospace, monospace);
          font-size: 13px;
          padding: 2px 6px;
          border-radius: 6px;
          background: rgba(16, 185, 129, 0.10);
          color: #065f46;
          font-weight: 500;
        }
        .docs-prose pre code {
          background: transparent;
          padding: 0;
          font-weight: 400;
        }
        .docs-prose a {
          color: #047857;
          text-decoration: underline;
          text-decoration-color: rgba(16, 185, 129, 0.35);
          text-underline-offset: 3px;
        }
        .docs-prose a:hover {
          text-decoration-color: rgba(16, 185, 129, 0.9);
        }
        .docs-prose hr {
          margin: 48px 0;
          border: 0;
          border-top: 1px dashed rgba(16, 185, 129, 0.25);
        }
      `}</style>
    </main>
  );
}

/* ────────────────────────────────────────────────────────────────
 *  Header (glassy pill, same DNA as /global TopNav)
 * ──────────────────────────────────────────────────────────────── */

function DocsHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-40 pointer-events-none">
      <div className="mx-auto px-3 sm:px-4 pt-3 pointer-events-auto">
        <div
          className={cn(
            'mx-auto flex items-center gap-3 rounded-full border transition-all duration-300',
            scrolled
              ? 'h-[58px] max-w-[min(calc(100%-0.5rem),80rem)] pl-4 pr-1.5 border-zinc-900/[0.08]'
              : 'h-[64px] max-w-[min(calc(100%-0.5rem),88rem)] pl-5 pr-2 border-white/60',
          )}
          style={{
            backgroundColor: scrolled ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.4)',
            backdropFilter: scrolled
              ? 'blur(28px) saturate(200%)'
              : 'blur(18px) saturate(160%)',
            WebkitBackdropFilter: scrolled
              ? 'blur(28px) saturate(200%)'
              : 'blur(18px) saturate(160%)',
            boxShadow: scrolled
              ? 'inset 0 1px 0 rgba(255,255,255,0.92), 0 18px 40px -22px rgba(24,24,27,0.28)'
              : 'inset 0 1px 0 rgba(255,255,255,0.78), 0 12px 28px -20px rgba(24,24,27,0.16)',
          }}
        >
          <Link
            href="/"
            className="shrink-0 rounded-lg outline-offset-2 focus-visible:ring-2 focus-visible:ring-zinc-400/40"
            aria-label="Chivox MCP home"
          >
            <ChivoxMcpBrand />
          </Link>

          <nav
            className={cn(
              'hidden md:flex items-center justify-end flex-1 min-w-0 font-medium tracking-[-0.01em] text-zinc-800',
              'transition-[font-size,gap] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
              scrolled ? 'text-[13px] gap-0' : 'text-[14.5px] gap-0.5 lg:gap-1',
            )}
          >
            <Link
              href="/"
              className="inline-flex items-center rounded-full px-3 py-1.5 hover:text-zinc-900 hover:bg-zinc-900/[0.04] transition-colors"
            >
              Home
            </Link>
            <span className="relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-zinc-900 bg-gradient-to-b from-emerald-50 to-white shadow-[inset_0_0_0_1px_rgba(16,185,129,0.25)]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]" />
              Docs
            </span>
            <Link
              href="/demo"
              className="inline-flex items-center rounded-full px-3 py-1.5 hover:text-zinc-900 hover:bg-zinc-900/[0.04] transition-colors"
            >
              Live demo
            </Link>
            <a
              href="https://github.com/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 hover:text-zinc-900 hover:bg-zinc-900/[0.04] transition-colors"
            >
              GitHub
              <ArrowUpRight className="h-3.5 w-3.5 opacity-55" />
            </a>
          </nav>

          <div className="flex items-center gap-2 shrink-0 ml-auto md:ml-0">
            <HeaderAuthCTA scrolled={scrolled} />
          </div>
        </div>
      </div>
    </header>
  );
}

/* ────────────────────────────────────────────────────────────────
 *  Hero strip at the top of the docs
 * ──────────────────────────────────────────────────────────────── */

function DocsHero() {
  return (
    <div className="max-w-3xl">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[13px] text-zinc-600 hover:text-zinc-900 transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Chivox MCP
      </Link>

      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-white/60 backdrop-blur-sm px-3 py-1 text-[11px] font-mono tracking-[0.18em] uppercase text-emerald-700 mb-4">
        <BookOpen className="h-3 w-3" />
        Docs
      </div>

      <h1 className="text-[42px] md:text-[52px] leading-[1.02] tracking-[-0.035em] font-black text-zinc-900">
        Give your agent{' '}
        <span className="relative whitespace-nowrap">
          <span
            aria-hidden
            className="absolute left-[-4px] right-[-4px] bottom-[6px] h-[36%] rounded-md -z-10"
            style={{
              background:
                'linear-gradient(95deg, rgba(16,185,129,0.45), rgba(52,211,153,0.5) 60%, rgba(251,191,36,0.3))',
            }}
          />
          phoneme-level ears
        </span>
        .
      </h1>

      <p className="mt-5 text-[17px] leading-relaxed text-zinc-600 max-w-2xl">
        Chivox MCP returns a structured score matrix for every syllable, tone, stress,
        phoneme, and pause — in both Mandarin and English. These docs take you from{' '}
        <code className="font-mono text-[13px] px-1.5 py-0.5 rounded bg-emerald-500/12 text-emerald-800">
          npx
        </code>{' '}
        to production in ten minutes.
      </p>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <a
          href="#quickstart"
          className="inline-flex items-center gap-2 h-11 pl-5 pr-2 text-sm font-semibold rounded-full bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)]"
        >
          Jump to Quickstart
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </a>
        <Link
          href="/demo"
          className="inline-flex items-center gap-2 h-11 px-5 text-sm font-semibold rounded-full border border-emerald-500/35 bg-white/70 text-emerald-800 backdrop-blur-sm hover:bg-white transition-all"
        >
          <Sparkles className="h-4 w-4" />
          Try the live demo
        </Link>
        <a
          href="https://github.com/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 h-11 px-4 text-sm font-medium rounded-full text-zinc-700 hover:text-zinc-900 transition-colors"
        >
          View on GitHub
          <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
        </a>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
 *  Sidebar nav
 * ──────────────────────────────────────────────────────────────── */

function SidebarNav({
  activeId,
  onPick,
}: {
  activeId: string;
  onPick: (id: string) => void;
}) {
  const navRef = useRef<HTMLElement | null>(null);

  const activeGroupId = useMemo(() => {
    for (const g of DOC_NAV) {
      if (g.id === activeId) return g.id;
      if (g.children.some((c) => c.id === activeId)) return g.id;
    }
    return '';
  }, [activeId]);

  // Keep the active entry visible in the (independently scrolling) left pane
  // when the reader scrolls the article and the active section changes.
  useEffect(() => {
    const n = navRef.current;
    if (!n) return;
    const target = n.querySelector<HTMLElement>(`[data-nav-id="${activeId}"]`);
    if (!target) return;
    const nr = n.getBoundingClientRect();
    const tr = target.getBoundingClientRect();
    if (tr.top < nr.top + 8 || tr.bottom > nr.bottom - 8) {
      target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeId]);

  return (
    <aside
      ref={navRef}
      className="hidden lg:block h-full overflow-y-auto pr-2 pb-10 docs-scroll-pane"
    >
      <nav className="space-y-6 pt-1">
        {DOC_NAV.map((group) => {
          const isActiveGroup = activeGroupId === group.id;
          return (
            <div key={group.id}>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={cn(
                    'inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors',
                    isActiveGroup
                      ? 'bg-emerald-500/15 text-emerald-700'
                      : 'bg-zinc-900/[0.04] text-zinc-500',
                  )}
                >
                  <group.icon className="h-3.5 w-3.5" />
                </span>
                <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-zinc-500">
                  {group.label}
                </span>
              </div>
              <ul className="space-y-0.5 pl-8 border-l border-[#e9e2d2]/80 ml-[11px]">
                {group.children.map((child) => {
                  const isActive = activeId === child.id;
                  return (
                    <li key={child.id} className="relative">
                      {isActive && (
                        <span
                          aria-hidden
                          className="absolute -left-[33px] top-1.5 h-4 w-0.5 rounded-full bg-emerald-500"
                        />
                      )}
                      <a
                        href={`#${child.id}`}
                        data-nav-id={child.id}
                        onClick={(e) => {
                          e.preventDefault();
                          onPick(child.id);
                        }}
                        className={cn(
                          'block py-1 text-[13px] leading-5 rounded transition-colors',
                          isActive
                            ? 'text-zinc-900 font-medium'
                            : 'text-zinc-600 hover:text-zinc-900',
                        )}
                      >
                        {child.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

/* ────────────────────────────────────────────────────────────────
 *  On-this-page (right rail)
 * ──────────────────────────────────────────────────────────────── */

function OnThisPage({
  activeId,
  onPick,
}: {
  activeId: string;
  onPick?: (id: string) => void;
}) {
  // Find current group and show its children in the rail.
  const group = DOC_NAV.find(
    (g) => g.id === activeId || g.children.some((c) => c.id === activeId),
  );
  if (!group) return null;
  return (
    <aside className="hidden xl:block h-full overflow-y-auto pl-4 border-l border-[#e9e2d2]/80 pt-1 pb-10 docs-scroll-pane">
      <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-zinc-500 mb-3">
        On this page
      </div>
      <ul className="space-y-1">
        {group.children.map((c) => {
          const isActive = activeId === c.id;
          return (
            <li key={c.id}>
              <a
                href={`#${c.id}`}
                onClick={(e) => {
                  if (!onPick) return;
                  e.preventDefault();
                  onPick(c.id);
                }}
                className={cn(
                  'block py-1 text-[12.5px] leading-5 transition-colors',
                  isActive ? 'text-emerald-700 font-medium' : 'text-zinc-500 hover:text-zinc-900',
                )}
              >
                {c.label}
              </a>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 rounded-xl warm-card px-4 py-4">
        <div className="text-[11px] font-mono tracking-[0.16em] uppercase text-emerald-700 mb-1.5">
          Need help?
        </div>
        <p className="text-[12.5px] text-zinc-600 leading-relaxed mb-3">
          Drop a line — engineers read every message.
        </p>
        <a
          href="mailto:sales@chivox.com"
          className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-emerald-800 hover:text-emerald-900"
        >
          sales@chivox.com
          <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>
    </aside>
  );
}

/* ────────────────────────────────────────────────────────────────
 *  Content
 * ──────────────────────────────────────────────────────────────── */

/* ────────────────────────────────────────────────────────────────
 *  Real-world constants (in sync with /[locale]/docs so the two
 *  doc sites never drift on URLs / tool names / limits).
 * ──────────────────────────────────────────────────────────────── */

const MCP_HTTP_URL = 'https://mcp.cloud.chivox.com';
const UPLOAD_URL = 'https://your-audio-host.com/upload';

const TOOLS_EN: [string, string, string][] = [
  ['en_word_eval', 'Word scoring', 'Single-word pronunciation'],
  ['en_word_correction', 'Word correction', 'Detect omissions, extras, wrong phones'],
  ['en_vocab_eval', 'Vocabulary scoring', 'Multiple words in one clip'],
  ['en_sentence_eval', 'Sentence scoring', 'Accuracy + fluency'],
  ['en_sentence_correction', 'Sentence correction', 'Per-word feedback'],
  ['en_paragraph_eval', 'Paragraph read-aloud', 'Long-passage quality'],
  ['en_phonics_eval', 'Phonics scoring', 'Letter-to-sound rules'],
  ['en_choice_eval', 'Oral multiple choice', 'Constrained answers'],
  ['en_semi_open_eval', 'Semi-open prompt', 'Scenario speaking'],
  ['en_realtime_eval', 'Realtime read-aloud', 'Streaming feedback'],
];

const TOOLS_CN: [string, string, string][] = [
  ['cn_word_raw_eval', 'Character scoring', 'Hanzi pronunciation'],
  ['cn_word_pinyin_eval', 'Pinyin scoring', 'Syllable-level with tone'],
  ['cn_sentence_eval', 'Phrase scoring', 'Short utterances'],
  ['cn_paragraph_eval', 'Paragraph scoring', 'Long text'],
  ['cn_rec_eval', 'Constrained recognition', 'Pick-one answers'],
  ['cn_aitalk_eval', 'AI Talk scoring', 'Open-ended dialog evaluation'],
];

function Content() {
  return (
    <>
      {/* ═════════ GET STARTED ═════════ */}
      <section id="get-started">
        <Eyebrow>Get started</Eyebrow>

        <h2 id="introduction">Introduction</h2>
        <p>
          <strong>Chivox MCP</strong> is a Model-Context-Protocol server that
          turns any LLM into a linguistics-grade speech examiner. Point your
          agent at an audio clip and it gets back a structured score matrix —
          overall, accuracy, fluency, rhythm, plus syllable / word / phoneme
          detail for both English and tonal Mandarin.
        </p>
        <p>
          The public catalog ships <strong>16 tools</strong> today:{' '}
          <strong>10 English</strong> tasks (word, sentence, paragraph,
          correction, phonics, multiple choice, semi-open, realtime) and{' '}
          <strong>6 Mandarin</strong> tasks (character, pinyin, sentence,
          paragraph, constrained recognition, AI-Talk). Every tool returns the
          same top-level shape, so switching locales or granularities costs you
          zero schema work.
        </p>
        <p>
          If you&rsquo;ve shipped OpenAI Realtime or Whisper, you already know
          what <em>transcription</em> buys you. Chivox MCP is the layer on top:{' '}
          <strong>how well did the user actually say it</strong>, down to
          individual phonemes and tones, with every field typed and documented.
        </p>

        <Callout icon={Lightbulb} tone="emerald" title="What this isn&rsquo;t">
          Not another STT. Not a wrapper around Whisper. Chivox runs a
          dedicated pronunciation-scoring engine, trained on exam-grade
          reference audio and battle-tested as the backbone of national-scale
          Chinese English exams for over a decade. MCP is just the doorway.
        </Callout>

        <h3 id="architecture">Architecture</h3>
        <p>
          Chivox exposes <strong>two parallel front doors</strong> to the same
          scoring engine. Pick whichever matches your client runtime — the
          scoring result is byte-identical.
        </p>

        <div className="my-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/[0.04] p-5">
            <div className="flex items-center gap-2 mb-2 text-emerald-800 font-semibold text-[14px]">
              <Plug className="h-4 w-4" /> MCP mode · recommended
            </div>
            <ul className="text-[13px] leading-relaxed text-zinc-700 space-y-1.5 list-disc pl-4">
              <li>JSON-RPC 2.0 over Streamable HTTP or stdio</li>
              <li>
                <strong>Zero-code</strong> drop-in for any MCP-aware client —
                Cursor, Claude Desktop, Cline, LangChain, Mastra, Agents SDK.
              </li>
              <li>Tool list auto-injected; new tools require no client change.</li>
              <li>
                Optional local proxy <code>chivox-local-mcp</code> adds microphone
                streaming.
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border-2 border-sky-500/40 bg-sky-500/[0.04] p-5">
            <div className="flex items-center gap-2 mb-2 text-sky-800 font-semibold text-[14px]">
              <Network className="h-4 w-4" /> Function-calling mode · fallback
            </div>
            <ul className="text-[13px] leading-relaxed text-zinc-700 space-y-1.5 list-disc pl-4">
              <li>OpenAI-style REST + WebSocket (aka <code>cvx_fc</code>).</li>
              <li>
                <strong>No MCP SDK</strong> required — any HTTP/WS client works.
              </li>
              <li>
                Built-in <code>resume_token</code>, <code>intermediate</code>{' '}
                results, <code>backpressure</code> frames.
              </li>
              <li>
                Ships with iOS, Android, Flutter, mini-program, and legacy Java /
                PHP backends in mind.
              </li>
            </ul>
          </div>
        </div>

        <Callout icon={Lightbulb} tone="amber" title="Pick exactly one per session">
          The MCP <code>/ws/audio/&#123;sid&#125;</code> and function-calling{' '}
          <code>/ws/eval/&#123;sid&#125;</code> endpoints live in separate session
          namespaces — a <code>session_id</code> from one won&rsquo;t work on the
          other.
        </Callout>

        <h3 id="requirements">Requirements</h3>
        <p>Anything that speaks MCP over Streamable HTTP or stdio. If you only
          need file-based scoring (no live mic), you don&rsquo;t need a local
          proxy at all.</p>
        <ParamTable
          head={['Dependency', 'Version', 'Needed when']}
          rows={[
            ['Node.js', '≥ 18', 'Running chivox-local-mcp'],
            ['SoX', 'any', 'Streaming from a local microphone'],
            ['macOS / Linux / Windows', 'latest 2 LTS', 'Every tested platform'],
          ]}
        />
        <Code
          language="bash"
          filename="Install SoX (only for streaming capture)"
          code={`# macOS
brew install sox

# Ubuntu / Debian
sudo apt-get install sox

# Arch
sudo pacman -S sox`}
        />

        <h3 id="quickstart">Quickstart</h3>
        <p>60 seconds, zero audio-engineering knowledge.</p>

        <Step n={1} title="Wire up the server">
          <p>
            Zero-install path — any MCP-aware client can talk to our hosted
            endpoint over Streamable HTTP. Below is the Cursor config; others
            are covered under <a href="#clients">Clients</a>.
          </p>
          <Code
            language="json"
            filename="Cursor · Settings → MCP"
            code={`{
  "name": "chivox-speech-eval",
  "type": "streamable-http",
  "url": "${MCP_HTTP_URL}"
}`}
          />
          <p className="text-[13px] text-zinc-600">
            Need microphone streaming? Run the optional local proxy instead —
            see the <a href="#client-claude">Claude Desktop</a> setup.
          </p>
        </Step>

        <Step n={2} title="Call a scoring tool">
          <p>
            Your LLM now sees all 16 tools. Call one directly from an MCP-aware
            client:
          </p>
          <Code
            language="ts"
            filename="score.ts · raw MCP SDK"
            code={`import { McpClient } from '@modelcontextprotocol/sdk';

const mcp = new McpClient({ name: 'chivox' });
await mcp.connectHttp('${MCP_HTTP_URL}');

// Upload a file first, then evaluate by audioId:
const { audioId } = await fetch('${UPLOAD_URL}', {
  method: 'POST',
  body: wavBuffer,
  headers: { 'Content-Type': 'audio/wav' },
}).then(r => r.json());

const result = await mcp.callTool('en_sentence_eval', {
  audioId,
  ref_text: 'I think therefore I am',
});

console.log(result.overall);              // 85
console.log(result.details[0].phone);     // [{ phoneme: 'θ', score: 91 }, ...]`}
          />
        </Step>

        <Step n={3} title="Feed the JSON back to your LLM">
          <p>
            The payload is hand-shaped for LLM reasoning: short field names,
            flat arrays, bounded ranges. Your model can now generate{' '}
            <em>per-user</em> feedback, drills, and next-lesson plans without a
            second speech round-trip. See{' '}
            <a href="#secondary-analysis">Secondary analysis with LLM</a>.
          </p>
        </Step>

        <h3 id="authentication">Authentication</h3>
        <p>
          The hosted URL <code>{MCP_HTTP_URL}</code> is open for evaluation; for
          production traffic, every call is authenticated with an API key. The
          local proxy and framework integrations read them from environment
          variables.
        </p>
        <ParamTable
          rows={[
            [
              'MCP_REMOTE_URL',
              'string',
              'required',
              'Remote endpoint, usually ' + MCP_HTTP_URL + '.',
            ],
            [
              'MCP_API_KEY',
              'string',
              'optional',
              'Bearer token when your deployment enforces auth.',
            ],
            [
              'MCP_TIMEOUT_MS',
              'number',
              'default 30000',
              'Per-request timeout for the proxy to upstream.',
            ],
          ]}
        />
        <Callout icon={Lightbulb} tone="emerald" title="Key rotation">
          Keys can be rotated at any time from the{' '}
          <a href="https://mcp.cloud.chivox.com" target="_blank" rel="noreferrer">
            dashboard
          </a>
          . Expect a few seconds of propagation to the edge. Old keys continue
          to work for a 5-minute grace window.
        </Callout>
      </section>

      <hr />

      {/* ═════════ CLIENTS ═════════ */}
      <section id="clients">
        <Eyebrow>Clients</Eyebrow>

        <h2 id="client-cursor">Cursor</h2>
        <p>
          <strong>Settings → MCP → Add new MCP server</strong>. Cursor speaks
          Streamable HTTP directly — no binary to install.
        </p>
        <Code
          language="json"
          filename="~/.cursor/mcp.json"
          code={`{
  "name": "chivox-speech-eval",
  "type": "streamable-http",
  "url": "${MCP_HTTP_URL}"
}`}
        />
        <Callout icon={Lightbulb} tone="amber" title="No microphone over HTTP">
          Cursor&rsquo;s MCP transport doesn&rsquo;t expose mic capture. If you
          need live streaming assessment, wire up Claude Desktop with the local
          proxy instead.
        </Callout>

        <h3 id="client-claude">Claude Desktop</h3>
        <p>
          Claude Desktop talks to the local proxy over stdio, which in turn
          bridges to the hosted scoring engine — this path unlocks microphone
          streaming.
        </p>
        <Code
          language="bash"
          filename="Install the local proxy"
          code={`# Option A — global (recommended)
npm install -g chivox-local-mcp

# Option B — run via npx, no install
MCP_REMOTE_URL=${MCP_HTTP_URL} npx chivox-local-mcp`}
        />
        <Code
          language="json"
          filename="~/Library/Application Support/Claude/claude_desktop_config.json"
          code={`{
  "mcpServers": {
    "chivox": {
      "command": "chivox-local-mcp",
      "env": {
        "MCP_REMOTE_URL": "${MCP_HTTP_URL}",
        "MCP_API_KEY": "your-api-key"
      }
    }
  }
}`}
        />

        <h3 id="client-claude-code">Claude Code</h3>
        <p>One command — Claude Code will persist it under the user config.</p>
        <Code
          language="bash"
          filename="Claude Code CLI"
          code={`claude mcp add chivox -- \\
  env MCP_REMOTE_URL=${MCP_HTTP_URL} \\
  chivox-local-mcp`}
        />

        <h3 id="client-misc-ides">Windsurf · Zed · Continue · Cline</h3>
        <p>
          All four accept the same Streamable HTTP JSON as Cursor — only the
          settings file path differs.
        </p>
        <Code
          language="json"
          filename="mcp.json"
          code={`{
  "mcpServers": {
    "chivox-speech-eval": {
      "type": "streamable-http",
      "url": "${MCP_HTTP_URL}"
    }
  }
}`}
        />

        <h3 id="client-frameworks">LangChain · Mastra · OpenAI Agents SDK</h3>
        <p>
          Point any MCP-aware framework adapter at our hosted URL; the
          framework drives the tool loop (discovery → <code>tool_calls</code>{' '}
          → execution → follow-up messages). All three share the same{' '}
          <strong>16 tools</strong>.
        </p>
        <Code
          language="python"
          filename="LangGraph · langchain-mcp-adapters"
          code={`# pip install langchain-mcp-adapters langgraph
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent

client = MultiServerMCPClient({
    "chivox": {
        "transport": "streamable_http",
        "url": "${MCP_HTTP_URL}",
    }
})
tools = await client.get_tools()

agent = create_react_agent("openai:gpt-4o-mini", tools)
result = await agent.ainvoke({"messages":
    [("user", "Score audioId=abc123, ref: I think therefore I am")]})
print(result["messages"][-1].content)`}
        />
        <Code
          language="typescript"
          filename="Mastra"
          code={`import { MCPClient } from '@mastra/mcp';
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';

const mcp = new MCPClient({
  servers: {
    chivox: { url: new URL('${MCP_HTTP_URL}') },
  },
});

export const coach = new Agent({
  name: 'speech-coach',
  instructions: 'Use Chivox tools to score speech and give feedback.',
  model: openai('gpt-4o-mini'),
  tools: await mcp.getTools(),
});`}
        />
        <Code
          language="python"
          filename="OpenAI Agents SDK"
          code={`# pip install openai-agents
from agents import Agent, Runner
from agents.mcp import MCPServerStreamableHttp

chivox = MCPServerStreamableHttp(
    params={"url": "${MCP_HTTP_URL}"},
    name="chivox-speech-eval",
)

async with chivox:
    agent = Agent(
        name="coach",
        instructions="Professional speaking coach",
        mcp_servers=[chivox],
    )
    r = await Runner.run(agent, "Score audioId=abc123")
    print(r.final_output)`}
        />
        <p className="text-[13px] text-zinc-600">
          LlamaIndex, AutoGen, CrewAI, and Spring AI ship similar bridges —
          same URL, same 16 tools.
        </p>
      </section>

      <hr />

      {/* ═════════ CORE CONCEPTS ═════════ */}
      <section id="concepts">
        <Eyebrow>Core concepts</Eyebrow>

        <h2 id="what-you-get">What the engine returns</h2>
        <p>
          Every scoring tool returns the same top-level shape, regardless of
          locale or task. The header block is three numbers you can ship
          straight to a UI; <code>details[]</code> is where the
          phoneme-level reasoning fuel lives.
        </p>
        <Code
          language="json"
          filename="result.json · shape at a glance"
          code={`{
  "overall":   85,
  "accuracy":  82,
  "pron":      88,
  "fluency":   { "overall": 78, "speed": 65, "pause": 2 },
  "integrity": 95,
  "details": [
    {
      "char":  "hello",
      "score": 85,
      "phone": [
        { "phoneme": "h",  "score": 90, "dp_type": "normal"  },
        { "phoneme": "ɛ",  "score": 82, "dp_type": "normal"  },
        { "phoneme": "l",  "score": 88, "dp_type": "normal"  },
        { "phoneme": "oʊ", "score": 80, "dp_type": "normal"  }
      ]
    }
  ]
}`}
        />
        <p>
          See the complete list of fields and their valid ranges under{' '}
          <a href="#response-schema">API reference → Response fields</a>.
        </p>

        <h3 id="mandarin-scoring">Mandarin tonal scoring</h3>
        <p>
          Most open-source STT collapses on tone. Chivox runs a dedicated F₀
          contour evaluator that understands{' '}
          <strong>four lexical tones + neutral + sandhi</strong>. Each syllable
          gets a <code>tone_ref</code> (expected) and <code>tone_detected</code>{' '}
          (produced), plus a score.
        </p>
        <p>
          The engine knows the common sandhi rules — e.g.{' '}
          <code>T3 + T3 → T2 + T3</code> — so &ldquo;你好&rdquo; pronounced as
          (T2, T3) is marked <code>normal</code>, not mis-pronounced, even
          though the surface tone differs from the dictionary form.
        </p>
        <Callout icon={Waves} tone="emerald" title="Why this matters for agents">
          Sandhi-aware verdicts mean your LLM never has to second-guess a
          legitimate surface change. If <code>dp_type</code> says{' '}
          <code>normal</code>, it&rsquo;s correct, full stop — no &ldquo;well
          actually&rdquo; templates required.
        </Callout>

        <h3 id="english-scoring">English phoneme scoring</h3>
        <p>
          Every word is broken down into IPA phonemes, each with a score and a{' '}
          <code>dp_type</code> of <code>normal</code>, <code>mispron</code>, or{' '}
          <code>missing</code>. The engine also returns a best-guess
          &ldquo;what the user actually said instead&rdquo; via{' '}
          <code>phoneme_error</code> — invaluable for drilling.
        </p>
        <Callout icon={Waves} tone="emerald" title="Actually useful example">
          A user reading &ldquo;think&rdquo; as /sɪŋk/ comes back as{' '}
          <code>{`{ expected: "/θ/", actual: "/s/" }`}</code>. Your LLM can
          generate a <em>targeted</em> tongue-twister on the spot — no
          second round-trip to the scorer.
        </Callout>

        <h3 id="eval-modes">Streaming vs file evaluation</h3>
        <p>
          Two evaluation modes cover every UX you are likely to build. Both
          return the same result shape; they differ only in how audio gets in.
        </p>
        <div className="my-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-300/60 bg-white/60 p-4">
            <div className="flex items-center gap-2 mb-2 text-[13px] font-semibold">
              <Mic className="h-4 w-4 text-emerald-700" /> Streaming microphone
            </div>
            <p className="text-[13px] text-zinc-700 leading-relaxed">
              Audio flows over WebSocket while the user speaks. No intermediate
              file, lowest latency — ideal for live tutoring UX. Supports
              interrupts, reconnects via <code>resume_token</code>, and
              intermediate frames while the user is still talking.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-300/60 bg-white/60 p-4">
            <div className="flex items-center gap-2 mb-2 text-[13px] font-semibold">
              <Terminal className="h-4 w-4 text-emerald-700" /> File upload
            </div>
            <p className="text-[13px] text-zinc-700 leading-relaxed">
              POST a clip to <code>{UPLOAD_URL}</code> (local path, Base64, or
              URL), get an <code>audioId</code> back, then call any scoring
              tool with it. Perfect for batch jobs and async pipelines.
            </p>
          </div>
        </div>
      </section>

      <hr />

      {/* ═════════ GUIDES ═════════ */}
      <section id="guides">
        <Eyebrow>Guides</Eyebrow>

        <h2 id="ai-tutor">Build an AI pronunciation tutor</h2>
        <p>
          The canonical recipe: <strong>score → reason → drill → repeat</strong>.
          Chivox handles step 1; your LLM handles 2 and 3; step 4 just loops.
        </p>
        <ol>
          <li>
            <strong>Score.</strong> Record the user, call one of the{' '}
            <a href="#tools-en">English</a> or{' '}
            <a href="#tools-cn">Mandarin</a> tools with the reference text.
          </li>
          <li>
            <strong>Reason.</strong> Hand the raw JSON to your LLM with a
            persona prompt (see <a href="#prompts">Prompt templates</a>).
          </li>
          <li>
            <strong>Drill.</strong> The LLM returns a short tongue-twister or a
            minimal-pair list. TTS it back to the user.
          </li>
          <li>
            <strong>Repeat.</strong> Score the drill, show progress vs.
            baseline, persist deltas into the student profile.
          </li>
        </ol>
        <Callout icon={Zap} tone="emerald" title="Want to see it live?">
          The full loop is implemented on the{' '}
          <Link href="/demo">interactive demo</Link> — crack open the
          devtools network tab, every call is unredacted.
        </Callout>

        <h3 id="secondary-analysis">Secondary analysis with LLM</h3>
        <p>
          The payload is designed to be <em>reasoning fuel</em>, not a terminal
          score. Give your agent this prompt scaffold and it will outperform
          any hard-coded feedback template:
        </p>
        <Code
          language="markdown"
          filename="prompt.md"
          code={`You receive a Chivox scoring payload.

1. Group mispronounced phonemes by type
   (voiceless fricatives, rhotics, tones, etc.).
2. Pick the single most costly pattern
   (biggest total score loss across all words).
3. Generate ONE minimal-pair drill that targets exactly that pattern.
4. Output JSON:
   {
     "diagnosis": "<= 40 words",
     "drill":     ["word1", "word2", ...],
     "next_step": "read the drill three times, then retry the sentence"
   }

Respond in the user's locale.`}
        />

        <h3 id="long-term">Long-term student profiling</h3>
        <p>
          Persist <code>details[*].phone</code> across sessions and you have
          everything you need for a longitudinal profile. Common derived
          signals:
        </p>
        <ul>
          <li>
            <strong>Pattern-over-time:</strong> rolling rate of{' '}
            <code>dp_type === &quot;mispron&quot;</code> per phoneme.
          </li>
          <li>
            <strong>Progress curve:</strong> 7-day moving average of{' '}
            <code>overall</code> on a fixed reference set.
          </li>
          <li>
            <strong>Spaced-repetition triggers:</strong> promote a phoneme out
            of drills after N consecutive <code>normal</code> passes.
          </li>
          <li>
            <strong>Tonal stability:</strong> Mandarin only —{' '}
            <code>tone_detected</code> variance over the last 20 utterances.
          </li>
        </ul>

        <h3 id="prompts">Prompt templates</h3>
        <p>
          Mount these as the <code>system</code> message and pass the tool JSON
          in the <code>user</code> turn. They mirror the same five-part shape
          used by our hosted demo: <em>persona / task / method / output format
          / tone</em>.
        </p>
        <Code
          language="markdown"
          filename="system · pronunciation coach (English)"
          code={`You are a warm, experienced pronunciation coach.

Given a JSON scoring payload from Chivox:
- Highlight up to 3 phoneme-level issues, using IPA.
- For each, show what the learner said vs. what they should say,
  and a one-sentence articulation cue (e.g. "touch your tongue tip
  to the alveolar ridge for /t/").
- End with one sentence of encouragement.

Keep responses under 90 words. Do not repeat the raw scores verbatim.`}
        />
        <Code
          language="markdown"
          filename="system · Mandarin tone coach"
          code={`你是一位耐心的普通话口语老师。

给定一段 Chivox 打分 JSON：
- 只关注 tone_detected 与 tone_ref 不一致的音节。
- 提供"实际听到" vs "正确声调"，附 1 句发音提示
  （例如："第三声要先降后升"）。
- 若触发变调规则 (T3+T3 → T2+T3) 已由 dp_type=normal 覆盖，
  则不要提该音节。

用简体中文回答，不超过 80 字。`}
        />
      </section>

      <hr />

      {/* ═════════ REFERENCE ═════════ */}
      <section id="reference">
        <Eyebrow>API reference</Eyebrow>

        <h2 id="tools-en">English tools · 10</h2>
        <p>
          Call any of these by name via MCP <code>tools/call</code> or via
          function-calling. Each returns the standard result shape (see{' '}
          <a href="#response-schema">Response fields</a>).
        </p>
        <ParamTable
          head={['Tool name', 'Task', 'Notes']}
          rows={TOOLS_EN}
        />

        <h3 id="tools-cn">Mandarin tools · 6</h3>
        <p>
          Mandarin-specific tools. All six honour sandhi rules and the neutral
          tone; <code>cn_aitalk_eval</code> additionally scores topic adherence
          and coherence for open-ended answers.
        </p>
        <ParamTable
          head={['Tool name', 'Task', 'Notes']}
          rows={TOOLS_CN}
        />

        <h3 id="response-schema">Response fields</h3>
        <p>
          The schema is stable across v1.x. Unknown future fields will be
          additive and documented in the <a href="#changelog">Changelog</a>.
        </p>
        <ParamTable
          head={['Field', 'Type', 'Notes']}
          rows={[
            ['overall', 'number · 0–100', 'Weighted roll-up. Safe for UI.'],
            ['accuracy', 'number · 0–100', 'Phoneme / syllable correctness.'],
            ['pron', 'number · 0–100', 'Articulation quality.'],
            ['integrity', 'number · 0–100', 'Did the user read every word?'],
            ['fluency.overall', 'number · 0–100', 'Pauses + speed + hesitations.'],
            ['fluency.speed', 'number', 'Syllables or words per minute.'],
            ['fluency.pause', 'number', 'Count of unexpected pauses.'],
            [
              'details[i].phone[j].dp_type',
              '"normal" · "mispron" · "missing"',
              'Per-phoneme verdict.',
            ],
            [
              'details[i].phone[j].phoneme_error',
              '{ expected, actual }',
              'Only present on English mispron. Ideal for drills.',
            ],
            [
              'details[i].tone_ref · tone_detected',
              '1–5 · neutral',
              'Mandarin only.',
            ],
          ]}
        />

        <h3 id="error-codes">Error codes</h3>
        <p className="font-semibold text-[14px] mt-4 mb-2">HTTP status codes</p>
        <ParamTable
          head={['Status', 'Meaning']}
          rows={[
            ['400', 'Malformed request (missing fields / wrong types).'],
            ['401', 'Unauthenticated — missing Authorization header.'],
            ['403', 'Forbidden — invalid key or no permission for the requested tool.'],
            ['404', 'Session not found (wrong / reaped session_id).'],
            ['409', 'Invalid state (e.g. audio sent after stop).'],
          ]}
        />
        <p className="font-semibold text-[14px] mt-6 mb-2">
          Structured streaming error codes
        </p>
        <p className="text-[13px] text-zinc-600 mb-3">
          WebSocket <code>error</code> frames and the error payload of{' '}
          <code>get_stream_result</code> share the same code set — dispatch
          client-side handling off these:
        </p>
        <ParamTable
          head={['Code', 'Meaning', 'Suggested action']}
          rows={[
            ['SESSION_NOT_FOUND', 'Session does not exist', 'Recreate with start_stream_eval / create_stream_session'],
            ['SESSION_EXPIRED', 'Session expired (idle > 60s)', 'Recreate session'],
            ['INVALID_STATE', 'Operation not allowed in current state', 'Check call order (audio after stop, etc.)'],
            ['INVALID_PARAMS', 'Invalid parameters', 'Check core_type / ref_text / sample rate'],
            ['RESUME_INVALID', 'resume_token invalid or expired', 'Recreate session — each resume issues a fresh token'],
            ['AUDIO_TOO_LARGE', 'Audio payload exceeds 50MB', 'Compress or segment before retry'],
            ['UPSTREAM_CONNECT', 'Scoring engine unreachable', 'Retry with backoff; contact Chivox if persistent'],
            ['UPSTREAM_TIMEOUT', 'Scoring engine timed out', 'Shorten audio / check network'],
            ['UPSTREAM_EVAL_ERROR', 'Scoring engine returned an error', 'Inspect the message field'],
            ['CAPACITY_FULL', 'Concurrent session quota exceeded', 'Back off and retry, or upgrade quota'],
          ]}
        />
      </section>

      <hr />

      {/* ═════════ OPERATIONS ═════════ */}
      <section id="operations">
        <Eyebrow>Operations</Eyebrow>

        <h2 id="endpoints">Endpoints</h2>
        <p>
          All hosted under <code>mcp.cloud.chivox.com</code>. MCP and
          function-calling (<code>cvx_fc</code>) coexist — pick one per
          session, not per request.
        </p>
        <ParamTable
          head={['Path', 'Method', 'Purpose']}
          rows={[
            ['/upload', 'POST', 'Audio upload (returns audioId for file evaluation).'],
            ['/mcp', 'POST', 'MCP mode · JSON-RPC over Streamable HTTP.'],
            ['/ws/audio/{session_id}', 'WS', 'MCP mode · streaming audio WebSocket.'],
            ['/v1/functions', 'GET', 'Function-calling · list all scoring functions.'],
            ['/v1/call', 'POST', 'Function-calling · one-shot eval / create stream session / fetch result.'],
            ['/ws/eval/{session_id}', 'WS', 'Function-calling · streaming audio WebSocket.'],
            ['/health', 'GET', 'Health check (no auth, safe for probes).'],
          ]}
        />

        <h3 id="limits">Limits</h3>
        <p>
          These defaults describe <strong>technical</strong> guardrails on the
          hosted endpoint. Billing quotas (trial credits, concurrency tiers,
          call volume) are a separate dimension documented on the{' '}
          <a href="https://mcp.cloud.chivox.com" target="_blank" rel="noreferrer">
            dashboard
          </a>
          .
        </p>
        <ParamTable
          head={['Item', 'Default', 'Notes']}
          rows={[
            ['Scratch storage', '500 MB', 'Temporary audio cache.'],
            ['Queue depth', '10', 'Pending scoring jobs per key.'],
            ['Concurrency', '3', 'Parallel scoring workers.'],
            ['Audio TTL', '5 min', 'Expires if not scored.'],
            ['Max upload', '50 MB', 'Per file.'],
            ['Streaming idle', '60 s', 'Session drops after 60 s without audio.'],
          ]}
        />

        <h3 id="privacy">Privacy &amp; data handling</h3>
        <p>
          Audio is <strong>processed, scored, and dropped</strong>. We retain
          the resulting JSON for 30 days (for debugging and your own dashboard)
          and nothing else. Customers on enterprise plans can provision a
          region-locked tenant (US · EU · SG).
        </p>
        <ul>
          <li>No audio is ever used for model training.</li>
          <li>TLS 1.3 on every hop. Keys are hashed at rest.</li>
          <li>
            GDPR &amp; CCPA DSRs honoured within 10 business days — email{' '}
            <a href="mailto:privacy@chivox.com">privacy@chivox.com</a>.
          </li>
        </ul>

        <h3 id="faq">FAQ</h3>
        <FaqItem q="Is this just another wrapper around Whisper?">
          No. Whisper transcribes; Chivox scores. The engine is trained on
          tens of millions of exam-graded samples and has been the evaluation
          backbone for national-scale Chinese English exams for over a decade.
        </FaqItem>
        <FaqItem q="Does it work offline / on-device?">
          The MCP server needs an outbound call to our scoring engine. For
          air-gapped use, talk to us — we ship an on-prem container for
          enterprise customers.
        </FaqItem>
        <FaqItem q="What about dialects?">
          Mandarin scoring targets standard Pǔtōnghuà. English supports
          en-US, en-GB, and en-AU rubrics; select via locale parameters on the
          relevant tools.
        </FaqItem>
        <FaqItem q="Can I use this in a browser?">
          For quick demos, yes — but hosted traffic should always flow through
          a trusted backend so your API key isn&rsquo;t exposed. The browser
          can upload to your backend, which forwards to <code>/upload</code>.
        </FaqItem>
        <FaqItem q="Which LLMs are known to work out of the box?">
          Any model that supports OpenAI-style function calling: GPT-4o / 5.x,
          Claude Sonnet / Opus, Gemini, DeepSeek, GLM, Kimi, Doubao, Qwen.
          Tool schemas are forwarded verbatim — no per-vendor adapters needed.
        </FaqItem>

        <h3 id="changelog">Changelog</h3>
        <Callout icon={Lightbulb} tone="amber" title="Pre-launch">
          The service is in invite-only access and ships from local builds —
          there is no public version cadence yet. Once we cut a public release,
          versioned entries will land here.
        </Callout>
        <ul>
          <li>
            <strong>v1.0</strong> — Current build. Includes the full 16-tool
            surface (Mandarin sandhi-aware tone verdicts,{' '}
            <code>phoneme_error.actual</code> for English mispronunciations,{' '}
            <code>cn_aitalk_eval</code> with a <code>coherence</code> field for
            open-ended tasks). Distributed to design partners on request.
          </li>
        </ul>
      </section>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────
 *  Content primitives
 * ──────────────────────────────────────────────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-mono tracking-[0.22em] uppercase text-emerald-700 mb-3">
      /{String(children).toLowerCase().replace(/\s+/g, '-')}
    </div>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6 mb-6 relative pl-10">
      <span className="absolute left-0 top-0 inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-white font-mono text-[12px] font-semibold">
        {n}
      </span>
      <div className="text-[16px] font-semibold text-zinc-900 mb-2">{title}</div>
      {children}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────
 * Tiny, dependency-free syntax highlighter.
 *
 * Not a real parser — a single-pass regex tokenizer tuned for the
 * languages that actually appear in these docs (json, ts, python,
 * bash, markdown). Output is a flat array of <span>s with a refined
 * dark palette tuned to the site's emerald/cream identity.
 * ─────────────────────────────────────────────────────────── */

const HL = {
  comment: '#6b7a8c',
  string: '#9ee6c1',
  number: '#f5b97a',
  keyword: '#f495b5',
  bool: '#c8a2ff',
  key: '#ffd28a',
  punct: '#7d8896',
  func: '#7cc4ff',
  type: '#7cc4ff',
  heading: '#f4d27a',
} as const;

const KEYWORDS: Record<string, RegExp> = {
  ts: /\b(?:import|from|export|const|let|var|function|return|if|else|for|while|await|async|new|class|interface|type|extends|implements|public|private|protected|readonly|as|of|in|true|false|null|undefined|void|throw|try|catch|finally)\b/,
  typescript:
    /\b(?:import|from|export|const|let|var|function|return|if|else|for|while|await|async|new|class|interface|type|extends|implements|public|private|protected|readonly|as|of|in|true|false|null|undefined|void|throw|try|catch|finally)\b/,
  python:
    /\b(?:import|from|as|def|return|if|elif|else|for|while|in|not|and|or|is|None|True|False|class|with|try|except|finally|raise|pass|lambda|yield|async|await|self)\b/,
  bash: /\b(?:if|then|fi|else|elif|for|do|done|while|case|esac|function|return|export|local|in)\b/,
};

interface Tok {
  t: keyof typeof HL | 'plain';
  v: string;
}

function tokenize(code: string, lang: string): Tok[] {
  const out: Tok[] = [];
  const push = (t: Tok['t'], v: string) => {
    if (v) out.push({ t, v });
  };

  const l = lang.toLowerCase();
  const isJson = l === 'json';
  const isMd = l === 'markdown' || l === 'md';
  const kwRe = KEYWORDS[l];

  let i = 0;
  const n = code.length;

  // Markdown: line-oriented, very light touch.
  if (isMd) {
    const lines = code.split('\n');
    lines.forEach((line, idx) => {
      if (/^\s*#{1,6}\s/.test(line)) {
        push('heading', line);
      } else if (/^\s*[-*+]\s/.test(line)) {
        const m = line.match(/^(\s*[-*+]\s)(.*)$/)!;
        push('punct', m[1]);
        push('plain', m[2]);
      } else {
        // inline code
        let rest = line;
        const re = /`([^`]+)`/g;
        let last = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(rest))) {
          push('plain', rest.slice(last, m.index));
          push('string', m[0]);
          last = m.index + m[0].length;
        }
        push('plain', rest.slice(last));
      }
      if (idx < lines.length - 1) push('plain', '\n');
    });
    return out;
  }

  while (i < n) {
    const ch = code[i];
    const two = code.slice(i, i + 2);

    // Line comments (// or # — # also catches bash; in JSON it never appears).
    if (!isJson && (two === '//' || (ch === '#' && (l === 'python' || l === 'bash')))) {
      const end = code.indexOf('\n', i);
      const stop = end === -1 ? n : end;
      push('comment', code.slice(i, stop));
      i = stop;
      continue;
    }

    // Block comments /* … */
    if (!isJson && two === '/*') {
      const end = code.indexOf('*/', i + 2);
      const stop = end === -1 ? n : end + 2;
      push('comment', code.slice(i, stop));
      i = stop;
      continue;
    }

    // Strings: ", ', `
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      let j = i + 1;
      while (j < n) {
        if (code[j] === '\\') { j += 2; continue; }
        if (code[j] === quote) { j++; break; }
        j++;
      }
      const raw = code.slice(i, j);
      // JSON object key heuristic: "..." followed by optional ws + ':'
      if (isJson && quote === '"') {
        let k = j;
        while (k < n && (code[k] === ' ' || code[k] === '\t')) k++;
        if (code[k] === ':') {
          push('key', raw);
          i = j;
          continue;
        }
      }
      push('string', raw);
      i = j;
      continue;
    }

    // Numbers
    if (/[0-9]/.test(ch) || (ch === '-' && /[0-9]/.test(code[i + 1] || ''))) {
      let j = i + 1;
      while (j < n && /[0-9._eE+-]/.test(code[j])) j++;
      push('number', code.slice(i, j));
      i = j;
      continue;
    }

    // Identifiers / keywords
    if (/[A-Za-z_$]/.test(ch)) {
      let j = i + 1;
      while (j < n && /[A-Za-z0-9_$]/.test(code[j])) j++;
      const word = code.slice(i, j);
      if (isJson && (word === 'true' || word === 'false' || word === 'null')) {
        push('bool', word);
      } else if (kwRe && kwRe.test(word)) {
        if (word === 'true' || word === 'false' || word === 'None' || word === 'null') {
          push('bool', word);
        } else {
          push('keyword', word);
        }
      } else if (code[j] === '(' && !isJson) {
        push('func', word);
      } else {
        push('plain', word);
      }
      i = j;
      continue;
    }

    // Punctuation
    if (/[{}\[\]():;,.<>+\-*/%=!?&|^~]/.test(ch)) {
      push('punct', ch);
      i++;
      continue;
    }

    push('plain', ch);
    i++;
  }

  return out;
}

function highlight(code: string, language: string) {
  const toks = tokenize(code, language);
  return toks.map((tk, idx) => {
    if (tk.t === 'plain') return <span key={idx}>{tk.v}</span>;
    return (
      <span key={idx} style={{ color: HL[tk.t] }}>
        {tk.v}
      </span>
    );
  });
}

function Code({
  language,
  filename,
  code,
}: {
  language: string;
  filename?: string;
  code: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="docs-code my-5 rounded-2xl overflow-hidden border border-white/[0.06] bg-[linear-gradient(180deg,#10141b_0%,#0c1015_100%)] shadow-[0_24px_60px_-28px_rgba(8,12,18,0.65),0_0_0_1px_rgba(255,255,255,0.02)_inset]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-[radial-gradient(120%_120%_at_0%_0%,rgba(16,185,129,0.06),transparent_60%)]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex gap-1.5 mr-1" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/70" />
          </span>
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-300/90">
            {language}
          </span>
          {filename && (
            <>
              <span className="text-zinc-600">·</span>
              <span className="text-[11.5px] font-mono text-zinc-400 truncate">
                {filename}
              </span>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-mono text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05] transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" /> copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3.5 text-[12.5px] leading-[1.65]">
        <code className="font-mono text-[#d6dae0]">
          {highlight(code, language)}
        </code>
      </pre>
    </div>
  );
}

function Callout({
  icon: Icon,
  tone = 'emerald',
  title,
  children,
}: {
  icon: React.ElementType;
  tone?: 'emerald' | 'amber';
  title: string;
  children: React.ReactNode;
}) {
  const toneMap = {
    emerald: {
      border: 'border-emerald-500/30',
      ring: 'bg-emerald-500/12 text-emerald-700',
      title: 'text-emerald-800',
    },
    amber: {
      border: 'border-amber-500/35',
      ring: 'bg-amber-500/15 text-amber-700',
      title: 'text-amber-800',
    },
  }[tone];
  return (
    <div
      className={cn(
        'my-6 rounded-2xl border bg-white/55 backdrop-blur-sm p-4 flex gap-3',
        toneMap.border,
      )}
    >
      <span
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-lg shrink-0',
          toneMap.ring,
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className={cn('text-[13px] font-semibold mb-1', toneMap.title)}>
          {title}
        </div>
        <div className="text-[14px] text-zinc-700 leading-relaxed [&_code]:bg-zinc-900/[0.06] [&_code]:text-zinc-800">
          {children}
        </div>
      </div>
    </div>
  );
}

function ParamTable({
  head = ['Parameter', 'Type', 'Required', 'Notes'],
  rows,
}: {
  head?: string[];
  rows: (string | React.ReactNode)[][];
}) {
  return (
    <div className="my-5 overflow-x-auto rounded-xl border border-zinc-900/[0.08] bg-white/55 backdrop-blur-sm">
      <table className="w-full text-[13px]">
        <thead className="bg-zinc-900/[0.03]">
          <tr>
            {head.map((h) => (
              <th
                key={h}
                className="text-left py-2.5 px-3 font-semibold text-zinc-700 text-[12px] uppercase tracking-[0.08em]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-900/[0.06]">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-emerald-500/[0.04] transition-colors">
              {r.map((cell, j) => (
                <td key={j} className="py-2.5 px-3 align-top">
                  {j === 0 ? (
                    <code className="font-mono text-[12.5px] bg-emerald-500/10 text-emerald-800 px-1.5 py-0.5 rounded">
                      {cell}
                    </code>
                  ) : (
                    <span className="text-zinc-700">{cell}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Table(props: { head: string[]; rows: string[][] }) {
  return <ParamTable head={props.head} rows={props.rows} />;
}

function FaqItem({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="my-3 rounded-xl border border-zinc-900/[0.08] bg-white/55 backdrop-blur-sm group">
      <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-3 text-[14px] font-semibold text-zinc-800 hover:bg-emerald-500/[0.04] rounded-xl">
        <span>{q}</span>
        <span className="text-emerald-700 group-open:rotate-45 transition-transform">
          +
        </span>
      </summary>
      <div className="px-4 pb-4 text-[14px] text-zinc-600 leading-relaxed [&_code]:bg-zinc-900/[0.06] [&_code]:text-zinc-800">
        {children}
      </div>
    </details>
  );
}

/* ────────────────────────────────────────────────────────────────
 *  Next / Previous
 * ──────────────────────────────────────────────────────────────── */

function NextPrev({
  activeId,
  onPick,
}: {
  activeId: string;
  onPick: (id: string) => void;
}) {
  const flat = useMemo(() => DOC_NAV.flatMap((g) => g.children), []);
  const i = flat.findIndex((c) => c.id === activeId);
  const prev = i > 0 ? flat[i - 1] : null;
  const next = i >= 0 && i < flat.length - 1 ? flat[i + 1] : null;

  return (
    <div className="mt-16 grid gap-3 sm:grid-cols-2">
      {prev ? (
        <a
          href={`#${prev.id}`}
          onClick={() => onPick(prev.id)}
          className="group rounded-2xl border border-zinc-900/[0.08] bg-white/55 backdrop-blur-sm p-4 hover:border-emerald-500/40 transition-colors"
        >
          <div className="text-[11px] font-mono tracking-[0.16em] uppercase text-zinc-500 mb-1 flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Previous
          </div>
          <div className="text-[14px] font-semibold text-zinc-900 group-hover:text-emerald-800 transition-colors">
            {prev.label}
          </div>
        </a>
      ) : (
        <div />
      )}
      {next ? (
        <a
          href={`#${next.id}`}
          onClick={() => onPick(next.id)}
          className="group rounded-2xl border border-zinc-900/[0.08] bg-white/55 backdrop-blur-sm p-4 hover:border-emerald-500/40 transition-colors text-right"
        >
          <div className="text-[11px] font-mono tracking-[0.16em] uppercase text-zinc-500 mb-1 flex items-center gap-1 justify-end">
            Next <ArrowRight className="h-3 w-3" />
          </div>
          <div className="text-[14px] font-semibold text-zinc-900 group-hover:text-emerald-800 transition-colors">
            {next.label}
          </div>
        </a>
      ) : (
        <div />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
 *  Footer
 * ──────────────────────────────────────────────────────────────── */

function DocsFooter() {
  return (
    <footer
      className="relative border-t"
      style={{
        borderColor: 'rgba(16,185,129,0.22)',
        background:
          'linear-gradient(to bottom right, rgba(16,185,129,0.10) 0%, rgba(245,158,11,0.06) 55%, rgba(255,255,255,0.35) 100%)',
      }}
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <ChivoxMcpBrand onWarm />
        <div className="flex items-center gap-5 text-[13px] text-zinc-600">
          <Link href="/" className="hover:text-zinc-900 transition-colors">
            Home
          </Link>
          <Link href="/demo" className="hover:text-zinc-900 transition-colors">
            Live demo
          </Link>
          <a
            href="mailto:sales@chivox.com"
            className="hover:text-zinc-900 transition-colors"
          >
            sales@chivox.com
          </a>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-zinc-900 transition-colors"
          >
            GitHub <ArrowUpRight className="h-3 w-3 opacity-60" />
          </a>
        </div>
      </div>
    </footer>
  );
}

/* ────────────────────────────────────────────────────────────────
 *  Ambient backdrop (light halos on cream — same as /global)
 * ──────────────────────────────────────────────────────────────── */

function AmbientBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full opacity-60"
        style={{
          background:
            'radial-gradient(circle, rgba(16,185,129,0.22), transparent 65%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full opacity-55"
        style={{
          background:
            'radial-gradient(circle, rgba(251,191,36,0.22), transparent 65%)',
          filter: 'blur(50px)',
        }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-[540px] w-[540px] rounded-full opacity-40"
        style={{
          background:
            'radial-gradient(circle, rgba(244,114,182,0.15), transparent 65%)',
          filter: 'blur(50px)',
        }}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
 *  Brand (copy of /global)
 * ──────────────────────────────────────────────────────────────── */

function ChivoxMcpBrand({
  className,
  onWarm = false,
}: {
  className?: string;
  onWarm?: boolean;
}) {
  return (
    <span className={cn('flex items-center gap-2.5 shrink-0', className)}>
      <span className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-zinc-900 to-zinc-800 flex items-center justify-center shadow-sm ring-1 ring-zinc-900/10">
        <AudioWaveform className="h-[18px] w-[18px] text-[#fbf6e9]" strokeWidth={2.3} />
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2',
            onWarm ? 'ring-[#fbf6e9]' : 'ring-background',
          )}
        />
      </span>
      <span className="font-bold tracking-[-0.02em] text-lg leading-none flex items-baseline gap-1">
        <span className={onWarm ? 'text-zinc-900' : 'text-foreground'}>Chivox</span>
        <span className="bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 bg-clip-text text-transparent">
          MCP
        </span>
      </span>
    </span>
  );
}
