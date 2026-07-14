'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/** Immediate feedback for public-site navigations, including site ↔ console jumps. */
export function SiteNavigationProgress() {
  const pathname = usePathname() ?? '';
  return <ProgressTracker key={pathname} pathname={pathname} />;
}

function ProgressTracker({ pathname }: { pathname: string }) {
  const [pending, setPending] = useState(false);
  const [announce, setAnnounce] = useState(false);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (pathname.startsWith('/dashboard') || pathname.startsWith('/dev-en/dashboard')) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

      let next: URL;
      try {
        next = new URL(href, window.location.href);
      } catch {
        return;
      }

      if (next.origin !== window.location.origin) return;
      const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const nextUrl = `${next.pathname}${next.search}${next.hash}`;
      if (currentUrl === nextUrl) return;

      setPending(true);
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [pathname]);

  useEffect(() => {
    if (!pending) return;
    const announceTimer = window.setTimeout(() => setAnnounce(true), 240);
    const safetyTimer = window.setTimeout(() => {
      setPending(false);
      setAnnounce(false);
    }, 8000);
    return () => {
      window.clearTimeout(announceTimer);
      window.clearTimeout(safetyTimer);
    };
  }, [pending]);

  return (
    <>
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] overflow-hidden transition-opacity duration-150 ${pending ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="site-nav-progress h-full rounded-full bg-gradient-to-r from-[#1D72E8] via-[#7C3AED] to-[#F01681]" />
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {announce ? 'Loading page…' : ''}
      </span>
    </>
  );
}
