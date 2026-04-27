'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';

type ChildItem = {
  label: string;
  desc?: string;
  hash?: string;
  href?: string;
  /** Section id this child represents when scroll-spy is active */
  sectionId?: string;
};

type MenuGroup = {
  key: string;
  label: string;
  children: ChildItem[];
};

type DirectItem = {
  key: string;
  label: string;
  hash?: string;
  href?: string;
  sectionId?: string;
};

export function NavLinks() {
  const t = useTranslations('Navigation');
  const locale = useLocale();
  const isZh = locale.startsWith('zh');
  const pathname = usePathname();

  const isHome = pathname === '/' || /^\/[a-z]{2}(-[A-Z]{2})?$/.test(pathname);
  const isDocs = pathname.includes('/docs');
  const isDemo = pathname.includes('/demo');

  // ── 分组：菜单顺序与页面实际滚动顺序保持一致 ──
  const groups: MenuGroup[] = [
    {
      key: 'product',
      label: isZh ? '产品' : 'Product',
      children: [
        { label: isZh ? '工作流程' : 'Workflow', desc: isZh ? '从调用到产出的完整链路' : 'From tool call to final output', hash: '#workflow', sectionId: 'workflow' },
        { label: isZh ? '三大核心价值' : 'Core Value', desc: isZh ? '多维数据 · 深度分析 · 全场景' : 'Data · analysis · full scenarios', hash: '#features', sectionId: 'features' },
        { label: isZh ? '双模式评测' : 'Dual Mode', desc: isZh ? '朗读式 + 半开放口语' : 'Read-aloud + semi-open speaking', hash: '#dual-mode', sectionId: 'dual-mode' },
        {
          label: isZh ? '全部评测参数' : 'All Parameters',
          desc: isZh ? '整体 · 准确度 · 节奏' : 'Overall · accuracy · rhythm',
          hash: '#params',
          sectionId: 'params',
        },
        { label: isZh ? 'LLM 深度分析' : 'LLM Analysis', desc: isZh ? '评分 → 诊断 → 练习' : 'Score → diagnose → practice', hash: '#how-it-works', sectionId: 'how-it-works' },
      ],
    },
    {
      key: 'scenes',
      label: isZh ? '场景' : 'Scenarios',
      children: [
        {
          label: isZh ? '教育与学习' : 'Education',
          desc: isZh ? '口语外教 · 儿童阅读' : 'Speaking tutor · reading',
          hash: '#use-cases',
          sectionId: 'use-cases',
        },
        {
          label: isZh ? 'AI 产品落地' : 'AI Product',
          desc: isZh ? 'IM 机器人 · 质检' : 'IM bots · QC',
          hash: '#use-cases-b',
          sectionId: 'use-cases-b',
        },
        { label: isZh ? '在线体验' : 'Try Demo', desc: isZh ? '四种题型，30 秒上手' : '4 types, ready in 30s', href: '/demo' },
      ],
    },
  ];

  const homeItem: DirectItem = { key: 'home', label: t('home'), hash: '#hero', sectionId: 'hero' };

  const direct: DirectItem[] = [
    { key: 'pricing', label: t('pricing'), hash: '#pricing', sectionId: 'pricing' },
    { key: 'faq', label: t('faq'), hash: '#faq', sectionId: 'faq' },
    { key: 'docs', label: t('docs'), href: '/docs' },
  ];

  // ── Scroll-spy: 当前视口中心最近的 section ──
  const [activeSection, setActiveSection] = useState<string>('');
  useEffect(() => {
    if (!isHome) return;
    const allIds = [
      homeItem.sectionId,
      ...groups.flatMap((g) => g.children.map((c) => c.sectionId).filter(Boolean)),
      ...direct.map((d) => d.sectionId).filter(Boolean),
    ].filter(Boolean) as string[];
    const els = allIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (els.length === 0) return;

    const compute = () => {
      const target = window.innerHeight * 0.35;
      let best: { id: string; dist: number } | null = null;
      for (const el of els) {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
        const dist = Math.abs(rect.top - target);
        if (!best || dist < best.dist) best = { id: el.id, dist };
      }
      setActiveSection(best?.id ?? '');
    };
    compute();
    window.addEventListener('scroll', compute, { passive: true });
    window.addEventListener('resize', compute);
    return () => {
      window.removeEventListener('scroll', compute);
      window.removeEventListener('resize', compute);
    };
  }, [isHome, pathname]);

  // 首页按钮：在首页就滚回顶部，不在首页就路由回 /
  const renderHomeItem = () => {
    const active = isHome && homeItem.sectionId === activeSection;
    const cls = cn(
      'px-3 py-1.5 text-sm font-medium tracking-tight rounded-md transition-colors duration-150',
      active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
    );
    if (isHome) {
      return (
        <a
          key={homeItem.key}
          href={homeItem.hash}
          className={cls}
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          {homeItem.label}
        </a>
      );
    }
    return (
      <Link key={homeItem.key} href="/" className={cls}>
        {homeItem.label}
      </Link>
    );
  };

  return (
    <nav className="hidden lg:flex items-center gap-1 ml-8">
      {renderHomeItem()}
      {groups.map((g) => {
        const childActive =
          isHome && g.children.some((c) => c.sectionId && c.sectionId === activeSection);
        return (
          <DropdownGroup
            key={g.key}
            group={g}
            groupActive={childActive}
            activeSection={activeSection}
            isHome={isHome}
            isDocs={isDocs}
            isDemo={isDemo}
          />
        );
      })}

      {direct.map((d) => {
        const active = d.href
          ? (d.href === '/docs' && isDocs) || (d.href === '/demo' && isDemo)
          : isHome && d.sectionId === activeSection;
        const cls = cn(
          'px-3 py-1.5 text-sm font-medium tracking-tight rounded-md transition-colors duration-150',
          active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
        );
        if (d.href) {
          return (
            <Link key={d.key} href={d.href} className={cls}>
              {d.label}
            </Link>
          );
        }
        // 首页内用原生 a 保留浏览器的平滑锚点跳转；二级页面走 Link 路由回首页 + hash
        if (isHome) {
          return (
            <a key={d.key} href={d.hash} className={cls}>
              {d.label}
            </a>
          );
        }
        return (
          <Link key={d.key} href={`/${d.hash ?? ''}`} className={cls}>
            {d.label}
          </Link>
        );
      })}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dropdown
// ─────────────────────────────────────────────────────────────────────────────
function DropdownGroup({
  group,
  groupActive,
  activeSection,
  isHome,
  isDocs,
  isDemo,
}: {
  group: MenuGroup;
  groupActive: boolean;
  activeSection: string;
  isHome: boolean;
  isDocs: boolean;
  isDemo: boolean;
}) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  const handleEnter = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
  };
  const handleLeave = () => {
    // 延迟 120ms 关闭，避免鼠标从 trigger 到 panel 之间的缝隙触发闪烁
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 120);
  };

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        type="button"
        className={cn(
          'inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium tracking-tight rounded-md transition-colors duration-150',
          groupActive || open
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {group.label}
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 transition-transform duration-200',
            open ? 'rotate-180' : 'rotate-0'
          )}
        />
      </button>

      {/* ── 下拉面板 ── */}
      <div
        className={cn(
          'absolute left-0 top-full pt-2 min-w-[280px] z-50',
          'transition-all duration-200 origin-top',
          open
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-1 pointer-events-none'
        )}
      >
        <div className="rounded-xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-lg shadow-black/5 p-1.5">
          {group.children.map((c) => {
            const active = c.href
              ? (c.href === '/docs' && isDocs) || (c.href === '/demo' && isDemo)
              : c.sectionId === activeSection;
            const inner = (
              <div
                className={cn(
                  'group/item flex items-start gap-3 px-3 py-2 rounded-lg transition-colors',
                  active
                    ? 'bg-foreground/[0.06] text-foreground'
                    : 'hover:bg-foreground/[0.04] text-muted-foreground hover:text-foreground'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{c.label}</div>
                  {c.desc && (
                    <div className="text-[11px] text-muted-foreground/80 mt-0.5 leading-snug">
                      {c.desc}
                    </div>
                  )}
                </div>
                {active && <span className="mt-1.5 h-1 w-1 rounded-full bg-foreground" />}
              </div>
            );
            if (c.href) {
              return (
                <Link
                  key={c.label}
                  href={c.href}
                  className="block"
                  onClick={() => setOpen(false)}
                >
                  {inner}
                </Link>
              );
            }
            if (isHome) {
              return (
                <a
                  key={c.label}
                  href={c.hash}
                  className="block"
                  onClick={() => setOpen(false)}
                >
                  {inner}
                </a>
              );
            }
            return (
              <Link
                key={c.label}
                href={`/${c.hash ?? ''}`}
                className="block"
                onClick={() => setOpen(false)}
              >
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
