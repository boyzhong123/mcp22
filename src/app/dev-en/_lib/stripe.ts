'use client';

import { loadStripe, type Stripe } from '@stripe/stripe-js';

let cached: Promise<Stripe | null> | null = null;
let cachedKey = '';

// Lazy Stripe.js loader. Accepts the publishable key as a parameter so
// the caller can supply it from runtime config (e.g. /api/config) instead
// of relying on a build-time NEXT_PUBLIC_* env var.
export function getStripe(publishableKey: string): Promise<Stripe | null> {
  if (cached && cachedKey === publishableKey) return cached;
  if (!publishableKey) {
    cached = Promise.resolve(null);
    cachedKey = '';
    return cached;
  }
  cachedKey = publishableKey;
  cached = loadStripe(publishableKey);
  return cached;
}
