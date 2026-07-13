'use client';

import type { ReactNode } from 'react';

/**
 * Soft enter animation when a dashboard page segment commits. Gives every
 * route change a short fade/slide so navigations feel intentional rather
 * than an abrupt paint.
 */
export default function DashboardTemplate({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="dev-page-enter">{children}</div>;
}
