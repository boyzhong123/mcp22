'use client';

import type { Transaction } from '../_lib/mock-store';
import { StripeCheckoutModalPackages } from './stripe-checkout-modal-packages';

interface StripeCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (txn: Transaction) => void;
  /** Accepted for back-compat; the point balance is account-wide. */
  keyId?: string;
}

/**
 * The product has one customer-facing recharge flow: flexible evaluation
 * point packages. Retired checkout comparisons remain out of the runtime
 * path so every balance, receipt, and API response follows one rule set.
 */
export function StripeCheckoutModal({
  open,
  onClose,
  onSuccess,
  keyId,
}: StripeCheckoutModalProps) {
  return (
    <StripeCheckoutModalPackages
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      keyId={keyId}
    />
  );
}
