'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Legacy alias — `Top-ups` moved under `Billing → History` to match
 * industry patterns (OpenAI, Anthropic). Existing bookmarks redirect.
 */
export default function RechargeHistoryRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/billing/history');
  }, [router]);
  return null;
}
