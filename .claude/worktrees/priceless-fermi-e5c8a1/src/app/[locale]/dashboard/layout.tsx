'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from '@/i18n/routing';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardSidebar />
      <main className="lg:pl-60">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
