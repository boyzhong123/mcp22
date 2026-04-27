'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';

export type NavGroup = {
  id: string;
  icon: React.ElementType;
  label: string;
  children: { id: string; label: string }[];
};

type DocsShellProps = {
  nav: NavGroup[];
  backLabel: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

function defaultActiveId(nav: NavGroup[]) {
  const flat = nav.flatMap((g) => [g.id, ...g.children.map((c) => c.id)]);
  return flat.includes('quick-start') ? 'quick-start' : nav[0]?.children[0]?.id ?? nav[0]?.id ?? '';
}

export function DocsShell({ nav, backLabel, title, subtitle, children }: DocsShellProps) {
  const [activeId, setActiveId] = useState<string>(() => defaultActiveId(nav));
  const contentRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

  const allIds = useMemo(() => {
    const ids: string[] = [];
    nav.forEach((g) => {
      ids.push(g.id);
      g.children.forEach((c) => ids.push(c.id));
    });
    return ids;
  }, [nav]);

  const scrollToAnchor = useCallback((id: string) => {
    const target = document.getElementById(id);
    if (!target) return;

    const scroller = contentRef.current;
    if (scroller && window.innerWidth >= 1024) {
      const scrollerRect = scroller.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const delta = targetRect.top - scrollerRect.top;
      const top = scroller.scrollTop + delta - 24;
      scroller.scrollTo({ top, behavior: 'smooth' });
      window.history.replaceState(null, '', `#${id}`);
      return;
    }

    window.scrollTo({ top: target.offsetTop - 88, behavior: 'smooth' });
    window.history.replaceState(null, '', `#${id}`);
  }, []);

  useEffect(() => {
    const getAnchors = () =>
      allIds
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => el !== null)
        .map((el) => ({
          id: el.id,
          top: (() => {
            if (useInnerScroller) {
              const scrollerRect = scroller.getBoundingClientRect();
              const elRect = el.getBoundingClientRect();
              return scroller.scrollTop + (elRect.top - scrollerRect.top);
            }
            return el.getBoundingClientRect().top + window.scrollY;
          })(),
        }))
        .sort((a, b) => a.top - b.top);

    let rafId = 0;
    const scroller = contentRef.current;
    const useInnerScroller = !!scroller && window.innerWidth >= 1024;

    const computeActive = () => {
      const anchors = getAnchors();
      if (anchors.length === 0) return;

      const scrollTop = useInnerScroller ? scroller.scrollTop : window.scrollY;
      const probeY = scrollTop + 170;
      let currentId = anchors[0].id;

      for (const a of anchors) {
        if (a.top <= probeY) currentId = a.id;
        else break;
      }

      const atBottom = useInnerScroller
        ? scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4
        : window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) {
        currentId = anchors[anchors.length - 1].id;
      }

      setActiveId((prev) => (prev === currentId ? prev : currentId));
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        computeActive();
      });
    };

    computeActive();
    const t = window.setTimeout(computeActive, 120);

    if (useInnerScroller) {
      scroller.addEventListener('scroll', onScroll, { passive: true });
    } else {
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    window.addEventListener('resize', computeActive);
    window.addEventListener('hashchange', computeActive);
    return () => {
      window.clearTimeout(t);
      if (rafId) window.cancelAnimationFrame(rafId);
      if (useInnerScroller) {
        scroller.removeEventListener('scroll', onScroll);
      } else {
        window.removeEventListener('scroll', onScroll);
      }
      window.removeEventListener('resize', computeActive);
      window.removeEventListener('hashchange', computeActive);
    };
  }, [allIds]);

  const activeGroupId = useMemo(() => {
    for (const g of nav) {
      if (g.id === activeId) return g.id;
      if (g.children.some((c) => c.id === activeId)) return g.id;
    }
    return activeId;
  }, [activeId, nav]);

  useEffect(() => {
    const n = navRef.current;
    if (!n) return;
    if (window.innerWidth < 1024) return;

    const target = n.querySelector<HTMLElement>(`[data-nav-id="${activeId}"]`);
    if (!target) return;

    const navRect = n.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const outOfView = targetRect.top < navRect.top + 8 || targetRect.bottom > navRect.bottom - 8;

    if (outOfView) {
      target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeId]);

  return (
    <main className="flex-1">
      <div className="container mx-auto px-6 py-12 md:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{title}</h1>
        <p className="text-muted-foreground mb-10">{subtitle}</p>

        <div className="grid gap-8 md:gap-10 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <nav
            ref={navRef}
            className="hidden lg:block self-start h-[calc(100vh-6rem)] overflow-y-auto pr-2"
          >
            {nav.map((group) => {
              const isGroupActive = activeGroupId === group.id;
              return (
                <div key={group.id} className="mb-5">
                  <a
                    href={`#${group.id}`}
                    data-nav-id={group.id}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveId(group.id);
                      scrollToAnchor(group.id);
                    }}
                    className={`flex items-center gap-2 text-sm font-semibold mb-1.5 transition-colors ${
                      isGroupActive ? 'text-foreground' : 'text-foreground/70 hover:text-foreground'
                    }`}
                  >
                    <group.icon
                      className={`h-4 w-4 ${isGroupActive ? 'text-foreground' : 'text-muted-foreground'}`}
                    />
                    {group.label}
                  </a>
                  <ul className="ml-6 space-y-1 border-l border-border/40 pl-3 relative">
                    {group.children.map((child) => {
                      const isActive = activeId === child.id;
                      return (
                        <li key={child.id} className="relative">
                          {isActive && (
                            <span className="absolute -left-[13px] top-0 bottom-0 w-0.5 bg-foreground rounded-full" />
                          )}
                          <a
                            href={`#${child.id}`}
                            data-nav-id={child.id}
                            onClick={(e) => {
                              e.preventDefault();
                              setActiveId(child.id);
                              scrollToAnchor(child.id);
                            }}
                            className={`text-xs block py-0.5 leading-5 transition-colors ${
                              isActive
                                ? 'text-foreground font-medium'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
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

          <div
            ref={contentRef}
            className="min-w-0 max-w-3xl lg:max-w-none lg:h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-3"
          >
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
