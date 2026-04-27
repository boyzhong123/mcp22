'use client';

import { AudioWaveform } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/routing';

export function LogoLink() {
  const pathname = usePathname();
  const isHome = pathname === '/' || /^\/[a-z]{2}(-[A-Z]{2})?$/.test(pathname);

  if (isHome) {
    // 已在首页：仅滚回顶部，避免触发路由
    return (
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="flex items-center gap-2.5 shrink-0"
      >
        <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center shadow-sm ring-1 ring-foreground/10">
          <AudioWaveform className="h-4.5 w-4.5 text-background" strokeWidth={2.3} />
          <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-background" />
        </div>
        <span className="font-bold tracking-[-0.02em] text-lg sm:text-xl leading-none flex items-baseline gap-1">
          <span>Chivox</span>
          <span className="bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 bg-clip-text text-transparent">MCP</span>
        </span>
      </a>
    );
  }

  return (
    <Link href="/" className="flex items-center gap-2.5 shrink-0">
      <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center shadow-sm ring-1 ring-foreground/10">
        <AudioWaveform className="h-4.5 w-4.5 text-background" strokeWidth={2.3} />
        <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-background" />
      </div>
      <span className="font-bold tracking-[-0.02em] text-lg sm:text-xl leading-none flex items-baseline gap-1">
        <span>Chivox</span>
        <span className="bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 bg-clip-text text-transparent">MCP</span>
      </span>
    </Link>
  );
}
