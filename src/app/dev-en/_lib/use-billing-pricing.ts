'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './auth-context';
import {
  FALLBACK_BILLING_PRICING,
  loadBillingPricing,
  type BillingPricingCatalog,
} from './billing-pricing';

/**
 * Loads recharge pricing and independent CoreType pricing into one stable
 * catalog. Demo / offline sessions keep the local fallback so the UI renders.
 */
export function useBillingPricing(): {
  catalog: BillingPricingCatalog;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const { isDemo, user } = useAuth();
  const [catalog, setCatalog] = useState<BillingPricingCatalog>(FALLBACK_BILLING_PRICING);
  const [loading, setLoading] = useState(!isDemo && !!user);

  const refresh = async () => {
    if (isDemo || !user) {
      setCatalog(FALLBACK_BILLING_PRICING);
      setLoading(false);
      return;
    }
    setLoading(true);
    const next = await loadBillingPricing();
    setCatalog(next);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isDemo || !user) {
        if (!cancelled) {
          setCatalog(FALLBACK_BILLING_PRICING);
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      const next = await loadBillingPricing();
      if (!cancelled) {
        setCatalog(next);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isDemo, user]);

  return { catalog, loading, refresh };
}
