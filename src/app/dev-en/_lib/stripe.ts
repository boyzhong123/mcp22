'use client';

import { loadStripe, type Stripe } from '@stripe/stripe-js';

let cached: Promise<Stripe | null> | null = null;

// Lazy Stripe.js loader. Reads NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY at runtime.
// If the env var is missing, returns null so the caller can show a helpful
// "Stripe is not configured" message instead of crashing.
export function getStripe(): Promise<Stripe | null> {
  if (cached) return cached;
  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
  if (!pk) {
    cached = Promise.resolve(null);
    return cached;
  }
  cached = loadStripe(pk);
  return cached;
}

export function isStripeConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
}
