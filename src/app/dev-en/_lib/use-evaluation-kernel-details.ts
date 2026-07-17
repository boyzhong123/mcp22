'use client';

import { useCallback, useState } from 'react';
import { useAuth } from './auth-context';
import {
  FALLBACK_BILLING_PRICING,
  loadBillingKernelDetails,
  type BillingPricingCatalog,
} from './billing-pricing';

/**
 * Lazy CoreType detail loader. Merely rendering a pricing card never requests
 * technical kernel metadata; the caller explicitly invokes `load()` after a
 * detail action. Demo sessions use the sanitized server snapshot offline.
 */
export function useEvaluationKernelDetails(): {
  catalog: BillingPricingCatalog;
  loading: boolean;
  loaded: boolean;
  load: () => Promise<void>;
} {
  const { isDemo, user } = useAuth();
  const [catalog, setCatalog] = useState(FALLBACK_BILLING_PRICING);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (isDemo || !user) {
      setCatalog(FALLBACK_BILLING_PRICING);
      setLoaded(true);
      return;
    }

    setLoading(true);
    try {
      setCatalog(await loadBillingKernelDetails(FALLBACK_BILLING_PRICING));
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [isDemo, user]);

  return { catalog, loading, loaded, load };
}
