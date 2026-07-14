'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { BrandLoader } from './brand-loader';
import { clearNavigation, startNavigation } from '../_lib/ui-store';
import { useUi } from '../_lib/use-ui-store';
import { useLang } from '../_lib/use-lang';
import { cn } from '@/lib/utils';

/**
 * Global navigation feedback for the developer console.
 *
 * - Top gradient progress bar appears the instant a same-app link (or
 *   `startNavigation`) fires, so clicks never feel dead.
 * - After a short delay, a brand loader card shows for slower transitions.
 * - Cleared when the route commits (pathname change).
 */
export function NavigationProgress() {
  const pathname = usePathname() ?? '';
  const pending = useUi((s) => s.navigationPending);
  const { t } = useLang();
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    clearNavigation();
    setShowOverlay(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const hrefAttr = anchor.getAttribute('href');
      if (
        !hrefAttr ||
        hrefAttr.startsWith('#') ||
        hrefAttr.startsWith('mailto:') ||
        hrefAttr.startsWith('tel:')
      ) {
        return;
      }

      let url: URL;
      try {
        url = new URL(hrefAttr, window.location.origin);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;

      const next = `${url.pathname}${url.search}`;
      const current = `${window.location.pathname}${window.location.search}`;
      if (next === current) return;

      if (
        !url.pathname.startsWith('/dashboard') &&
        !url.pathname.startsWith('/global') &&
        !url.pathname.startsWith('/login')
      ) {
        return;
      }

      startNavigation(next);
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  useEffect(() => {
    if (!pending) {
      setShowOverlay(false);
      return;
    }
    const timer = window.setTimeout(() => setShowOverlay(true), 180);
    return () => window.clearTimeout(timer);
  }, [pending]);

  useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => clearNavigation(), 8000);
    return () => window.clearTimeout(timer);
  }, [pending]);

  return (
    <>
      <div
        className={cn(
          'pointer-events-none fixed left-0 right-0 top-0 z-[100] h-[3px] w-screen overflow-hidden transition-opacity duration-150',
          pending ? 'opacity-100' : 'opacity-0',
        )}
        aria-hidden={!pending}
      >
        <div
          className={cn(
            'h-full w-full bg-gradient-to-r from-[#1D72E8] via-[#7C3AED] to-[#F01681] bg-[length:200%_100%]',
            pending && 'dev-nav-progress',
          )}
        />
      </div>

      {pending && showOverlay ? (
        <div className="pointer-events-none fixed inset-0 z-[65] flex items-center justify-center">
          <div className="absolute inset-0 bg-background/25 backdrop-blur-[1px] animate-in fade-in duration-150" />
          <div className="relative rounded-2xl border border-border bg-background/95 px-8 py-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <BrandLoader size={44} label={t('Loading…', '加载中…')} />
          </div>
        </div>
      ) : null}
    </>
  );
}
