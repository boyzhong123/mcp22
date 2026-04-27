'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Legacy alias — `Team` moved under `Settings → Members` to match
 * industry patterns (Vercel, Stripe). Existing bookmarks redirect.
 */
export default function TeamRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/settings/members');
  }, [router]);
  return null;
}
