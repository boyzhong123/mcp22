'use client';

import type { ComponentType } from 'react';
import { useLang } from '../_lib/use-lang';

/**
 * Shared dashboard page header. Used on standalone pages (Limits,
 * Settings, Profile, …) to give them a consistent "icon tile + title +
 * subtitle" pattern. Pages that use SectionTabs do not need this.
 */
export function PageHeader({
  icon: Icon,
  title,
  zhTitle,
  description,
  zhDescription,
  actions,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  zhTitle: string;
  description?: string;
  zhDescription?: string;
  actions?: React.ReactNode;
}) {
  const { t } = useLang();
  return (
    <header className="flex items-start gap-3">
      <div className="h-10 w-10 rounded-lg bg-muted/40 border border-border flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-semibold tracking-[-0.01em]">
          {t(title, zhTitle)}
        </h1>
        {description && zhDescription && (
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            {t(description, zhDescription)}
          </p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}
