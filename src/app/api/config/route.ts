import { NextResponse } from 'next/server';

/**
 * GET /api/config
 *
 * Exposes public-safe client keys at **runtime** so that the frontend can read
 * them without a rebuild.  Only publishable / client-facing IDs are returned —
 * never secrets.
 */
export function GET() {
  return NextResponse.json({
    paypalClientId: process.env.PAYPAL_CLIENT_ID ?? '',
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? '',
  });
}
