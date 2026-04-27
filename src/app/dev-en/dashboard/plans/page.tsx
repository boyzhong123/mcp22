'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Legacy alias — `Pricing` is now the `Rates` tab inside Billing. We keep
 * the old route as a client-side redirect so existing bookmarks still
 * resolve. Using `router.replace` avoids polluting history.
 */
export default function PlansRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/billing/rates');
  }, [router]);
  return null;
}
