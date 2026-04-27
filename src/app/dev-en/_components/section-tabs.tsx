'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLang } from '../_lib/use-lang';

export type SectionTab = {
  /** Destination path (absolute). First tab's path is the "root" of the section. */
  href: string;
  label: string;
  zhLabel: string;
  /** Optional description shown under the heading on the active tab only. */
  description?: string;
  zhDescription?: string;
};

/**
 * Section-level Tab bar used inside Billing and Settings. Renders a heading
 * ("Billing", "Settings"), an optional description that swaps per active
 * tab, then an underline-style Tabs row.
 *
 * Pattern convention:
 *   - The first tab's `href` is the section root (e.g. `/billing`).
 *   - Subsequent tabs have nested routes (e.g. `/billing/history`).
 *   - Active tab matching is "deepest match wins" — the longest href prefix
 *     that matches the pathname is the active one. That way `/billing/rates`
 *     highlights "Rates" and not "Overview".
 */
export function SectionTabs({
  title,
  zhTitle,
  tabs,
}: {
  title: string;
  zhTitle: string;
  tabs: SectionTab[];
}) {
  const pathname = usePathname() ?? '';
  const { t } = useLang();

  // Longest-prefix wins. Fallback to the first tab so we always have a
  // non-null "active" for the description line.
  const active = [...tabs].sort((a, b) => b.href.length - a.href.length).find(
    (tab) => pathname === tab.href || pathname.startsWith(tab.href + '/'),
  ) ?? tabs[0];

  return (
    <div className="mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">
          {t(title, zhTitle)}
        </h1>
        {active?.description && (
          <p className="text-sm text-muted-foreground mt-1">
            {t(active.description, active.zhDescription ?? active.description)}
          </p>
        )}
      </div>

      <div
        className="mt-5 -mb-px flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border"
        role="tablist"
        aria-label={t(title, zhTitle)}
      >
        {tabs.map((tab) => {
          const isActive = tab.href === active?.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              role="tab"
              aria-selected={isActive}
              className={cn(
                'relative shrink-0 h-9 px-3 inline-flex items-center text-sm transition-colors border-b-2 -mb-px',
                isActive
                  ? 'border-foreground text-foreground font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t(tab.label, tab.zhLabel)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
