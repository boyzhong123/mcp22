'use client';

import { cn } from '@/lib/utils';
import { Languages } from 'lucide-react';
import { useLang } from '../_lib/use-lang';

/**
 * Floating language toggle — bottom-right, visible on developer-console
 * routes (canonical `/dashboard/*`, login at `/login`). Dev-only convenience:
 * the shipping dev console is English only,
 * but during development the Chinese preview lets us sanity-check content
 * without mentally translating.
 *
 * Two-segment pill with the active lang highlighted (same pattern as the
 * iOS / macOS control segmented style). Clicking a segment updates the
 * external lang store; all `useLang()` subscribers re-render.
 */
export function DevEnLangToggle() {
  const { lang, setLang } = useLang();

  return (
    <div
      className="fixed bottom-4 right-4 z-40 flex items-center gap-0.5 rounded-full bg-background border border-border shadow-lg shadow-black/[0.08] dark:shadow-black/40 p-0.5 pl-2.5"
      role="group"
      aria-label="Language toggle (developer preview)"
    >
      <Languages className="h-3.5 w-3.5 text-muted-foreground mr-1" />
      <Segment
        value="en"
        active={lang === 'en'}
        onClick={() => setLang('en')}
        label="Switch to English"
      >
        EN
      </Segment>
      <Segment
        value="zh"
        active={lang === 'zh'}
        onClick={() => setLang('zh')}
        label="切换到中文"
      >
        中
      </Segment>
    </div>
  );
}

function Segment({
  active,
  onClick,
  label,
  children,
}: {
  value: 'en' | 'zh';
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative h-7 min-w-[28px] px-2.5 text-[11px] font-semibold rounded-full transition-colors',
        active
          ? 'bg-foreground text-background'
          : 'text-muted-foreground hover:text-foreground',
      )}
      aria-pressed={active}
      aria-label={label}
    >
      {children}
    </button>
  );
}
