'use client';

import {
  AlertCircle,
  Building2,
  Check,
  Copy,
  CreditCard,
  Gauge,
  Landmark,
  Lock,
  Plus,
  ShieldCheck,
  Smartphone,
  TrendingDown,
  Wallet,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  addKeyCreditsCents,
  addPaymentMethod,
  addTransaction,
  estimateKeyCreditRunway,
  formatCents,
  getKey,
  getUsage,
  listKeys,
  listPaymentMethods,
  listProjects,
  setDefaultPaymentMethod,
  type ApiKey,
  type CardBrand,
  type PaymentMethod,
  type Transaction,
} from '../_lib/mock-store';
import { useMockStore } from '../_lib/use-mock-store';
import { useMockAuth } from '../_lib/mock-auth';
import { useLang } from '../_lib/use-lang';

type CheckoutMode = 'add-credits' | 'add-payment-method';

interface StripeCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (txn: Transaction, pm?: PaymentMethod) => void;
  mode?: CheckoutMode;
  keyId?: string;
}

const AMOUNT_OPTIONS = [2000, 5000, 10000, 25000];

const COUNTRIES = [
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'DE', label: 'Germany' },
  { code: 'JP', label: 'Japan' },
  { code: 'SG', label: 'Singapore' },
  { code: 'AU', label: 'Australia' },
  { code: 'CA', label: 'Canada' },
];

// Mirrors Stripe Payment Element's method keys: express wallets on top
// (apple / google / link / cashapp / paypal / amazon), then cards,
// then bank transfers. See https://stripe.com/zh-us/payments/payment-methods
type MethodKey =
  | `saved:${string}`
  | 'new-card'
  | 'apple'
  | 'google'
  | 'link'
  | 'cashapp'
  | 'paypal'
  | 'amazon'
  | 'ach'
  | 'wire';

// Bank transfer threshold — below this, ACH is not offered because the
// 3-4 business-day settle + fixed $0.80 fee doesn't make sense for a $20
// top-up. Matches typical Stripe B2B recommendation.
const BANK_TRANSFER_MIN_CENTS = 500_00; // $500

// Mock "backing" cards / funding sources surfaced by the wallet flows after
// auth. In a real Stripe integration these come from the payment_method
// object on the token the wallet returns — static here for demo fidelity.
const WALLET_BACKING = {
  apple: { brand: 'visa' as CardBrand, last4: '1881' },
  google: { brand: 'mastercard' as CardBrand, last4: '7712' },
  amazon: { brand: 'visa' as CardBrand, last4: '0017' },
};
const LINK_BACKING = { brand: 'visa' as CardBrand, last4: '4242' };
// Cash App Pay and PayPal aren't backed by a card number the merchant sees
// — Stripe returns a wallet reference instead. We synthesise a visible hint
// so the recharge-history line items don't show a blank last4.
const CASHAPP_BACKING = { handle: '$alex_rivera', last4: 'cash' };
const PAYPAL_BACKING = { email: 'alex.rivera@icloud.com', last4: 'ppal' };

function detectBrand(num: string): CardBrand | 'generic' {
  const d = num.replace(/\s/g, '');
  if (/^4/.test(d)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'mastercard';
  if (/^3[47]/.test(d)) return 'amex';
  return 'generic';
}

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + ' / ' + digits.slice(2);
}

export function StripeCheckoutModal({
  open,
  onClose,
  onSuccess,
  mode = 'add-credits',
  keyId,
}: StripeCheckoutModalProps) {
  // Gate so the inner component fully unmounts between opens, guaranteeing
  // fresh `useState` lazy initializers every time the modal appears.
  if (!open) return null;
  return (
    <OpenedCheckoutModal
      onClose={onClose}
      onSuccess={onSuccess}
      mode={mode}
      keyId={keyId}
    />
  );
}

function OpenedCheckoutModal({
  onClose,
  onSuccess,
  mode = 'add-credits',
  keyId,
}: Omit<StripeCheckoutModalProps, 'open'>) {
  const { tx, t } = useLang();
  const { user } = useMockAuth();
  const savedCards = useMockStore(listPaymentMethods, [] as PaymentMethod[]);
  const projects = useMockStore(listProjects, []);
  const allKeys = useMockStore(listKeys, [] as ApiKey[]);

  // "Global" picker mode: user opened the modal from a non-key-scoped entry
  // point (Billing header, Overview Quick actions, etc) and must first choose
  // which key to top up. `keyId` given → classic per-row flow, skip the picker.
  const needsKeyPicker = mode === 'add-credits' && !keyId;
  // Starter keys cannot accept credits — they're free and rate-limited — so
  // every picker here deals strictly with paid keys.
  const fundableKeys = useMemo(
    () => allKeys.filter((k) => !k.isStarter && k.status !== 'revoked'),
    [allKeys],
  );
  const initialPickedKey = useMemo(() => {
    if (!needsKeyPicker) return null;
    return fundableKeys[0] ?? null;
  }, [needsKeyPicker, fundableKeys]);
  const [pickedProjectId, setPickedProjectId] = useState<string>(
    () => initialPickedKey?.projectId ?? projects[0]?.id ?? '',
  );
  const [pickedKeyId, setPickedKeyId] = useState<string>(
    () => initialPickedKey?.id ?? '',
  );
  const effectiveKeyId = keyId ?? (pickedKeyId || undefined);

  // Keys the picker is allowed to offer: non-revoked, non-starter, scoped
  // to the chosen project. Starter and revoked keys can't accept credits.
  const pickerKeys = useMemo(() => {
    return fundableKeys.filter((k) =>
      pickedProjectId ? k.projectId === pickedProjectId : true,
    );
  }, [fundableKeys, pickedProjectId]);

  const handlePickProject = (nextProjectId: string) => {
    setPickedProjectId(nextProjectId);
    const firstInProject = fundableKeys.find((k) => k.projectId === nextProjectId);
    setPickedKeyId(firstInProject?.id ?? '');
  };

  const defaultCardId = savedCards.find((c) => c.isDefault)?.id ?? savedCards[0]?.id ?? null;

  // In add-payment-method mode, only "new-card" makes sense.
  const [method, setMethodRaw] = useState<MethodKey>(() => {
    if (mode === 'add-payment-method') return 'new-card';
    return defaultCardId ? (`saved:${defaultCardId}` as MethodKey) : 'new-card';
  });

  const [amountCents, setAmountCents] = useState<number>(5000);
  const [customAmount, setCustomAmount] = useState<string>('');

  // new card fields
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [postal, setPostal] = useState('');
  const [country, setCountry] = useState('US');
  const [saveCard, setSaveCard] = useState(true);

  // Link two-step flow: enter email → request OTP → enter 6-digit code.
  // The real Stripe Link UI sends a one-time code to the user's email; after
  // verifying, Link auto-fills the default card on the Link account.
  const [linkStep, setLinkStep] = useState<'idle' | 'sending' | 'code-sent'>('idle');
  const [linkCode, setLinkCode] = useState('');

  // wallet "authorized" state for apple / google. Apple Pay / Google Pay
  // abstract the underlying card; after device-biometric auth Stripe returns a
  // token plus the backing card's brand + last4. We surface that here so the
  // user knows which card will actually be charged.
  const [walletAuthorized, setWalletAuthorized] = useState(false);
  const [walletAuthorizing, setWalletAuthorizing] = useState(false);

  // ACH direct debit fields (Stripe us_bank_account)
  const [achName, setAchName] = useState('');
  const [achRouting, setAchRouting] = useState('');
  const [achAccount, setAchAccount] = useState('');
  const [achConfirm, setAchConfirm] = useState('');
  const [achCompany, setAchCompany] = useState('');
  const [achAuthorized, setAchAuthorized] = useState(false);

  // Wire: acknowledging the instructions is all we need pre-submit — the
  // real wire happens out-of-band at the user's bank. On submit we mark
  // the txn as "pending" (not succeeded) to mirror real-world behavior.
  const [wireAck, setWireAck] = useState(false);

  const [receiptEmail, setReceiptEmail] = useState<string>(() => user?.email ?? '');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveCents = useMemo(() => {
    if (mode === 'add-payment-method') return 0;
    if (customAmount.trim()) {
      const v = Math.round(parseFloat(customAmount) * 100);
      return Number.isFinite(v) && v > 0 ? v : 0;
    }
    return amountCents;
  }, [customAmount, amountCents, mode]);

  const taxCents = 0;
  const totalCents = effectiveCents + taxCents;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !processing) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [processing, onClose]);

  // Selecting a method resets any method-specific scratch state. Doing it in
  // the event handler (not an effect) satisfies React 19's set-state-in-effect
  // rule while still guaranteeing a clean state per method.
  const setMethod = (next: MethodKey) => {
    if (next === method) return;
    setMethodRaw(next);
    setError(null);
    setWalletAuthorized(false);
    setWalletAuthorizing(false);
    setLinkStep('idle');
    setLinkCode('');
    setAchAuthorized(false);
    setWireAck(false);
  };

  const targetKey = effectiveKeyId ? getKey(effectiveKeyId) : undefined;
  const targetProject = targetKey
    ? projects.find((p) => p.id === targetKey.projectId)
    : undefined;

  /** Fingerprint of usage table so runway recalculates when any row changes. */
  const usageRunwaySig = useMockStore(() => {
    let h = 0;
    const arr = getUsage();
    for (let i = 0; i < arr.length; i++) {
      const p = arr[i];
      h =
        ((h * 31 +
          (p.calls ?? 0) * 17 +
          (p.costCents ?? 0) * 3 +
          (p.savingsCents ?? 0)) >>>
          0) %
        2147483647;
    }
    return `${arr.length}:${h}`;
  }, '0:0');

  const creditRunway = useMemo(() => {
    void usageRunwaySig; // subscribe to usage mutations for this derived estimate
    if (mode !== 'add-credits' || !effectiveKeyId) return null;
    if (totalCents < 100) return null;
    return estimateKeyCreditRunway(effectiveKeyId, totalCents);
  }, [mode, effectiveKeyId, totalCents, usageRunwaySig]);

  // Derived: is the currently selected saved card?
  const selectedSavedId = method.startsWith('saved:') ? method.slice('saved:'.length) : null;
  const selectedSavedCard = selectedSavedId
    ? savedCards.find((c) => c.id === selectedSavedId)
    : undefined;

  // Validation per method
  const brand = detectBrand(cardNumber);
  const cardDigits = cardNumber.replace(/\s/g, '');
  const cardValid = cardDigits.length >= 15;
  const expiryValid = /^\d{2}\s\/\s\d{2}$/.test(expiry);
  const cvcValid = /^\d{3,4}$/.test(cvc);
  const nameValid = cardName.trim().length > 1;
  const newCardValid = cardValid && expiryValid && cvcValid && nameValid;
  const linkCodeValid = linkStep === 'code-sent' && /^\d{6}$/.test(linkCode);
  const amountValid = mode === 'add-payment-method' ? true : effectiveCents >= 100;
  // Credits flow requires a chosen key before we can charge anything. In
  // per-row entries `keyId` is already supplied → always valid.
  const keyValid = mode === 'add-payment-method' ? true : !!effectiveKeyId;

  // ACH direct debit validation (Stripe us_bank_account)
  const achRoutingValid = /^\d{9}$/.test(achRouting);
  const achAccountDigits = achAccount.replace(/\s/g, '');
  const achAccountValid = /^\d{4,17}$/.test(achAccountDigits);
  const achMatchValid = achAccountDigits === achConfirm.replace(/\s/g, '') && achAccountValid;
  const achNameValid = achName.trim().length > 1;
  const achValid = achRoutingValid && achMatchValid && achNameValid && achAuthorized;

  // Bank transfer only makes sense above a threshold; below it we grey
  // the option out in the picker. `wireAck` is simply the checkbox.

  const methodValid = (() => {
    if (method === 'new-card') return newCardValid;
    // Saved cards are already tokenised via Stripe Customer API — no CVC
    // re-prompt needed for subsequent off-session charges in a logged-in
    // dashboard session. Just requires selection.
    if (method.startsWith('saved:')) return !!selectedSavedCard;
    if (
      method === 'apple' ||
      method === 'google' ||
      method === 'cashapp' ||
      method === 'amazon'
    ) {
      return walletAuthorized;
    }
    if (method === 'link') return linkCodeValid;
    if (method === 'paypal') return walletAuthorized;
    if (method === 'ach') return achValid && effectiveCents >= BANK_TRANSFER_MIN_CENTS;
    if (method === 'wire') return wireAck && effectiveCents >= BANK_TRANSFER_MIN_CENTS;
    return false;
  })();

  const formValid = amountValid && methodValid && keyValid;

  async function simulateWalletAuth() {
    setError(null);
    setWalletAuthorizing(true);
    await new Promise((r) => setTimeout(r, 900));
    setWalletAuthorizing(false);
    setWalletAuthorized(true);
  }

  async function finalizeSuccess(
    txnMethod: Transaction['method'],
    paidLast4: string,
    pmBrand: CardBrand,
    opts?: { pending?: boolean; descriptionOverride?: string },
  ) {
    let pm: PaymentMethod | undefined;
    const pending = !!opts?.pending;

    // new-card + add-credits with "save card" checked → save
    if (mode === 'add-credits' && method === 'new-card' && saveCard) {
      const [mm, yy] = expiry.split(' / ');
      pm = addPaymentMethod({
        brand: pmBrand,
        last4: paidLast4,
        expMonth: parseInt(mm, 10),
        expYear: 2000 + parseInt(yy, 10),
        name: cardName.trim(),
        makeDefault: savedCards.length === 0,
      });
    }

    // add-payment-method → always save
    if (mode === 'add-payment-method' && method === 'new-card') {
      const [mm, yy] = expiry.split(' / ');
      pm = addPaymentMethod({
        brand: pmBrand,
        last4: paidLast4,
        expMonth: parseInt(mm, 10),
        expYear: 2000 + parseInt(yy, 10),
        name: cardName.trim(),
        makeDefault: savedCards.length === 0 || saveCard,
      });
      if (pm.isDefault) setDefaultPaymentMethod(pm.id);
    }

    // Pending top-ups (e.g. wire transfer awaiting bank receipt) don't add
    // credits to the key until they settle. Succeeded methods credit instantly.
    if (mode === 'add-credits' && effectiveKeyId && !pending) {
      addKeyCreditsCents(effectiveKeyId, totalCents);
    }

    const baseDesc =
      mode === 'add-credits'
        ? targetKey
          ? `${t('Credits added to', '已充值到')} ${targetKey.name}`
          : tx('Credits added')
        : tx('Payment method added');

    const txn = addTransaction({
      amountCents: totalCents,
      status: pending ? 'pending' : 'succeeded',
      method: txnMethod,
      last4: paidLast4,
      description: opts?.descriptionOverride ?? baseDesc,
      kind: mode === 'add-credits' ? 'credit-topup' : 'card-added',
      keyId: effectiveKeyId,
      projectId: targetKey?.projectId,
    });

    setProcessing(false);
    setDone(true);
    window.setTimeout(() => {
      onSuccess?.(txn, pm);
      onClose();
    }, 900);
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!formValid || processing) return;
    setError(null);
    setProcessing(true);

    // Declined-card demo: entering all-zeros card number rejects.
    if (method === 'new-card' && /^0+$/.test(cardDigits)) {
      await new Promise((r) => setTimeout(r, 900));
      setProcessing(false);
      setError(tx('Your card was declined. Please try a different card.'));
      return;
    }

    await new Promise((r) => setTimeout(r, 1100));

    if (method === 'new-card') {
      const pmBrand: CardBrand = brand === 'generic' ? 'visa' : brand;
      await finalizeSuccess('card', cardDigits.slice(-4), pmBrand);
      return;
    }
    if (method.startsWith('saved:') && selectedSavedCard) {
      await finalizeSuccess('card', selectedSavedCard.last4, selectedSavedCard.brand);
      return;
    }
    if (method === 'apple') {
      await finalizeSuccess('apple-pay', WALLET_BACKING.apple.last4, WALLET_BACKING.apple.brand);
      return;
    }
    if (method === 'google') {
      await finalizeSuccess('google-pay', WALLET_BACKING.google.last4, WALLET_BACKING.google.brand);
      return;
    }
    if (method === 'link') {
      await finalizeSuccess('link', LINK_BACKING.last4, LINK_BACKING.brand);
      return;
    }
    if (method === 'cashapp') {
      // Cash App Pay settles through Stripe like a wallet. The "last4" in
      // history is just the symbolic token since real Cash App confirmations
      // don't expose a card number to the merchant.
      await finalizeSuccess('cashapp', CASHAPP_BACKING.last4, 'visa', {
        descriptionOverride:
          mode === 'add-credits' && targetKey
            ? `Cash App Pay · ${t('Credits added to', '已充值到')} ${targetKey.name}`
            : 'Cash App Pay',
      });
      return;
    }
    if (method === 'paypal') {
      await finalizeSuccess('paypal', PAYPAL_BACKING.last4, 'visa', {
        descriptionOverride:
          mode === 'add-credits' && targetKey
            ? `PayPal · ${t('Credits added to', '已充值到')} ${targetKey.name}`
            : 'PayPal',
      });
      return;
    }
    if (method === 'amazon') {
      await finalizeSuccess(
        'amazon-pay',
        WALLET_BACKING.amazon.last4,
        WALLET_BACKING.amazon.brand,
        {
          descriptionOverride:
            mode === 'add-credits' && targetKey
              ? `Amazon Pay · ${t('Credits added to', '已充值到')} ${targetKey.name}`
              : 'Amazon Pay',
        },
      );
      return;
    }
    if (method === 'ach') {
      // ACH direct debit: in real life 3-4 business days, but mock settles
      // immediately so the demo shows credits right away. Last4 comes from
      // the bank account number.
      const last4 = achAccountDigits.slice(-4);
      await finalizeSuccess('ach', last4, 'visa', {
        descriptionOverride:
          mode === 'add-credits' && targetKey
            ? `ACH ${t('transfer', '转账')} · ${t('Credits added to', '已充值到')} ${targetKey.name}`
            : `ACH ${t('transfer', '转账')}`,
      });
      return;
    }
    if (method === 'wire') {
      // Wire: we never actually receive funds in a demo. Mark pending, email
      // the user "instructions", and show a different success screen.
      await finalizeSuccess('wire', '—', 'visa', {
        pending: true,
        descriptionOverride:
          mode === 'add-credits' && targetKey
            ? `Wire ${t('transfer', '转账')} · ${t('Pending for', '等待中')} ${targetKey.name}`
            : `Wire ${t('transfer', '转账')} · ${tx('Pending')}`,
      });
      return;
    }
  }

  const modalTitle =
    mode === 'add-credits'
      ? targetKey
        ? `${t('Add credits to', '充值到')} ${targetKey.name}`
        : tx('Add credits')
      : tx('Add payment method');

  const subtitle =
    mode === 'add-credits' && targetKey
      ? `${targetKey.maskedSecret.slice(-8)}${targetProject ? ` · ${targetProject.name}` : ''}`
      : mode === 'add-credits'
        ? tx('Choose a project and key, then pay')
        : tx('Secure card entry powered by Stripe · Demo');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      translate="no"
      lang="en"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !processing && onClose()}
      />

      <div className="relative w-full max-w-[480px] max-h-[92vh] flex flex-col rounded-2xl bg-background border border-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-background shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 shrink-0 rounded-md bg-[#635bff] flex items-center justify-center">
              <span className="text-white font-bold text-[13px] tracking-tight">S</span>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{modalTitle}</div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                <Lock className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{subtitle}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !processing && onClose()}
            disabled={processing}
            className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40 shrink-0"
            aria-label={tx('Close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {done ? (
          <div className="px-8 py-12 flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
              <Check className="h-7 w-7 text-emerald-500" strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-semibold mb-1">
              {mode === 'add-credits'
                ? method === 'wire'
                  ? tx('Wire instructions sent')
                  : tx('Payment successful')
                : tx('Card saved')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {mode === 'add-credits'
                ? method === 'wire'
                  ? `${t('We emailed wiring instructions to', '我们已将汇款说明发送至')} ${receiptEmail}${t('. Credits will be added once funds arrive (usually 1–3 business days).', '。款项到账后将立即充值(通常 1–3 个工作日)。')}`
                  : `${formatCents(totalCents)}${targetKey ? ` ${t('added to', '已充值到')} ${targetKey.name}.` : ` ${t('added', '已充值')}.`}`
                : tx('Your new payment method is ready for future payments.')}
            </p>
          </div>
        ) : (
          <form
            onSubmit={handlePay}
            className="flex-1 min-h-0 flex flex-col"
          >
            {/* Scrollable content — everything except the Pay footer */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-4">
            {/* 0. Key picker (only when no keyId was pre-selected, i.e. global
                 Add-credits CTA) */}
            {needsKeyPicker && (
              <section>
                <SectionLabel>{tx('Which key?')}</SectionLabel>
                {allKeys.filter((k) => k.status !== 'revoked').length === 0 ? (
                  <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                    {tx('No active API keys. Create one on the')}{' '}
                    <Link href="/dashboard/keys" className="underline">
                      {tx('API Keys page')}
                    </Link>{' '}
                    {tx('first.')}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <select
                          value={pickedProjectId}
                          onChange={(e) => handlePickProject(e.target.value)}
                          className="w-full h-9 pl-3 pr-8 text-sm rounded-lg border border-border bg-background appearance-none focus:outline-none focus:ring-2 focus:ring-ring/20"
                          aria-label={tx('Project')}
                        >
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDownSmall />
                      </div>
                      <div className="relative">
                        <select
                          value={pickedKeyId}
                          onChange={(e) => setPickedKeyId(e.target.value)}
                          className="w-full h-9 pl-3 pr-8 text-sm rounded-lg border border-border bg-background appearance-none focus:outline-none focus:ring-2 focus:ring-ring/20"
                          aria-label={tx('Key')}
                          disabled={pickerKeys.length === 0}
                        >
                          {pickerKeys.length === 0 ? (
                            <option value="">{tx('No keys in this project')}</option>
                          ) : (
                            pickerKeys.map((k) => (
                              <option key={k.id} value={k.id}>
                                {k.name} · {k.maskedSecret.slice(-8)}
                              </option>
                            ))
                          )}
                        </select>
                        <ChevronDownSmall />
                      </div>
                    </div>
                    {targetKey && (
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>
                          {tx('Current balance:')}{' '}
                          <strong className="text-foreground tabular-nums">
                            {formatCents(
                              Math.max(
                                0,
                                targetKey.paidCreditsCents -
                                  targetKey.paidCreditsUsedCents,
                              ),
                            )}
                          </strong>
                        </span>
                        <span className="text-border">·</span>
                        <span>
                          {targetKey.env === 'production' ? tx('Production') : tx('Development')}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </section>
            )}

            {/* 1. Amount (only in add-credits) */}
            {mode === 'add-credits' && (
              <section>
                <SectionLabel>{tx('Amount (USD)')}</SectionLabel>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {AMOUNT_OPTIONS.map((a) => (
                    <button
                      type="button"
                      key={a}
                      onClick={() => {
                        setAmountCents(a);
                        setCustomAmount('');
                      }}
                      className={cn(
                        'h-9 rounded-lg border text-sm font-medium transition-colors',
                        !customAmount && amountCents === a
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border bg-background hover:border-foreground/40',
                      )}
                    >
                      {formatCents(a)}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={customAmount}
                  onChange={(e) =>
                    setCustomAmount(e.target.value.replace(/[^0-9.]/g, '').slice(0, 10))
                  }
                  placeholder={tx('Or enter custom amount (min $1.00)')}
                  className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30"
                />

                {creditRunway && targetKey && (
                  <div className="mt-3 relative overflow-hidden rounded-xl border border-[#635bff]/25 bg-gradient-to-br from-[#635bff]/[0.07] via-[#635bff]/[0.03] to-transparent">
                    {/* Decorative glow in the corner — mirrors Stripe's
                         dashboard "insight card" aesthetic. */}
                    <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#635bff]/15 blur-3xl" />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#635bff]/40 to-transparent"
                    />

                    <div className="relative px-4 py-3.5">
                      {/* Header chip */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#635bff]/12 border border-[#635bff]/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#635bff] dark:text-[#a5a0ff]">
                          <Gauge className="h-3 w-3" />
                          {tx('Runway estimate')}
                        </div>
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground tabular-nums">
                          {t(`Last ${creditRunway.windowDays}d`, `最近 ${creditRunway.windowDays} 天`)}
                        </span>
                      </div>

                      {creditRunway.estimatedDays != null ? (
                        <>
                          {/* Hero duration — what the user really wants to see */}
                          <div className="flex items-baseline gap-2 mb-3">
                            <span className="text-[22px] font-bold tracking-tight tabular-nums text-foreground leading-none">
                              {formatRunwayDuration(creditRunway.estimatedDays)}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {tx('of runway at your current pace')}
                            </span>
                          </div>

                          {/* 3-up metric grid, separated by a hairline */}
                          <div className="grid grid-cols-3 gap-3 pt-2.5 border-t border-border/50">
                            <RunwayStat
                              icon={<Wallet className="h-3 w-3" />}
                              label={tx('Balance after')}
                              value={formatCents(creditRunway.balanceAfterCents)}
                            />
                            <RunwayStat
                              icon={<TrendingDown className="h-3 w-3" />}
                              label={tx('Daily burn')}
                              value={`~${formatCents(
                                Math.max(1, Math.round(creditRunway.avgDailyNetCents)),
                              )}`}
                              suffix={t('/day', '/ 天')}
                            />
                            {creditRunway.estimatedCallsAtPace != null && (
                              <RunwayStat
                                icon={<Check className="h-3 w-3" />}
                                label={t('≈ API calls', '≈ API 调用')}
                                value={creditRunway.estimatedCallsAtPace.toLocaleString(
                                  'en-US',
                                )}
                              />
                            )}
                          </div>

                          {creditRunway.confidence === 'low' && (
                            <div className="mt-2.5 flex items-start gap-1.5 rounded-md bg-amber-500/10 border border-amber-500/25 px-2 py-1.5 text-[10px] text-amber-700 dark:text-amber-300">
                              <AlertCircle className="h-3 w-3 mt-[1px] shrink-0" />
                              <span className="leading-snug">
                                {tx('Sparse usage history — treat this as a rough guide, not a guarantee.')}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        /* Cold-start state — no burn history yet. Stripe's
                           own dashboard shows a calm neutral copy here rather
                           than guessing. */
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-[#635bff]/10 border border-[#635bff]/20 flex items-center justify-center">
                            <Gauge className="h-4 w-4 text-[#635bff] dark:text-[#a5a0ff]" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold text-foreground">
                              {tx('Not enough history yet')}
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                              {t('No net spend on this key in the last', '该密钥在过去')}{' '}
                              {creditRunway.windowDays}{' '}
                              {t('days. Balance after top-up will be', '天内无净消耗。充值后余额为')}{' '}
                              <strong className="text-foreground tabular-nums font-semibold">
                                {formatCents(creditRunway.balanceAfterCents)}
                              </strong>
                              .
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* 2. Payment method picker — matches Stripe Payment Element:
                 Express checkout at top, "Or pay with card" divider, cards below. */}
            <section className="space-y-3">
              {/* Express checkout (credits flow only — no wallet makes sense
                  in add-payment-method, since only cards save) */}
              {mode === 'add-credits' && (
                <div>
                  <MethodGroupLabel>{tx('Express checkout')}</MethodGroupLabel>
                  <div className="grid grid-cols-2 gap-2">
                    <MethodRow
                      checked={method === 'apple'}
                      onSelect={() => setMethod('apple')}
                      leading={
                        <div className="h-5 w-8 rounded bg-black flex items-center justify-center">
                          <AppleMark className="text-white" />
                        </div>
                      }
                      title="Apple Pay"
                      subtitle={tx('Authorize with Face ID or Touch ID')}
                    />
                    <MethodRow
                      checked={method === 'google'}
                      onSelect={() => setMethod('google')}
                      leading={
                        <div className="h-5 w-8 rounded bg-white border border-border flex items-center justify-center">
                          <GoogleMark />
                        </div>
                      }
                      title="Google Pay"
                      subtitle={tx('Pay with your Google account')}
                    />
                    <MethodRow
                      checked={method === 'link'}
                      onSelect={() => setMethod('link')}
                      leading={
                        <div className="h-5 w-8 rounded bg-[#00d66f] flex items-center justify-center">
                          <LinkMark className="text-black" />
                        </div>
                      }
                      title="Link"
                      subtitle={tx('One-click checkout by Stripe')}
                    />
                    <MethodRow
                      checked={method === 'paypal'}
                      onSelect={() => setMethod('paypal')}
                      leading={
                        <div className="h-5 w-8 rounded bg-[#003087] flex items-center justify-center">
                          <PayPalMark />
                        </div>
                      }
                      title="PayPal"
                      subtitle={tx('Pay with your PayPal balance or linked card')}
                    />
                    <MethodRow
                      checked={method === 'cashapp'}
                      onSelect={() => setMethod('cashapp')}
                      leading={
                        <div className="h-5 w-8 rounded bg-[#00d632] flex items-center justify-center">
                          <CashAppMark />
                        </div>
                      }
                      title="Cash App Pay"
                      subtitle={tx('Scan a QR code from the Cash App')}
                    />
                    <MethodRow
                      checked={method === 'amazon'}
                      onSelect={() => setMethod('amazon')}
                      leading={
                        <div className="h-5 w-8 rounded bg-[#ff9900] flex items-center justify-center">
                          <AmazonMark />
                        </div>
                      }
                      title="Amazon Pay"
                      subtitle={tx('Use addresses and cards from your Amazon account')}
                    />
                  </div>
                </div>
              )}

              {/* Divider — matches Stripe Payment Element */}
              {mode === 'add-credits' && (
                <div className="flex items-center gap-3 py-0.5">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {tx('Or pay with card')}
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>
              )}

              {/* Cards group */}
              <div>
                {mode === 'add-payment-method' && (
                  <MethodGroupLabel>{tx('Credit or debit card')}</MethodGroupLabel>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {savedCards.map((c) => {
                    const k = `saved:${c.id}` as MethodKey;
                    return (
                      <MethodRow
                        key={c.id}
                        checked={method === k}
                        onSelect={() => setMethod(k)}
                        leading={<CardBrandBadge brand={c.brand} />}
                        title={
                          <>
                            {c.brand.toUpperCase()} •••• {c.last4}
                            {c.isDefault && (
                              <span className="ml-2 text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
                                {tx('Default')}
                              </span>
                            )}
                          </>
                        }
                        subtitle={`${tx('Expires')} ${String(c.expMonth).padStart(2, '0')}/${String(c.expYear).slice(-2)}`}
                      />
                    );
                  })}

                  <MethodRow
                    fullWidth={savedCards.length % 2 === 0}
                    checked={method === 'new-card'}
                    onSelect={() => setMethod('new-card')}
                    leading={
                      <div className="h-5 w-8 rounded border border-dashed border-border flex items-center justify-center">
                        <Plus className="h-3 w-3 text-muted-foreground" />
                      </div>
                    }
                    title={savedCards.length === 0 ? tx('New card') : tx('Use a different card')}
                    subtitle="Visa, Mastercard, Amex"
                  />
                </div>
              </div>

              {/* Bank transfer (credits only, US businesses). Kept below the
                   card list because it's a lower-conversion option — we still
                   surface it prominently for enterprise buyers who need to
                   route large amounts via Finance. */}
              {mode === 'add-credits' && (
                <div>
                  <div className="flex items-center gap-3 py-0.5">
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {tx('Or pay by bank')}
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  <MethodGroupLabel>{tx('Bank transfer · US')}</MethodGroupLabel>
                  <div className="grid grid-cols-2 gap-2">
                    <MethodRow
                      checked={method === 'ach'}
                      onSelect={() => setMethod('ach')}
                      disabled={effectiveCents < BANK_TRANSFER_MIN_CENTS}
                      leading={
                        <div className="h-5 w-8 rounded bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
                          <Landmark className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                        </div>
                      }
                      title={tx('ACH direct debit')}
                      subtitle={
                        effectiveCents < BANK_TRANSFER_MIN_CENTS
                          ? `${tx('Minimum')} ${formatCents(BANK_TRANSFER_MIN_CENTS)} ${tx('— increase amount to enable')}`
                          : tx('US bank account · $0.80 flat fee · settles in 3–4 business days')
                      }
                    />
                    <MethodRow
                      checked={method === 'wire'}
                      onSelect={() => setMethod('wire')}
                      disabled={effectiveCents < BANK_TRANSFER_MIN_CENTS}
                      leading={
                        <div className="h-5 w-8 rounded bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                          <Building2 className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                        </div>
                      }
                      title={tx('Wire transfer')}
                      subtitle={
                        effectiveCents < BANK_TRANSFER_MIN_CENTS
                          ? `${tx('Minimum')} ${formatCents(BANK_TRANSFER_MIN_CENTS)} ${tx('— increase amount to enable')}`
                          : tx('Bank-to-bank · settles same-day · no processing fee')
                      }
                    />
                  </div>
                </div>
              )}
            </section>

            {/* 3. Method-specific details */}
            <section className="rounded-lg border border-border bg-muted/20 p-3">
              {method === 'new-card' && (
                <NewCardPanel
                  cardNumber={cardNumber}
                  setCardNumber={setCardNumber}
                  expiry={expiry}
                  setExpiry={setExpiry}
                  cvc={cvc}
                  setCvc={setCvc}
                  cardName={cardName}
                  setCardName={setCardName}
                  country={country}
                  setCountry={setCountry}
                  postal={postal}
                  setPostal={setPostal}
                  saveCard={saveCard}
                  setSaveCard={setSaveCard}
                  brand={brand}
                  showSaveCard={mode === 'add-credits'}
                />
              )}

              {method.startsWith('saved:') && selectedSavedCard && (
                <SavedCardPanel card={selectedSavedCard} />
              )}

              {method === 'apple' && (
                <WalletPanel
                  kind="apple"
                  authorized={walletAuthorized}
                  authorizing={walletAuthorizing}
                  onAuthorize={simulateWalletAuth}
                  backing={WALLET_BACKING.apple}
                />
              )}

              {method === 'google' && (
                <WalletPanel
                  kind="google"
                  authorized={walletAuthorized}
                  authorizing={walletAuthorizing}
                  onAuthorize={simulateWalletAuth}
                  backing={WALLET_BACKING.google}
                />
              )}

              {method === 'cashapp' && (
                <CashAppPanel
                  authorized={walletAuthorized}
                  authorizing={walletAuthorizing}
                  onAuthorize={simulateWalletAuth}
                  handle={CASHAPP_BACKING.handle}
                />
              )}

              {method === 'paypal' && (
                <PayPalPanel
                  authorized={walletAuthorized}
                  authorizing={walletAuthorizing}
                  onAuthorize={simulateWalletAuth}
                  email={PAYPAL_BACKING.email}
                />
              )}

              {method === 'amazon' && (
                <AmazonPanel
                  authorized={walletAuthorized}
                  authorizing={walletAuthorizing}
                  onAuthorize={simulateWalletAuth}
                  backing={WALLET_BACKING.amazon}
                />
              )}

              {method === 'link' && (
                <LinkPanel
                  email={receiptEmail}
                  setEmail={setReceiptEmail}
                  step={linkStep}
                  setStep={setLinkStep}
                  code={linkCode}
                  setCode={setLinkCode}
                  backing={LINK_BACKING}
                />
              )}

              {method === 'ach' && (
                <AchPanel
                  name={achName}
                  setName={setAchName}
                  routing={achRouting}
                  setRouting={setAchRouting}
                  account={achAccount}
                  setAccount={setAchAccount}
                  confirm={achConfirm}
                  setConfirm={setAchConfirm}
                  company={achCompany}
                  setCompany={setAchCompany}
                  authorized={achAuthorized}
                  setAuthorized={setAchAuthorized}
                  routingValid={achRoutingValid}
                  accountValid={achAccountValid}
                  matchValid={achMatchValid}
                />
              )}

              {method === 'wire' && (
                <WirePanel
                  amountCents={effectiveCents}
                  keyLabel={targetKey?.maskedSecret?.slice(-8) ?? effectiveKeyId ?? '—'}
                  ack={wireAck}
                  setAck={setWireAck}
                />
              )}
            </section>

            {/* 4. Receipt email */}
            <section>
              <SectionLabel>{tx('Receipt email')}</SectionLabel>
              <input
                type="email"
                value={receiptEmail}
                onChange={(e) => setReceiptEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30"
              />
            </section>

            {/* 5. Itemized summary */}
            {mode === 'add-credits' && (
              <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5 space-y-1.5">
                <SummaryRow label={tx('Subtotal')} value={formatCents(effectiveCents)} />
                <SummaryRow
                  label={tx('Estimated tax')}
                  value={formatCents(taxCents)}
                  muted
                />
                <div className="h-px bg-border" />
                <SummaryRow label={tx('Total due')} value={formatCents(totalCents)} bold />
              </div>
            )}

              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs px-3 py-2">
                  {error}
                </div>
              )}
            </div>

            {/* 6. Sticky footer with the single Pay CTA. Stays pinned to the
                 bottom of the modal so the primary action is always one click
                 away, no matter how tall the method forms (e.g. new card +
                 ACH) grow. The soft top border + shadow separates it from
                 the scrollable content. */}
            <div className="shrink-0 border-t border-border/60 bg-background/95 backdrop-blur-sm px-5 py-4 space-y-2 shadow-[0_-6px_14px_-10px_rgba(17,24,39,0.18)]">
              <button
                type="submit"
                disabled={!formValid || processing}
                className={cn(
                  'group relative w-full h-11 rounded-lg text-white text-sm font-semibold',
                  'bg-[#635bff] shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_1px_2px_rgba(17,24,39,0.08)]',
                  'transition-[transform,box-shadow,background-color] duration-150 ease-out',
                  'hover:bg-[#5148e3] hover:-translate-y-px hover:shadow-[0_4px_14px_-4px_rgba(99,91,255,0.55),0_1px_0_rgba(255,255,255,0.1)_inset]',
                  'active:translate-y-0 active:bg-[#4b43d6] active:shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_1px_2px_rgba(17,24,39,0.12)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#635bff]/60 focus-visible:ring-offset-background',
                  'disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:-translate-y-0 disabled:hover:bg-[#635bff] disabled:hover:shadow-none',
                  'flex items-center justify-center gap-2',
                )}
              >
                {processing ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {tx('Processing…')}
                  </>
                ) : (
                  <>
                    {method === 'ach' || method === 'wire' ? (
                      <Landmark className="h-4 w-4" />
                    ) : (
                      <CreditCard className="h-4 w-4" />
                    )}
                    {mode === 'add-credits'
                      ? method === 'wire'
                        ? `${tx('Get wire instructions')} · ${formatCents(totalCents || 0)}`
                        : method === 'ach'
                          ? `${tx('Pay by ACH')} · ${formatCents(totalCents || 0)}`
                          : `${tx('Pay')} ${formatCents(totalCents || 0)}`
                      : tx('Save payment method')}
                  </>
                )}
              </button>

              <p className="text-[10px] text-muted-foreground text-center leading-relaxed flex items-center justify-center gap-1">
                <Lock className="h-2.5 w-2.5" />
                {tx('Demo checkout — no card is actually charged. Taxes collected via Stripe Tax.')}
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/** Human-readable duration from a fractional day count (runway estimate). */
function formatRunwayDuration(days: number): string {
  if (!Number.isFinite(days) || days <= 0) return '—';
  if (days < 1) return 'less than a day';
  if (days < 14) return `${Math.round(days)} days`;
  if (days < 56) return `${Math.round(days / 7)} weeks`;
  if (days < 730) return `${Math.round(days / 30)} months`;
  return `${(days / 365).toFixed(1)} years`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Shared chevron-down glyph for the native <select> elements used in the
 *  modal's key picker (matches the FilterSelect styling on the billing page). */
function ChevronDownSmall() {
  return (
    <svg
      className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-medium text-muted-foreground mb-2 block">
      {children}
    </label>
  );
}

function MethodGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-2">
      <span>{children}</span>
      <span className="h-px flex-1 bg-border/60" />
    </div>
  );
}

function MethodRow({
  checked,
  onSelect,
  leading,
  title,
  subtitle,
  disabled,
  fullWidth,
}: {
  checked: boolean;
  onSelect: () => void;
  leading: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  disabled?: boolean;
  /** When true, cell spans both columns in a 2-col grid (e.g. lonely "add new" row). */
  fullWidth?: boolean;
}) {
  return (
    <label
      className={cn(
        // h-full makes sibling cells line up to the tallest row inside the
        // 2-col grid so Apple Pay doesn't look shorter than Cash App Pay.
        'group flex h-full items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors',
        fullWidth && 'col-span-2',
        disabled && 'opacity-60 cursor-not-allowed',
        !disabled && 'cursor-pointer',
        checked
          ? 'border-foreground/50 bg-muted/50 ring-1 ring-foreground/10'
          : !disabled && 'border-border hover:bg-muted/30 hover:border-border/80',
        !checked && disabled && 'border-border',
      )}
    >
      <input
        type="radio"
        name="pm"
        className="h-3.5 w-3.5 shrink-0"
        checked={checked}
        disabled={disabled}
        onChange={() => !disabled && onSelect()}
      />
      <div className="shrink-0">{leading}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate">{title}</div>
        {subtitle && (
          // line-clamp-2 instead of truncate: long bank-transfer subtitles
          // need 2 lines in a narrow 2-col cell, otherwise they lose meaning.
          <div className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
            {subtitle}
          </div>
        )}
      </div>
    </label>
  );
}

function NewCardPanel({
  cardNumber,
  setCardNumber,
  expiry,
  setExpiry,
  cvc,
  setCvc,
  cardName,
  setCardName,
  country,
  setCountry,
  postal,
  setPostal,
  saveCard,
  setSaveCard,
  brand,
  showSaveCard,
}: {
  cardNumber: string;
  setCardNumber: (v: string) => void;
  expiry: string;
  setExpiry: (v: string) => void;
  cvc: string;
  setCvc: (v: string) => void;
  cardName: string;
  setCardName: (v: string) => void;
  country: string;
  setCountry: (v: string) => void;
  postal: string;
  setPostal: (v: string) => void;
  saveCard: boolean;
  setSaveCard: (v: boolean) => void;
  brand: CardBrand | 'generic';
  showSaveCard: boolean;
}) {
  const { tx } = useLang();
  return (
    <div className="space-y-3">
      <div>
        <SectionLabel>{tx('Card information')}</SectionLabel>
        <div className="rounded-lg border border-border bg-background focus-within:ring-2 focus-within:ring-ring/20 focus-within:border-foreground/30 overflow-hidden">
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="1234 1234 1234 1234"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              className="w-full h-10 px-3 text-sm bg-transparent focus:outline-none placeholder:text-muted-foreground/40"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <CardBrandMark brand="visa" active={brand === 'visa'} />
              <CardBrandMark brand="mastercard" active={brand === 'mastercard'} />
              <CardBrandMark brand="amex" active={brand === 'amex'} />
            </div>
          </div>
          <div className="grid grid-cols-2 border-t border-border">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM / YY"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              className="h-10 px-3 text-sm bg-transparent focus:outline-none placeholder:text-muted-foreground/40 border-r border-border"
            />
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="CVC"
              value={cvc}
              onChange={(e) =>
                setCvc(
                  e.target.value.replace(/\D/g, '').slice(0, brand === 'amex' ? 4 : 3),
                )
              }
              className="h-10 px-3 text-sm bg-transparent focus:outline-none placeholder:text-muted-foreground/40"
            />
          </div>
        </div>
      </div>

      <div>
        <SectionLabel>{tx('Name on card')}</SectionLabel>
        <input
          type="text"
          autoComplete="cc-name"
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          placeholder={tx('Full name')}
          className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30"
        />
      </div>

      <div>
        <SectionLabel>{tx('Country / postal code')}</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="h-10 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {tx(c.label)}
              </option>
            ))}
          </select>
          <input
            type="text"
            autoComplete="postal-code"
            value={postal}
            onChange={(e) => setPostal(e.target.value.slice(0, 12))}
            placeholder={tx('Postal')}
            className="h-10 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30"
          />
        </div>
      </div>

      {showSaveCard && (
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={saveCard}
            onChange={(e) => setSaveCard(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border"
          />
          <span className="text-xs text-muted-foreground">
            {tx('Save card for future payments')}
          </span>
        </label>
      )}
    </div>
  );
}

function SavedCardPanel({ card }: { card: PaymentMethod }) {
  const { tx } = useLang();
  // Saved cards are already tokenised on Stripe's side. For subsequent
  // off-session charges inside an authenticated dashboard session, no CVC
  // re-prompt is required — Stripe handles SCA / 3DS automatically when the
  // issuer demands it. So we just surface the card for confirmation.
  return (
    <div className="flex items-center gap-3 rounded-lg bg-background border border-border px-3 py-2.5">
      <CardBrandBadge brand={card.brand} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium">
          {card.brand.toUpperCase()} •••• {card.last4}
        </div>
        <div className="text-[10px] text-muted-foreground">
          {tx('Expires')} {String(card.expMonth).padStart(2, '0')}/{String(card.expYear).slice(-2)} ·{' '}
          {card.name}
        </div>
      </div>
      <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
        <ShieldCheck className="h-3.5 w-3.5" /> {tx('Saved securely')}
      </div>
    </div>
  );
}

function WalletPanel({
  kind,
  authorized,
  authorizing,
  onAuthorize,
  backing,
}: {
  kind: 'apple' | 'google';
  authorized: boolean;
  authorizing: boolean;
  onAuthorize: () => void;
  backing: { brand: CardBrand; last4: string };
}) {
  const { tx, t } = useLang();
  const label = kind === 'apple' ? 'Apple Pay' : 'Google Pay';
  const authLabel =
    kind === 'apple' ? tx('Confirm with Face ID / Touch ID') : tx('Continue with Google Pay');
  return (
    <div className="flex flex-col items-center text-center py-2">
      <div
        className={cn(
          'h-10 w-20 rounded-lg flex items-center justify-center mb-3',
          kind === 'apple' ? 'bg-black text-white' : 'bg-white border border-border',
        )}
      >
        {kind === 'apple' ? <AppleMark className="text-white" /> : <GoogleMark />}
      </div>

      {authorized ? (
        <div className="w-full space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <Check className="h-4 w-4" />
            {label} {tx('authorized')}
          </div>
          <div className="mx-auto max-w-[280px] flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left">
            <CardBrandBadge brand={backing.brand} />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium">
                {backing.brand.toUpperCase()} •••• {backing.last4}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {t('From', '来自')} {label} {t('wallet — press Pay to charge this card.', '钱包 — 按「支付」将扣款此卡。')}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-3 max-w-[280px]">
            {t('Authorize', '先授权')} {label} {t('first. Your payment will only be executed when you press the Pay button below.', '。只有按下方的「支付」按钮后才会真正扣款。')}
          </p>
          <button
            type="button"
            onClick={onAuthorize}
            disabled={authorizing}
            className={cn(
              'h-10 px-4 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors',
              kind === 'apple'
                ? 'bg-black text-white hover:bg-neutral-800'
                : 'bg-[#4285f4] text-white hover:bg-[#3872d8]',
              'disabled:opacity-60',
            )}
          >
            {authorizing ? (
              <>
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {tx('Verifying device…')}
              </>
            ) : (
              <>
                <Smartphone className="h-4 w-4" />
                {authLabel}
              </>
            )}
          </button>
          <p className="mt-2 text-[10px] text-muted-foreground max-w-[280px]">
            {t('No card details are shared —', '不会共享卡片详情 —')} {label} {t('returns a tokenised card to Stripe.', '向 Stripe 返回一个令牌化的卡片。')}
          </p>
        </>
      )}
    </div>
  );
}

function CashAppPanel({
  authorized,
  authorizing,
  onAuthorize,
  handle,
}: {
  authorized: boolean;
  authorizing: boolean;
  onAuthorize: () => void;
  handle: string;
}) {
  const { tx } = useLang();
  return (
    <div className="flex flex-col items-center text-center py-2">
      <div className="h-10 w-20 rounded-lg flex items-center justify-center mb-3 bg-[#00d632]">
        <CashAppMark />
      </div>

      {authorized ? (
        <div className="w-full space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <Check className="h-4 w-4" />
            Cash App Pay {tx('authorized')}
          </div>
          <div className="mx-auto max-w-[280px] flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left">
            <div className="h-8 w-10 rounded bg-[#00d632] flex items-center justify-center shrink-0">
              <CashAppMark />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium">Cash App · {handle}</div>
              <div className="text-[10px] text-muted-foreground">
                {tx('Funds will draw from your Cash App balance, then linked debit card if the balance is insufficient.')}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-3 max-w-[280px]">
            {tx('Scan the QR code in your Cash App to approve this payment. Nothing is charged until you press Pay.')}
          </p>
          <button
            type="button"
            onClick={onAuthorize}
            disabled={authorizing}
            className="h-10 px-4 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors bg-[#00d632] text-black hover:bg-[#00c02e] disabled:opacity-60"
          >
            {authorizing ? (
              <>
                <span className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                {tx('Waiting for Cash App…')}
              </>
            ) : (
              <>
                <Smartphone className="h-4 w-4" />
                {tx('Continue with Cash App Pay')}
              </>
            )}
          </button>
          <p className="mt-2 text-[10px] text-muted-foreground max-w-[280px]">
            {tx("Most popular in the US. Settles instantly from the customer's Cash App balance.")}
          </p>
        </>
      )}
    </div>
  );
}

function PayPalPanel({
  authorized,
  authorizing,
  onAuthorize,
  email,
}: {
  authorized: boolean;
  authorizing: boolean;
  onAuthorize: () => void;
  email: string;
}) {
  const { tx } = useLang();
  return (
    <div className="flex flex-col items-center text-center py-2">
      <div className="h-10 w-20 rounded-lg flex items-center justify-center mb-3 bg-[#003087]">
        <PayPalMark />
      </div>

      {authorized ? (
        <div className="w-full space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <Check className="h-4 w-4" />
            PayPal {tx('authorized')}
          </div>
          <div className="mx-auto max-w-[280px] flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left">
            <div className="h-8 w-10 rounded bg-[#003087] flex items-center justify-center shrink-0">
              <PayPalMark />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium">PayPal · {email}</div>
              <div className="text-[10px] text-muted-foreground">
                {tx('Funds will draw from your PayPal balance, then linked card. A confirmation email will be sent to your PayPal address.')}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-3 max-w-[280px]">
            {tx("You'll be redirected to PayPal to approve this payment. Nothing is charged until you press Pay here.")}
          </p>
          <button
            type="button"
            onClick={onAuthorize}
            disabled={authorizing}
            className="h-10 px-4 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors bg-[#ffc439] text-[#003087] hover:bg-[#f5b928] disabled:opacity-60"
          >
            {authorizing ? (
              <>
                <span className="h-4 w-4 border-2 border-[#003087]/30 border-t-[#003087] rounded-full animate-spin" />
                {tx('Redirecting to PayPal…')}
              </>
            ) : (
              <>
                <PayPalMark />
                {tx('Continue with PayPal')}
              </>
            )}
          </button>
          <p className="mt-2 text-[10px] text-muted-foreground max-w-[280px]">
            {tx('Trusted by hundreds of millions of shoppers across 200+ countries.')}
          </p>
        </>
      )}
    </div>
  );
}

function AmazonPanel({
  authorized,
  authorizing,
  onAuthorize,
  backing,
}: {
  authorized: boolean;
  authorizing: boolean;
  onAuthorize: () => void;
  backing: { brand: CardBrand; last4: string };
}) {
  const { tx } = useLang();
  return (
    <div className="flex flex-col items-center text-center py-2">
      <div className="h-10 w-20 rounded-lg flex items-center justify-center mb-3 bg-[#ff9900]">
        <AmazonMark />
      </div>

      {authorized ? (
        <div className="w-full space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <Check className="h-4 w-4" />
            Amazon Pay {tx('authorized')}
          </div>
          <div className="mx-auto max-w-[280px] flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left">
            <CardBrandBadge brand={backing.brand} />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium">
                {backing.brand.toUpperCase()} •••• {backing.last4}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {tx('From your Amazon account — press Pay to charge this card.')}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-3 max-w-[280px]">
            {tx('Use the shipping and payment details from your Amazon account. Nothing is charged until you press Pay here.')}
          </p>
          <button
            type="button"
            onClick={onAuthorize}
            disabled={authorizing}
            className="h-10 px-4 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors bg-[#ff9900] text-black hover:bg-[#f08c00] disabled:opacity-60"
          >
            {authorizing ? (
              <>
                <span className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                {tx('Connecting to Amazon…')}
              </>
            ) : (
              <>
                <AmazonMark />
                {tx('Continue with Amazon Pay')}
              </>
            )}
          </button>
          <p className="mt-2 text-[10px] text-muted-foreground max-w-[280px]">
            {tx('No card details are shared — Amazon returns a tokenised card to Stripe.')}
          </p>
        </>
      )}
    </div>
  );
}

function LinkPanel({
  email,
  setEmail,
  step,
  setStep,
  code,
  setCode,
  backing,
}: {
  email: string;
  setEmail: (v: string) => void;
  step: 'idle' | 'sending' | 'code-sent';
  setStep: (v: 'idle' | 'sending' | 'code-sent') => void;
  code: string;
  setCode: (v: string) => void;
  backing: { brand: CardBrand; last4: string };
}) {
  const { tx } = useLang();
  const emailValid = /.+@.+\..+/.test(email);
  const codeValid = /^\d{6}$/.test(code);

  async function handleSendCode() {
    if (!emailValid || step !== 'idle') return;
    setStep('sending');
    await new Promise((r) => setTimeout(r, 700));
    setStep('code-sent');
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[11px] text-foreground/80">
        <div className="h-5 w-8 rounded bg-[#00d66f] flex items-center justify-center shrink-0">
          <LinkMark className="text-black" />
        </div>
        <span className="text-muted-foreground">
          {tx("Link is Stripe's 1-click checkout. Verify your email once — after that your cards auto-fill across any Stripe site.")}
        </span>
      </div>

      {/* Step 1: email → send code */}
      <div>
        <SectionLabel>{tx('Link email')}</SectionLabel>
        <div className="flex items-stretch gap-2">
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (step !== 'idle') setStep('idle');
              if (code) setCode('');
            }}
            placeholder="you@example.com"
            className="flex-1 h-10 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30"
          />
          <button
            type="button"
            onClick={handleSendCode}
            disabled={!emailValid || step !== 'idle'}
            className="h-10 px-3 rounded-lg text-xs font-semibold border border-border bg-background hover:bg-muted/40 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {step === 'sending'
              ? tx('Sending…')
              : step === 'code-sent'
                ? tx('Code sent')
                : tx('Send code')}
          </button>
        </div>
      </div>

      {/* Step 2: OTP (unlocks only after code is sent) */}
      {step === 'code-sent' && (
        <div>
          <SectionLabel>{tx('6-digit code')}</SectionLabel>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            className="w-40 h-10 px-3 text-sm tracking-[0.4em] text-center rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30"
          />
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            {tx('We sent a code to')} <span className="font-medium">{email}</span>. {tx('Demo: any 6 digits work.')}
          </p>
        </div>
      )}

      {/* Step 3: card preview once OTP is valid */}
      {codeValid && (
        <div className="flex items-center gap-2 rounded-lg border border-[#00d66f]/40 bg-[#00d66f]/10 px-3 py-2">
          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="flex-1 min-w-0 text-[11px]">
            <div className="font-medium">
              {tx('Paying with')} {backing.brand.toUpperCase()} •••• {backing.last4}
            </div>
            <div className="text-muted-foreground">
              {tx('Default card on your Link account.')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RunwayStat({
  icon,
  label,
  value,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
        <span className="text-muted-foreground/70">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-0.5 text-[13px] font-semibold text-foreground tabular-nums leading-tight flex items-baseline gap-0.5 truncate">
        <span className="truncate">{value}</span>
        {suffix && (
          <span className="text-[10px] font-normal text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold,
  muted,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between text-xs',
        bold && 'text-sm font-semibold',
        muted && 'text-muted-foreground',
      )}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function AppleMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('h-3.5 w-3.5', className)}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M16.365 1.43c0 1.14-.465 2.19-1.22 2.97-.815.85-2.155 1.51-3.255 1.42-.14-1.12.415-2.27 1.175-3.01.85-.82 2.32-1.44 3.3-1.38zM20.5 17.74c-.56 1.29-.83 1.87-1.55 3.02-1 1.59-2.41 3.57-4.16 3.58-1.55.02-1.96-1.02-4.07-1-2.11.02-2.56 1.02-4.12 1-1.75-.02-3.08-1.82-4.08-3.41C-.02 17.3-.22 11.87 2.6 8.95c1.38-1.43 3.2-2.29 5.07-2.29 1.93 0 3.15 1.07 4.76 1.07 1.57 0 2.52-1.07 4.76-1.07 1.65 0 3.42.9 4.68 2.45-4.11 2.27-3.45 8.28-1.37 8.63z" />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        fill="#4285f4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34a853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.85 0-5.27-1.93-6.13-4.52H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#fbbc05"
        d="M5.87 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.05H2.18C1.43 8.55 1 10.23 1 12s.43 3.45 1.18 4.95l3.69-2.84z"
      />
      <path
        fill="#ea4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.69 2.84C6.73 7.31 9.15 5.38 12 5.38z"
      />
    </svg>
  );
}

function CashAppMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="white"
      aria-hidden="true"
    >
      {/* Stylised $ — matches the Cash App wordmark's single glyph */}
      <path d="M15.5 8.05a.6.6 0 0 0 .85.05l.98-.85a.68.68 0 0 0 .05-.95c-.85-.97-2.02-1.56-3.4-1.73l.13-.55a.6.6 0 0 0-.6-.77h-1.1a.6.6 0 0 0-.6.48l-.14.6c-2.25.12-4.1 1.48-4.1 3.62 0 2.02 1.55 2.86 3.2 3.43l1.35.48c1.1.38 1.6.76 1.6 1.37 0 .71-.77 1.18-1.94 1.18-1.07 0-2.17-.36-2.98-1.2a.6.6 0 0 0-.87 0l-.96.95a.65.65 0 0 0 .02.95c.84.8 1.9 1.37 3.07 1.6l-.15.58a.6.6 0 0 0 .6.77h1.1a.6.6 0 0 0 .6-.49l.14-.62c2.58-.16 4.36-1.65 4.36-3.82 0-1.86-1.21-2.77-3.1-3.46l-1.26-.46c-.9-.32-1.77-.58-1.77-1.24 0-.68.79-1.11 1.74-1.11.89 0 1.75.34 2.44.88.04.04.1.07.15.08z" />
    </svg>
  );
}

function PayPalMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      aria-hidden="true"
    >
      {/* Simplified PayPal double-P monogram in white-on-blue */}
      <path
        fill="#fff"
        d="M8.25 5h6.4c2.67 0 4.6 1.35 4.26 4.05-.37 3-2.55 4.53-5.33 4.53h-1.7a.72.72 0 0 0-.71.62l-.62 3.85a.55.55 0 0 1-.54.47H7.33a.45.45 0 0 1-.45-.52l2-12.5a.72.72 0 0 1 .7-.62z"
      />
      <path
        fill="#ffc439"
        d="M6.2 7.7h6.4c2.67 0 4.6 1.35 4.26 4.05-.37 3-2.55 4.53-5.33 4.53h-1.7a.72.72 0 0 0-.71.62l-.62 3.85a.55.55 0 0 1-.54.47H5.28a.45.45 0 0 1-.45-.52L6.83 8.2a.72.72 0 0 1 .7-.5z"
        opacity="0.35"
      />
    </svg>
  );
}

function AmazonMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="white"
      aria-hidden="true"
    >
      {/* Simplified Amazon "a" with smile — recognisable at 14px */}
      <path d="M14.34 11.62c0 .84-.02 1.54-.44 2.28-.34.61-.88.98-1.48.98-.82 0-1.3-.62-1.3-1.54 0-1.82 1.63-2.15 3.22-2.15v.43zm2.16 5.22a.46.46 0 0 1-.52.05c-.73-.6-.86-.88-1.27-1.46-1.22 1.24-2.08 1.61-3.66 1.61-1.87 0-3.33-1.16-3.33-3.47 0-1.81 1-3.04 2.4-3.64 1.21-.54 2.9-.63 4.2-.77V9.3c0-.53.05-1.16-.27-1.62-.28-.4-.81-.57-1.29-.57-.87 0-1.65.45-1.84 1.37a.42.42 0 0 1-.35.37l-1.94-.21a.36.36 0 0 1-.3-.42c.44-2.37 2.59-3.09 4.5-3.09.98 0 2.27.26 3.04.99.99.91.89 2.12.89 3.45v3.13c0 .94.39 1.35.76 1.86.13.18.16.4-.01.54-.41.34-1.14.98-1.54 1.33zM18.93 17.86c-3.05 2.25-7.47 3.45-11.27 3.45-5.33 0-10.13-1.97-13.77-5.25-.29-.26-.03-.61.31-.41 3.92 2.28 8.77 3.65 13.78 3.65 3.38 0 7.09-.7 10.51-2.15.51-.22.94.33.44.71z M20.2 16.58c-.39-.5-2.58-.24-3.57-.12-.3.04-.35-.22-.07-.42 1.75-1.23 4.6-.87 4.93-.46.34.41-.09 3.27-1.72 4.63-.25.21-.49.1-.38-.18.38-.94 1.21-3.04.81-3.45z" />
    </svg>
  );
}

function LinkMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('h-3.5 w-3.5', className)}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-2 14H7v-3h3v3zm0-5H7V8h3v3zm4 5h-3V8h3v8z" />
    </svg>
  );
}

function CardBrandBadge({ brand }: { brand: CardBrand }) {
  const label = brand === 'amex' ? 'AMEX' : brand === 'visa' ? 'VISA' : 'MC';
  return (
    <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded border border-border bg-background">
      {label}
    </span>
  );
}

function CardBrandMark({
  brand,
  active,
}: {
  brand: 'visa' | 'mastercard' | 'amex';
  active: boolean;
}) {
  const label = brand === 'amex' ? 'AMEX' : brand === 'visa' ? 'VISA' : 'MC';
  return (
    <span
      className={cn(
        'text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded border transition-opacity',
        active ? 'opacity-100 border-foreground/40' : 'opacity-30 border-border',
      )}
    >
      {label}
    </span>
  );
}

function AchPanel({
  name,
  setName,
  routing,
  setRouting,
  account,
  setAccount,
  confirm,
  setConfirm,
  company,
  setCompany,
  authorized,
  setAuthorized,
  routingValid,
  accountValid,
  matchValid,
}: {
  name: string;
  setName: (v: string) => void;
  routing: string;
  setRouting: (v: string) => void;
  account: string;
  setAccount: (v: string) => void;
  confirm: string;
  setConfirm: (v: string) => void;
  company: string;
  setCompany: (v: string) => void;
  authorized: boolean;
  setAuthorized: (v: boolean) => void;
  routingValid: boolean;
  accountValid: boolean;
  matchValid: boolean;
}) {
  const { tx } = useLang();
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-md bg-sky-500/5 border border-sky-500/20 px-2.5 py-2 text-[11px] text-sky-700 dark:text-sky-300">
        <Landmark className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>
          {tx("You're authorizing a one-time ACH debit for this top-up. Funds typically settle in 3–4 business days; credits are applied once confirmed. US bank accounts only.")}
        </span>
      </div>

      <Field label={tx('Account holder name')}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={tx('As shown on your bank statement')}
          className="w-full h-9 px-3 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30"
        />
      </Field>

      <Field label={tx('Company name (optional)')}>
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Acme, Inc."
          className="w-full h-9 px-3 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30"
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label={tx('Routing number')}>
          <input
            inputMode="numeric"
            value={routing}
            onChange={(e) => setRouting(e.target.value.replace(/\D/g, '').slice(0, 9))}
            placeholder="110000000"
            className={cn(
              'w-full h-9 px-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30',
              routing.length > 0 && !routingValid
                ? 'border-red-500/60'
                : 'border-border',
            )}
          />
          <div className="text-[10px] text-muted-foreground mt-1">{tx('9 digits')}</div>
        </Field>
        <Field label={tx('Account number')}>
          <input
            inputMode="numeric"
            value={account}
            onChange={(e) => setAccount(e.target.value.replace(/\D/g, '').slice(0, 17))}
            placeholder="000123456789"
            className={cn(
              'w-full h-9 px-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30',
              account.length > 0 && !accountValid
                ? 'border-red-500/60'
                : 'border-border',
            )}
          />
          <div className="text-[10px] text-muted-foreground mt-1">{tx('4–17 digits')}</div>
        </Field>
      </div>

      <Field label={tx('Confirm account number')}>
        <input
          inputMode="numeric"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value.replace(/\D/g, '').slice(0, 17))}
          placeholder={tx('Re-enter to confirm')}
          className={cn(
            'w-full h-9 px-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30',
            confirm.length > 0 && !matchValid
              ? 'border-red-500/60'
              : 'border-border',
          )}
        />
        {confirm.length > 0 && !matchValid && (
          <div className="text-[10px] text-red-500 mt-1">{tx("Account numbers don't match")}</div>
        )}
      </Field>

      <label className="flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed cursor-pointer">
        <input
          type="checkbox"
          checked={authorized}
          onChange={(e) => setAuthorized(e.target.checked)}
          className="h-3.5 w-3.5 mt-0.5 shrink-0"
        />
        <span>
          {tx('I authorize Chivox, Inc. and Stripe, its authorized representative, to debit the account indicated above for the amount shown. This authorization will remain in effect until I notify you in writing to cancel it.')}
        </span>
      </label>
    </div>
  );
}

function WirePanel({
  amountCents,
  keyLabel,
  ack,
  setAck,
}: {
  amountCents: number;
  keyLabel: string;
  ack: boolean;
  setAck: (v: boolean) => void;
}) {
  const { tx } = useLang();
  // Deterministic reference ID derived from the key label — stable across
  // renders so the user can copy-paste safely into their bank's wire form.
  // Real wires require the reference in the memo so Stripe can reconcile.
  const reference = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < keyLabel.length; i++) {
      hash = (hash * 31 + keyLabel.charCodeAt(i)) >>> 0;
    }
    const suffix = String(hash % 900000 + 100000);
    return `CHX-${keyLabel.slice(-6).toUpperCase()}-${suffix}`;
  }, [keyLabel]);

  const instructions = [
    { label: tx('Beneficiary'), value: 'Chivox, Inc.' },
    { label: tx('Bank name'), value: 'JPMorgan Chase Bank, N.A.' },
    { label: tx('Bank address'), value: '383 Madison Avenue, New York, NY 10017' },
    { label: tx('Routing (ABA)'), value: '021000021' },
    { label: 'SWIFT / BIC', value: 'CHASUS33' },
    { label: tx('Account number'), value: '987654321098' },
    { label: tx('Reference / memo'), value: reference, highlight: true },
    { label: tx('Amount'), value: formatCents(amountCents), bold: true },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-md bg-indigo-500/5 border border-indigo-500/20 px-2.5 py-2 text-[11px] text-indigo-700 dark:text-indigo-300">
        <Building2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>
          {tx("Initiate a wire from your bank using the details below. Credits will be applied once funds land (usually same-day domestic, 1–3 days international). We'll email the full instructions and a PDF to your receipt email.")}
        </span>
      </div>

      <div className="rounded-md border border-border bg-background divide-y divide-border">
        {instructions.map((row) => (
          <WireRow key={row.label} {...row} />
        ))}
      </div>

      <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-2.5 py-2 text-[11px] text-amber-800 dark:text-amber-300">
        <strong className="font-semibold">{tx('Important:')}</strong> {tx('You must include the reference number in the wire memo so we can credit the correct account. Wires without a reference are held for manual review for up to 5 business days.')}
      </div>

      <label className="flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed cursor-pointer">
        <input
          type="checkbox"
          checked={ack}
          onChange={(e) => setAck(e.target.checked)}
          className="h-3.5 w-3.5 mt-0.5 shrink-0"
        />
        <span>
          {tx("I'll initiate this wire from my bank and include the reference above. I understand credits are not applied until funds are received.")}
        </span>
      </label>
    </div>
  );
}

function WireRow({
  label,
  value,
  highlight,
  bold,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  bold?: boolean;
}) {
  const { tx } = useLang();
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    });
  };

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0 w-28">
        {label}
      </div>
      <div
        className={cn(
          'flex-1 text-xs font-mono truncate',
          bold && 'font-semibold text-sm',
          highlight &&
            'inline-flex items-center px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30',
        )}
      >
        {value}
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
        aria-label={tx('Copy')}
      >
        {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </div>
      {children}
    </div>
  );
}
