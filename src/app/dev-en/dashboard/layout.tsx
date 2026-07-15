'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '../_lib/auth-context';
import { DevEnSidebar } from '../_components/sidebar';
import { DevEnTopBar } from '../_components/topbar';
import { DevEnCommandPalette } from '../_components/command-palette';
import { DataHydrator } from '../_components/data-hydrator';
import { OnboardingTour } from '../_components/onboarding-tour';
import { BrandLoader } from '../_components/brand-loader';
import { NavigationProgress } from '../_components/navigation-progress';
import { ActionToastHost } from '../_components/action-toast';
import { useUi } from '../_lib/use-ui-store';

export default function DevEnDashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const collapsed = useUi((s) => s.sidebarCollapsed);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <BrandLoader size={40} />
      </div>
    );
  }

  if (!user) return null;

  // 1. Canvas is pure `bg-background` (no muted tint). Cards get their own
  //    subtle contrast via border + optional bg-muted/40 instead of relying
  //    on an off-tone canvas. This matches the Linear/Vercel pattern where
  //    the page and cards share the same base and differentiate via borders.
  // 2. Content width scales with the viewport instead of freezing at one
  //    cap: 1360 on laptops, and from 2xl (1536px) up it stays fluid until
  //    1760, so on big monitors the cards and tables genuinely widen
  //    rather than the side margins swallowing all the extra space.
  // 3. `main` pads left to match the sidebar's current width so content
  //    reflows when the sidebar collapses / expands.
  return (
    <div className="min-h-dvh bg-background">
      <NavigationProgress />
      <DevEnSidebar />
      <main
        className={cn(
          'flex flex-col min-h-dvh transition-[padding] duration-200 ease-out',
          collapsed ? 'lg:pl-[60px]' : 'lg:pl-60',
        )}
      >
        <DevEnTopBar />
        <div className="flex-1 px-4 sm:px-6 lg:px-8 pt-6 pb-10 max-w-[1360px] 2xl:max-w-[1760px] w-full mx-auto">
          {children}
        </div>
      </main>
      <DevEnCommandPalette />
      <DataHydrator />
      <OnboardingTour />
      <ActionToastHost />
    </div>
  );
}
