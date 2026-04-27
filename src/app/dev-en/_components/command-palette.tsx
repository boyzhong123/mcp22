'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CreditCard,
  DollarSign,
  HelpCircle,
  History,
  Key,
  LayoutDashboard,
  LogOut,
  Plus,
  Receipt,
  Search,
  Settings,
  Sun,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMockAuth } from '../_lib/mock-auth';
import {
  getStarterKey,
  keyLast4,
  listPaidKeys,
  type ApiKey,
} from '../_lib/mock-store';
import { useMockStore } from '../_lib/use-mock-store';
import { useLang } from '../_lib/use-lang';
import { closePalette, openPalette, togglePalette } from '../_lib/ui-store';
import { useUi } from '../_lib/use-ui-store';
import { StripeCheckoutModal } from './stripe-checkout-modal';

type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string;
  run: () => void;
  section: 'Navigation' | 'Actions' | 'Keys' | 'Account';
};

const SECTION_ORDER: CommandItem['section'][] = ['Navigation', 'Actions', 'Keys', 'Account'];

const SECTION_ZH: Record<CommandItem['section'], string> = {
  Navigation: '导航',
  Actions: '操作',
  Keys: 'API 密钥',
  Account: '账号',
};

/**
 * Global command palette (⌘K). Mirrors Linear / Raycast / Vercel patterns:
 *   - Static navigation commands always present
 *   - Dynamic: every paid API key is searchable by name or last4
 *   - Quick actions: add credits, create paid key, log out, toggle theme
 *
 * Keyboard: ⌘K toggles, ↑/↓ navigates, Enter fires, Esc closes.
 */
export function DevEnCommandPalette() {
  const router = useRouter();
  const { t, tx } = useLang();
  const { logout } = useMockAuth();
  const open = useUi((s) => s.paletteOpen);
  const paidKeys = useMockStore(listPaidKeys, [] as ApiKey[]);
  const starter = useMockStore(() => getStarterKey() ?? null, null);

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const [addCreditsOpen, setAddCreditsOpen] = useState(false);
  const [addCreditsKeyId, setAddCreditsKeyId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const go = (href: string) => {
    closePalette();
    router.push(href);
  };

  const openAddCredits = (kid?: string) => {
    closePalette();
    setAddCreditsKeyId(kid ?? null);
    setAddCreditsOpen(true);
  };

  const toggleTheme = () => {
    const next =
      document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('dev-en:theme', next);
    }
    closePalette();
  };

  // Build the full command list from current store state.
  const items: CommandItem[] = useMemo(() => {
    const navItems: CommandItem[] = [
      {
        id: 'nav:overview',
        section: 'Navigation',
        label: t('Go to Overview', '前往 概览'),
        icon: LayoutDashboard,
        keywords: 'home dashboard',
        run: () => go('/dashboard/overview'),
      },
      {
        id: 'nav:keys',
        section: 'Navigation',
        label: t('Go to API Keys', '前往 API 密钥'),
        icon: Key,
        keywords: 'api keys secret',
        run: () => go('/dashboard/keys'),
      },
      {
        id: 'nav:usage',
        section: 'Navigation',
        label: t('Go to Usage', '前往 用量'),
        icon: BarChart3,
        keywords: 'calls volume analytics',
        run: () => go('/dashboard/usage'),
      },
      {
        id: 'nav:billing',
        section: 'Navigation',
        label: t('Go to Billing', '前往 账单'),
        icon: Receipt,
        keywords: 'balance spend credits',
        run: () => go('/dashboard/billing'),
      },
      {
        id: 'nav:billing-history',
        section: 'Navigation',
        label: t('Go to Billing · History', '前往 账单 · 充值记录'),
        icon: History,
        keywords: 'topup receipts invoices',
        run: () => go('/dashboard/billing/history'),
      },
      {
        id: 'nav:billing-rates',
        section: 'Navigation',
        label: t('Go to Billing · Rates', '前往 账单 · 费率'),
        icon: DollarSign,
        keywords: 'pricing tiers volume discount',
        run: () => go('/dashboard/billing/rates'),
      },
      {
        id: 'nav:settings',
        section: 'Navigation',
        label: t('Go to Settings', '前往 设置'),
        icon: Settings,
        keywords: 'notifications profile',
        run: () => go('/dashboard/settings'),
      },
      {
        id: 'nav:members',
        section: 'Navigation',
        label: t('Go to Settings · Members', '前往 设置 · 团队成员'),
        icon: Users,
        keywords: 'team invite roles',
        run: () => go('/dashboard/settings/members'),
      },
      {
        id: 'nav:docs',
        section: 'Navigation',
        label: t('Open API Docs', '打开 API 文档'),
        icon: BookOpen,
        keywords: 'documentation reference',
        run: () => go('/global/docs?from=dev'),
      },
    ];

    const actionItems: CommandItem[] = [
      {
        id: 'act:add-credits',
        section: 'Actions',
        label: tx('Add credits'),
        hint: t('Top up a paid key via Stripe', '通过 Stripe 为付费 Key 充值'),
        icon: Plus,
        keywords: 'topup recharge money buy',
        run: () => openAddCredits(),
      },
      {
        id: 'act:create-key',
        section: 'Actions',
        label: t('Create paid key', '创建付费 Key'),
        hint: t('Spin up a new paid API key', '新建付费 API Key'),
        icon: Key,
        keywords: 'new api key paid',
        run: () => go('/dashboard/keys#create-paid-key'),
      },
      {
        id: 'act:spend-limit',
        section: 'Actions',
        label: t('Adjust spend limit', '调整支出上限'),
        icon: CreditCard,
        keywords: 'cap monthly safety',
        run: () =>
          go('/dashboard/billing?edit=spend-limit#spend-limit'),
      },
      {
        id: 'act:theme',
        section: 'Actions',
        label: t('Toggle theme', '切换主题'),
        icon: Sun,
        keywords: 'dark light mode',
        run: toggleTheme,
      },
    ];

    // Each API key gets a searchable entry: "My key · 4f2a" → jumps to Keys
    // page. Paid keys additionally expose an "Add credits" quick action.
    const keyItems: CommandItem[] = [];
    if (starter) {
      keyItems.push({
        id: `key:starter:${starter.id}`,
        section: 'Keys',
        label: `${starter.name} · ${keyLast4(starter.secret)}`,
        hint: tx('Starter key · view on Keys page'),
        icon: Key,
        keywords: `${starter.secret} starter free ${keyLast4(starter.secret)}`,
        run: () => go('/dashboard/keys'),
      });
    }
    for (const k of paidKeys) {
      keyItems.push({
        id: `key:${k.id}`,
        section: 'Keys',
        label: `${k.name} · ${keyLast4(k.secret)}`,
        hint: t(
          `${k.env === 'production' ? 'Prod' : 'Dev'} · view on Keys page`,
          `${k.env === 'production' ? '生产' : '开发'} · 在密钥页查看`,
        ),
        icon: Key,
        keywords: `${k.secret} ${k.env} ${keyLast4(k.secret)}`,
        run: () => go('/dashboard/keys'),
      });
      keyItems.push({
        id: `key:${k.id}:add-credits`,
        section: 'Keys',
        label: t(
          `Add credits to ${k.name}`,
          `为 ${k.name} 充值`,
        ),
        hint: keyLast4(k.secret),
        icon: Plus,
        keywords: `${k.secret} topup recharge ${keyLast4(k.secret)}`,
        run: () => openAddCredits(k.id),
      });
    }

    const accountItems: CommandItem[] = [
      {
        id: 'acc:help',
        section: 'Account',
        label: t('Contact support', '联系客服'),
        icon: HelpCircle,
        keywords: 'help support contact',
        run: () => {
          closePalette();
          window.open('mailto:support@chivox.com', '_blank');
        },
      },
      {
        id: 'acc:logout',
        section: 'Account',
        label: t('Log out', '退出登录'),
        icon: LogOut,
        keywords: 'signout leave',
        run: () => {
          closePalette();
          logout();
          router.push('/login');
        },
      },
    ];

    return [...navItems, ...actionItems, ...keyItems, ...accountItems];
  }, [paidKeys, starter, t, tx]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const hay = `${it.label} ${it.hint ?? ''} ${it.keywords ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  // Group filtered items by section, preserving SECTION_ORDER.
  const grouped = useMemo(() => {
    const buckets = new Map<CommandItem['section'], CommandItem[]>();
    for (const it of filtered) {
      if (!buckets.has(it.section)) buckets.set(it.section, []);
      buckets.get(it.section)!.push(it);
    }
    const out: { section: CommandItem['section']; items: CommandItem[] }[] = [];
    for (const s of SECTION_ORDER) {
      const list = buckets.get(s);
      if (list && list.length) out.push({ section: s, items: list });
    }
    return out;
  }, [filtered]);

  // Flat ordered list mirroring the render order for selection math.
  const ordered = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  // Reset cursor on query / items change.
  useEffect(() => {
    setSelected(0);
  }, [query, ordered.length]);

  // Clamp selection to available range.
  useEffect(() => {
    if (selected >= ordered.length) setSelected(Math.max(0, ordered.length - 1));
  }, [selected, ordered.length]);

  // Autofocus input each time the palette opens; also reset the query so the
  // user can start typing immediately.
  useEffect(() => {
    if (!open) return;
    setQuery('');
    queueMicrotask(() => inputRef.current?.focus());
  }, [open]);

  // Global ⌘K toggle. Registered once at mount — firing even when the
  // palette is closed is intended.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        togglePalette();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Lock body scroll while open, classic modal pattern.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Scroll active row into view as selection moves.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-cmd-index="${selected}"]`,
    );
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selected, open]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closePalette();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => (ordered.length === 0 ? 0 : (s + 1) % ordered.length));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) =>
        ordered.length === 0 ? 0 : (s - 1 + ordered.length) % ordered.length,
      );
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const item = ordered[selected];
      if (item) item.run();
    }
  };

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label={t('Command palette', '命令面板')}
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] px-4"
          onKeyDown={onKeyDown}
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closePalette}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-[620px] rounded-xl border border-border bg-background shadow-2xl overflow-hidden">
            {/* Search input row */}
            <div className="flex items-center gap-3 px-4 h-12 border-b border-border">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t(
                  'Search pages, keys, actions…',
                  '搜索页面、Key、操作…',
                )}
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                aria-label={t('Command palette input', '命令面板输入')}
              />
              <kbd className="hidden sm:inline text-[10px] px-1.5 h-5 leading-[18px] rounded border border-border text-muted-foreground">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div
              ref={listRef}
              className="max-h-[50vh] overflow-y-auto py-1.5"
              role="listbox"
            >
              {grouped.length === 0 ? (
                <div className="px-4 py-10 text-center text-xs text-muted-foreground">
                  {t(
                    `No matches for "${query}". Try "billing", "add credits" or a key last-4.`,
                    `没有匹配"${query}"。试试 "billing"、"add credits" 或 Key 后 4 位。`,
                  )}
                </div>
              ) : (
                <>
                  {grouped.map((group) => {
                    // Resolve the base flat index for each item (cumulative).
                    const startIdx = ordered.indexOf(group.items[0]);
                    return (
                      <div key={group.section} className="py-1">
                        <div className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                          {t(group.section, SECTION_ZH[group.section])}
                        </div>
                        {group.items.map((it, i) => {
                          const flatIdx = startIdx + i;
                          const isActive = flatIdx === selected;
                          const Icon = it.icon;
                          return (
                            <button
                              key={it.id}
                              type="button"
                              role="option"
                              aria-selected={isActive}
                              data-cmd-index={flatIdx}
                              onClick={it.run}
                              onMouseEnter={() => setSelected(flatIdx)}
                              className={cn(
                                'w-full flex items-center gap-3 px-4 py-2 text-left',
                                isActive
                                  ? 'bg-muted/60 text-foreground'
                                  : 'text-foreground/90 hover:bg-muted/40',
                              )}
                            >
                              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm truncate">{it.label}</p>
                                {it.hint && (
                                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                    {it.hint}
                                  </p>
                                )}
                              </div>
                              <ArrowRight
                                className={cn(
                                  'h-3.5 w-3.5 shrink-0 transition-opacity',
                                  isActive
                                    ? 'text-muted-foreground opacity-100'
                                    : 'opacity-0',
                                )}
                              />
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Footer hints */}
            <div className="flex items-center justify-between gap-3 px-4 h-9 border-t border-border text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 h-4 leading-[14px] rounded border border-border text-[9px]">
                    ↑↓
                  </kbd>
                  {t('navigate', '移动')}
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 h-4 leading-[14px] rounded border border-border text-[9px]">
                    ↵
                  </kbd>
                  {t('select', '选择')}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1 h-4 leading-[14px] rounded border border-border text-[9px]">
                  ⌘K
                </kbd>
                {t('toggle', '呼出')}
              </div>
            </div>
          </div>
        </div>
      )}

      <StripeCheckoutModal
        open={addCreditsOpen}
        onClose={() => setAddCreditsOpen(false)}
        mode="add-credits"
        keyId={addCreditsKeyId ?? undefined}
      />
    </>
  );
}

// Re-export helpers for callers that want to trigger the palette without
// importing the ui-store directly.
export { openPalette, closePalette, togglePalette };
