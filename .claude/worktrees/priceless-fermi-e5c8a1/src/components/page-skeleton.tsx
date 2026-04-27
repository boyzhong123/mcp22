import { Loader2 } from 'lucide-react';

export function PageLoader({ label = '加载中…' }: { label?: string }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" strokeWidth={1.5} />
        <p className="text-sm tracking-wide">{label}</p>
      </div>
    </div>
  );
}

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted/60 ${className}`}
      aria-hidden
    />
  );
}

/** 文章型骨架屏：侧边栏 + 主内容（用于 docs 这类长页面） */
export function DocPageSkeleton() {
  return (
    <main className="flex-1">
      <div className="container mx-auto px-6 py-12 md:py-20">
        <SkeletonBlock className="h-4 w-24 mb-8" />
        <SkeletonBlock className="h-10 w-80 mb-3" />
        <SkeletonBlock className="h-4 w-60 mb-10" />

        <div className="flex gap-10">
          <div className="hidden lg:flex flex-col gap-5 w-56 shrink-0 pt-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <SkeletonBlock className="h-4 w-32" />
                <div className="ml-4 space-y-1.5">
                  <SkeletonBlock className="h-3 w-28" />
                  <SkeletonBlock className="h-3 w-24" />
                  <SkeletonBlock className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1 min-w-0 max-w-3xl space-y-10">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <SkeletonBlock className="h-6 w-48" />
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-5/6" />
                <SkeletonBlock className="h-4 w-4/6" />
                <SkeletonBlock className="h-32 w-full mt-4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

/** Dashboard 型骨架屏：表格/卡片 */
export function DashboardPageSkeleton() {
  return (
    <div>
      <SkeletonBlock className="h-7 w-40 mb-6" />
      <SkeletonBlock className="h-9 w-28 mb-6" />
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="p-4 border-b border-border flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 border-b border-border flex gap-4 items-center">
            {Array.from({ length: 5 }).map((__, j) => (
              <SkeletonBlock key={j} className="h-5 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
