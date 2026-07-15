'use client';

import type { Transaction } from '../_lib/mock-store';
import { StripeCheckoutModalPackages } from './stripe-checkout-modal-packages';
import { useLang } from '../_lib/use-lang';
import { showActionToast } from './action-toast';

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
  const { t } = useLang();

  const handleSuccess = (transaction: Transaction) => {
    const creditedPoints = transaction.creditedPoints ?? transaction.pointsToGrant ?? 0;
    showActionToast({
      title: t('Top-up successful', '充值成功'),
      description: creditedPoints > 0
        ? t(
            `${creditedPoints.toLocaleString('en-US')} points have been added to your account.`,
            `${creditedPoints.toLocaleString('en-US')} 积分已到账。`,
          )
        : t('Your account balance has been updated.', '账户余额已更新。'),
    });
    onSuccess?.(transaction);
  };

  return (
    <StripeCheckoutModalPackages
      open={open}
      onClose={onClose}
      onSuccess={handleSuccess}
      keyId={keyId}
    />
  );
}
