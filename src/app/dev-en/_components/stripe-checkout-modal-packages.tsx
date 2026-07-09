'use client';

import {
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Crown,
  FileText,
  Landmark,
  Lock,
  Mail,
  MessageSquareText,
  Pencil,
  Plus,
  Receipt,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { cn } from '@/lib/utils';
import {
  addTransaction,
  formatCents,
  getAccountBalanceCents,
  topupAccount,
  type CardBrand,
  type PaymentMethod,
  type Transaction,
} from '../_lib/mock-store';
import { useMockAuth } from '../_lib/mock-auth';
import { useLang } from '../_lib/use-lang';
import {
  BASE_POINTS_PER_USD,
  PARAGRAPH_POINTS_PER_USE,
  TOPUP_BONUS_TIERS,
  TRIAL_VALID_DAYS,
  WORD_SENTENCE_POINTS_PER_USE,
  buildTopupPointDetails,
  formatEvaluationUnitDollars,
  formatWalletPoints,
  getTopupBonusTier,
  quoteTopup,
  type TopupBonusTier,
  type TopupQuote,
} from '../_lib/topup';
import { billing, describeError } from '../_lib/api';
import { hydrateFromApi } from '../_lib/mock-store-bridge';
import { usePaymentConfig } from '../_lib/payment-config';

interface StripeCheckoutModalPackagesProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (txn: Transaction) => void;
  /** Accepted for back-compat; wallet top-ups are account-wide. */
  keyId?: string;
  /** Dev/compare: return to the checkout version picker. */
  onSwitchVariant?: () => void;
}

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

type BuyerMode = 'personal' | 'business';

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
const SALES_EMAIL = 'ming.zhao@chivox.com';

function pointPricingSummary(
  t: (en: string, zh: string) => string,
  tier: TopupBonusTier = TOPUP_BONUS_TIERS[0],
): string {
  const details = buildTopupPointDetails(tier.minCents, tier);
  const wordSentencePrice = formatEvaluationUnitDollars(WORD_SENTENCE_POINTS_PER_USE, Number(details.pointsPerUsd));
  const paragraphPrice = formatEvaluationUnitDollars(PARAGRAPH_POINTS_PER_USE, Number(details.pointsPerUsd));
  return t(
    `Word / sentence from ${wordSentencePrice}/use · paragraph from ${paragraphPrice}/use`,
    `字/句低至 ${wordSentencePrice}/次 · 段落低至 ${paragraphPrice}/次`,
  );
}

function walletPointsLabel(
  amountCents: number,
  t: (en: string, zh: string) => string,
  tier?: TopupBonusTier,
): string {
  const points = tier
    ? buildTopupPointDetails(amountCents, tier).walletPoints
    : formatWalletPoints(amountCents);
  return `${points} ${t('eval pts', '评测点')}`;
}

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

export function StripeCheckoutModalPackages({
  open,
  onClose,
  onSuccess,
  onSwitchVariant,
}: StripeCheckoutModalPackagesProps) {
  // Gate so the inner component fully unmounts between opens, guaranteeing
  // fresh `useState` lazy initializers every time the modal appears.
  if (!open) return null;
  return (
    <OpenedCheckoutModal
      onClose={onClose}
      onSuccess={onSuccess}
      onSwitchVariant={onSwitchVariant}
    />
  );
}

function OpenedCheckoutModal({
  onClose,
  onSuccess,
  onSwitchVariant,
}: Omit<StripeCheckoutModalPackagesProps, 'open' | 'keyId'>) {
  const { tx, t } = useLang();
  const { user } = useMockAuth();
  const { paypalClientId } = usePaymentConfig();

  // Account-wallet top-up: PayPal only (no card-on-file in this product).
  const [method] = useState<MethodKey>('paypal');

  // Account-wallet top-up: user picks a dollar amount and sees the
  // wallet points that amount will fund.
  const [amountCents, setAmountCents] = useState<number>(TOPUP_BONUS_TIERS[0].minCents);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedBonusTierId, setSelectedBonusTierId] =
    useState<TopupBonusTier['id']>(TOPUP_BONUS_TIERS[0].id);
  const [buyerMode, setBuyerMode] = useState<BuyerMode>('personal');

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
  const paypalOrderCounter = useRef(0);

  // 2-step wizard for `add-credits`:
  //   Step 1 — choose top-up amount (preset chips or custom dollars)
  //   Step 2 — confirm details and pay securely with PayPal
  type Step = 1 | 2;
  const [step, setStep] = useState<Step>(1);

  const effectiveCents = useMemo(() => {
    if (customAmount.trim()) {
      // Accept "50", "50.00", "$50" — strip non-digit/decimal, parse as
      // dollars, convert to cents.
      const cleaned = customAmount.replace(/[^0-9.]/g, '');
      const dollars = parseFloat(cleaned);
      if (!Number.isFinite(dollars) || dollars <= 0) return 0;
      return Math.round(dollars * 100);
    }
    return amountCents;
  }, [customAmount, amountCents]);

  const quote: TopupQuote = useMemo(
    () => quoteTopup(effectiveCents),
    [effectiveCents],
  );
  const selectedBonusTier =
    TOPUP_BONUS_TIERS.find((tier) => tier.id === selectedBonusTierId) ?? TOPUP_BONUS_TIERS[0];
  const taxCents = 0;
  // What the user actually pays.
  const totalCents = effectiveCents + taxCents;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !processing) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [processing, onClose]);

  // Validation per method
  const brand = detectBrand(cardNumber);
  const cardDigits = cardNumber.replace(/\s/g, '');
  const cardValid = cardDigits.length >= 15;
  const expiryValid = /^\d{2}\s\/\s\d{2}$/.test(expiry);
  const cvcValid = /^\d{3,4}$/.test(cvc);
  const nameValid = cardName.trim().length > 1;
  const newCardValid = cardValid && expiryValid && cvcValid && nameValid;
  const linkCodeValid = linkStep === 'code-sent' && /^\d{6}$/.test(linkCode);
  // Account-wallet model: top-up just needs a positive dollar amount above
  // the selected bonus tier's minimum.
  const amountValid = effectiveCents >= selectedBonusTier.minCents;
  // No per-key key selection in the wallet model.
  const keyValid = true;

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
    if (
      method === 'apple' ||
      method === 'google' ||
      method === 'cashapp' ||
      method === 'amazon'
    ) {
      return walletAuthorized;
    }
    if (method === 'link') return linkCodeValid;
    // PayPal approval happens inside the PayPal popup; the local gate is just
    // a valid amount.
    if (method === 'paypal') return amountValid;
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
    _pmBrand: CardBrand,
    opts?: { pending?: boolean; descriptionOverride?: string },
  ) {
    const pending = !!opts?.pending;
    const balanceBeforeCents = getAccountBalanceCents();

    // Pending methods (e.g. wire) don't credit until funds settle.
    if (!pending) {
      topupAccount({ baseCents: quote.baseCents });
    }
    const balanceAfterCents = getAccountBalanceCents();

    const baseLabel = formatCents(quote.baseCents);
    const pointsLabel = walletPointsLabel(quote.baseCents, t, selectedBonusTier);
    const baseDesc = `${t('Top-up', '充值')} ${baseLabel} · ${pointsLabel} · ${pointPricingSummary(t, selectedBonusTier)}`;

    const paypalOrderId =
      txnMethod === 'paypal'
        ? `PAYPAL-DEMO-${++paypalOrderCounter.current}`
        : undefined;

    const txn = addTransaction({
      amountCents: totalCents,
      status: pending ? 'pending' : 'succeeded',
      method: txnMethod,
      last4: paidLast4,
      description: opts?.descriptionOverride ?? baseDesc,
      paypalOrderId,
      balanceBeforeCents,
      balanceAfterCents,
      kind: 'credit-topup',
    });

    setProcessing(false);
    setDone(true);
    window.setTimeout(() => {
      onSuccess?.(txn);
      onClose();
    }, 900);
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!formValid || processing) return;
    setError(null);
    setProcessing(true);

    await new Promise((r) => setTimeout(r, 1100));

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
      await finalizeSuccess('cashapp', CASHAPP_BACKING.last4, 'visa');
      return;
    }
    if (method === 'paypal') {
      await finalizeSuccess('paypal', PAYPAL_BACKING.last4, 'visa');
      return;
    }
    if (method === 'amazon') {
      await finalizeSuccess(
        'amazon-pay',
        WALLET_BACKING.amazon.last4,
        WALLET_BACKING.amazon.brand,
      );
      return;
    }
    if (method === 'ach') {
      // ACH direct debit: in real life 3-4 business days, but mock settles
      // immediately so the demo shows credits right away. Last4 comes from
      // the bank account number.
      const last4 = achAccountDigits.slice(-4);
      await finalizeSuccess('ach', last4, 'visa');
      return;
    }
    if (method === 'wire') {
      // Wire: we never actually receive funds in a demo. Mark pending, email
      // the user "instructions", and show a different success screen.
      await finalizeSuccess('wire', '—', 'visa', {
        pending: true,
        descriptionOverride: `Wire ${t('transfer', '转账')} · ${tx('Pending')}`,
      });
      return;
    }
  }

  const modalTitle = tx('Add credits');

  const subtitle = t(
    'Top up via PayPal — credits apply to every key on the account.',
    '通过 PayPal 充值 — 额度对账号下所有 Key 生效。',
  );

  const card = (
      <div className="relative w-full max-w-[640px] max-h-[92vh] flex flex-col rounded-2xl bg-background border border-border shadow-2xl overflow-hidden">
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
          <div className="flex items-center gap-1.5 shrink-0">
            {onSwitchVariant && (
              <button
                type="button"
                onClick={onSwitchVariant}
                disabled={processing}
                className="rounded-md border border-indigo-500/30 bg-indigo-500/[0.08] px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-500/[0.14] transition-colors disabled:opacity-40"
              >
                {t('Switch version', '切换版本')}
              </button>
            )}
            <button
              type="button"
              onClick={() => !processing && onClose()}
              disabled={processing}
              className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40"
              aria-label={tx('Close')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {done ? (
          <div className="px-8 py-12 flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
              <Check className="h-7 w-7 text-emerald-500" strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-semibold mb-1">
              {method === 'wire' ? tx('Wire instructions sent') : tx('Payment successful')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {method === 'wire'
                ? `${t('We emailed wiring instructions to', '我们已将汇款说明发送至')} ${receiptEmail}${t('. Credits will land in your wallet once funds arrive (usually 1–3 business days).', '。款项到账后将立即入账(通常 1–3 个工作日)。')}`
                : `+${walletPointsLabel(quote.totalCents, t, selectedBonusTier)} ${t('credited to your wallet.', '已入账钱包。')} ${pointPricingSummary(t, selectedBonusTier)}. ${t('Charged', '扣款')} ${formatCents(totalCents)}.`}
            </p>
          </div>
        ) : (
          <form
            onSubmit={handlePay}
            className="flex-1 min-h-0 flex flex-col"
          >
            {/* Scrollable content — everything except the Pay footer */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-3">
            <StepIndicator
              step={step}
              onSelectAmount={() => {
                if (processing || step === 1) return;
                setError(null);
                setStep(1);
              }}
            />

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive"
              >
                {error}
              </div>
            )}

            {/* Step 1 — top-up amount picker. The wallet is shared across
                 every key on the account, so the user just picks dollars
                 and we show how many points land. */}
            {step === 1 && (
              <section className="space-y-3">
                <TopupIntroPanel
                  buyerMode={buyerMode}
                  onBuyerModeChange={setBuyerMode}
                />

                {buyerMode === 'personal' ? (
                  <>
                    <SectionLabel>{t('How much to top up?', '充值多少？')}</SectionLabel>

                    <TieredTopupSelector
                      amountCents={amountCents}
                      customAmount={customAmount}
                      effectiveCents={effectiveCents}
                      selectedTier={selectedBonusTier}
                      selectedTierId={selectedBonusTierId}
                      onSelectTier={(tier) => {
                        setSelectedBonusTierId(tier.id);
                        setAmountCents(tier.presetCents[0]);
                        setCustomAmount('');
                      }}
                      onSwitchTierForCustom={(tier) => {
                        setSelectedBonusTierId(tier.id);
                      }}
                      onSelectAmount={(nextCents) => {
                        setAmountCents(nextCents);
                        setCustomAmount('');
                      }}
                      onCustomAmount={(next) => setCustomAmount(next)}
                    />
                  </>
                ) : (
                  <BusinessTopupPanel
                    onUseSelfServe={() => setBuyerMode('personal')}
                  />
                )}
              </section>
            )}

            {/* Step 2 from here on: confirmation details + summary. */}
            {step === 2 && (
              <Step2Recap
                quote={quote}
                tier={selectedBonusTier}
                disabled={processing}
                onEdit={() => {
                  if (processing) return;
                  setError(null);
                  setStep(1);
                }}
              />
            )}

            {/* 3. Method-specific details for legacy methods. The active
                PayPal flow is rendered by the official buttons below. */}
            {step === 2 && method !== 'paypal' && (
            <section className="rounded-lg border border-border bg-muted/20 p-3">
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
                  keyLabel={user?.email?.split('@')[0] ?? 'wallet'}
                  ack={wireAck}
                  setAck={setWireAck}
                />
              )}
            </section>
            )}

            {/* 4. Receipt email */}
            {step === 2 && (
            <section>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <SectionLabel>{tx('Receipt email')}</SectionLabel>
                <span className="text-[10px] text-muted-foreground">
                  {t('Editable', '可修改')}
                </span>
              </div>
              <label className="group flex h-11 items-center gap-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.025] px-3 transition-colors focus-within:border-indigo-500/45 focus-within:bg-indigo-500/[0.045] focus-within:ring-2 focus-within:ring-indigo-500/10">
                <Mail className="h-4 w-4 shrink-0 text-indigo-500/75" />
                <input
                  type="email"
                  value={receiptEmail}
                  onChange={(e) => setReceiptEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/65"
                />
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-500/[0.08] text-indigo-600 transition-colors group-focus-within:bg-indigo-500/[0.14]">
                  <Pencil className="h-3 w-3" />
                </span>
              </label>
            </section>
            )}

            {/* 5. Itemized summary */}
            {step === 2 && (
              <div className="overflow-hidden rounded-xl border border-border bg-background shadow-[0_6px_18px_-18px_rgba(15,23,42,0.45)]">
                <div className="flex items-center justify-between border-b border-border/70 bg-muted/25 px-3.5 py-1.5">
                  <div className="text-[11px] font-semibold">
                    {t('Order summary', '充值明细')}
                  </div>
                  <div className="text-[10px] font-medium text-muted-foreground">
                    USD
                  </div>
                </div>
                <div className="space-y-1.5 px-3.5 py-2">
                  <div className="flex items-center justify-between gap-3 text-[10px] text-muted-foreground">
                    <span>
                      {t('Top-up amount', '充值金额')}{' '}
                      <strong className="font-semibold text-foreground tabular-nums">
                        {formatCents(quote.baseCents)}
                      </strong>
                    </span>
                    <span>
                      {tx('Estimated tax')}{' '}
                      <strong className="font-semibold text-foreground tabular-nums">
                        {formatCents(taxCents)}
                      </strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-emerald-500/[0.06] px-2.5 py-1.5">
                      <div className="text-[10px] font-medium text-emerald-700">
                        {t('Wallet points', '入账评测点')}
                      </div>
                      <div className="text-sm font-bold tabular-nums text-emerald-800">
                        ≈ {walletPointsLabel(quote.totalCents, t, selectedBonusTier)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-indigo-500/[0.06] px-2.5 py-1.5">
                      <div className="text-[10px] font-medium text-indigo-700">
                        {t('Unit pricing', '单次价格')}
                      </div>
                      <div className="text-[11px] font-bold leading-snug text-indigo-800">
                        {pointPricingSummary(t, selectedBonusTier)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-border/70 bg-zinc-50/80 px-3.5 py-2">
                  <span className="text-sm font-semibold">{tx('Total due')}</span>
                  <span className="text-lg font-bold tracking-tight tabular-nums">
                    {formatCents(totalCents)}
                  </span>
                </div>
              </div>
            )}

            </div>

            {/* 6. Sticky footer with the single Pay CTA. Stays pinned to the
                 bottom of the modal so the primary action is always one click
                 away, no matter how tall the method forms (e.g. new card +
                 ACH) grow. The soft top border + shadow separates it from
                 the scrollable content. */}
            <div className="shrink-0 border-t border-border/60 bg-background/95 backdrop-blur-sm px-5 py-4 space-y-2 shadow-[0_-6px_14px_-10px_rgba(17,24,39,0.18)]">
              {/* Step 1: Continue (no payment yet). Step 2: Back + Pay. */}
              {step === 1 && buyerMode === 'business' ? (
                <div className="space-y-2">
                  <a
                    href={`mailto:${SALES_EMAIL}?subject=${encodeURIComponent('Chivox MCP enterprise volume pricing')}`}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.12)_inset] transition-colors hover:bg-emerald-700"
                  >
                    <Mail className="h-4 w-4" />
                    {t('Contact sales', '联系销售')}
                  </a>
                  <button
                    type="button"
                    onClick={() => setBuyerMode('personal')}
                    className="w-full text-center text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t('Prefer self-serve? Top up with card or PayPal →', '更想自助充值？用卡或 PayPal 立即充值 →')}
                  </button>
                </div>
              ) : step === 1 ? (
                <button
                  type="button"
                  disabled={!amountValid || !keyValid}
                  onClick={() => {
                    if (!amountValid || !keyValid) return;
                    setError(null);
                    setStep(2);
                  }}
                  className={cn(
                    'group relative w-full h-11 rounded-lg text-white text-sm font-semibold',
                    'bg-[#635bff] shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_1px_2px_rgba(17,24,39,0.08)]',
                    'transition-[transform,box-shadow,background-color] duration-150 ease-out',
                    'hover:bg-[#5148e3] hover:-translate-y-px hover:shadow-[0_4px_14px_-4px_rgba(99,91,255,0.55),0_1px_0_rgba(255,255,255,0.1)_inset]',
                    'active:translate-y-0 active:bg-[#4b43d6]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#635bff]/60 focus-visible:ring-offset-background',
                    'disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:-translate-y-0 disabled:hover:bg-[#635bff] disabled:hover:shadow-none',
                    'flex items-center justify-center gap-2',
                  )}
                >
                  <span className="flex flex-col items-center leading-tight">
                    <span>
                      {t('Continue', '下一步')} · {formatCents(totalCents || 0)}
                    </span>
                    <span className="text-[11px] font-normal opacity-85 tabular-nums">
                      ≈ {walletPointsLabel(effectiveCents, t, selectedBonusTier)}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold">
                      {tx('Complete your payment securely with PayPal')}
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {tx('Choose an option below. PayPal will open a secure checkout window for you to approve the payment.')}
                    </p>
                  </div>
                  <PayPalTopupButtons
                    amountCents={effectiveCents}
                    disabled={!formValid || processing}
                    onProcessing={setProcessing}
                    onError={(msg) => {
                      setProcessing(false);
                      setError(msg);
                    }}
                    onPaid={() => {
                      setProcessing(false);
                      setDone(true);
                      window.setTimeout(() => onClose(), 1400);
                    }}
                  />
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => {
                      if (processing) return;
                      setError(null);
                      setStep(1);
                    }}
                    className="w-full h-9 rounded-lg border border-zinc-200/80 bg-zinc-100/80 text-xs font-medium text-zinc-500 transition-colors hover:border-zinc-300 hover:bg-zinc-200/75 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t('Cancel payment', '取消支付')}
                  </button>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground text-center leading-relaxed flex items-center justify-center gap-1">
                <Lock className="h-2.5 w-2.5" />
                {step === 1 && buyerMode === 'business'
                  ? t(
                      'Invoice / PO / Net terms · DPA on request · reply within 1 business day.',
                      '发票 / 采购单 / 账期 · 可提供 DPA · 通常一个工作日内回复。',
                    )
                  : tx('Your wallet is credited as soon as PayPal confirms the payment.')}
              </p>
            </div>
          </form>
        )}
      </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      translate="no"
      lang="en"
    >
      <div
        className="absolute inset-0 bg-black/25"
        onClick={() => !processing && onClose()}
      />
      {paypalClientId ? (
        <PayPalScriptProvider
          options={{ clientId: paypalClientId, currency: 'USD', intent: 'capture' }}
        >
          {card}
        </PayPalScriptProvider>
      ) : (
        card
      )}
    </div>
  );
}

// ─── PayPal top-up buttons (real order → approve → capture) ──────────────────

function PayPalTopupButtons({
  amountCents,
  disabled,
  onProcessing,
  onError,
  onPaid,
}: {
  amountCents: number;
  disabled: boolean;
  onProcessing: (v: boolean) => void;
  onError: (msg: string) => void;
  onPaid: () => void;
}) {
  const { t } = useLang();
  const { paypalClientId } = usePaymentConfig();
  // Holds the backend transaction id between createOrder and onApprove.
  const txnIdRef = useRef<number | null>(null);

  if (!paypalClientId) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2.5 text-[11px] text-amber-700 dark:text-amber-400">
        {t(
          'PayPal is not configured. Set NEXT_PUBLIC_PAYPAL_CLIENT_ID to enable top-ups.',
          'PayPal 未配置。请设置 NEXT_PUBLIC_PAYPAL_CLIENT_ID 后再充值。',
        )}
      </div>
    );
  }

  return (
    <div className={cn('relative', disabled && 'opacity-60 pointer-events-none')}>
      <PayPalButtons
        style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' }}
        disabled={disabled}
        forceReRender={[amountCents]}
        createOrder={async () => {
          onProcessing(true);
          try {
            const order = await billing.createTopupOrder({ amount_cents: amountCents });
            txnIdRef.current = order.transaction_id;
            return order.paypal_order_id;
          } catch (err) {
            onError(describeError(err));
            throw err;
          }
        }}
        onApprove={async () => {
          try {
            if (txnIdRef.current == null) throw new Error('Missing transaction id');
            await billing.captureTopup(txnIdRef.current);
            // Pull authoritative balance/transactions back into the store.
            await hydrateFromApi({ force: true });
            onPaid();
          } catch (err) {
            onError(describeError(err));
          }
        }}
        onCancel={() => onProcessing(false)}
        onError={(err) => onError(describeError(err))}
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Two-step wizard header. Step 1 = pick a top-up amount; Step 2 = pay.
 * Splitting the flow keeps the initial screen short and on-task instead
 * of overwhelming users with the full Stripe payment surface up front.
 * The visual treatment mirrors typical
 * checkout / onboarding wizards: the active dot fills, completed dots
 * show a check.
 */
function StepIndicator({
  step,
  onSelectAmount,
}: {
  step: 1 | 2;
  onSelectAmount: () => void;
}) {
  const { t } = useLang();
  const items: { idx: 1 | 2; label: string }[] = [
    { idx: 1, label: t('Select credits', '选择额度') },
    { idx: 2, label: t('Checkout', '确认支付') },
  ];
  return (
    <div className="mb-1 -mt-1 flex items-center justify-center gap-2">
      {items.map((it, i) => {
        const active = step === it.idx;
        const completed = step > it.idx;
        return (
          <div key={it.idx} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => completed && onSelectAmount()}
              disabled={!completed}
              className={cn(
                'flex items-center gap-2 rounded-full transition-colors',
                completed &&
                  'cursor-pointer hover:bg-emerald-500/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30',
              )}
              aria-label={
                completed
                  ? t('Edit top-up amount', '修改充值金额')
                  : undefined
              }
            >
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums transition-colors',
                  completed
                    ? 'bg-emerald-500 text-white'
                    : active
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground',
                )}
              >
                {completed ? <Check className="h-3 w-3" strokeWidth={3} /> : it.idx}
              </span>
              <span
                className={cn(
                  'text-[11px] font-medium transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground',
                  completed && 'text-emerald-700',
                )}
              >
                {it.label}
              </span>
            </button>
            {i === 0 && (
              <span
                className={cn(
                  'h-px w-6 transition-colors',
                  step === 2 ? 'bg-emerald-500/60' : 'bg-border',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Compact recap shown at the top of step 2 so the user can verify the
 * quantity & total they're about to pay without scrolling back. Click the
 * "Edit" link to jump back to step 1. The layout intentionally mirrors a
 * receipt header: amount on the right, units on the left.
 */
function Step2Recap({
  quote,
  tier,
  onEdit,
  disabled,
}: {
  quote: TopupQuote;
  tier: TopupBonusTier;
  onEdit: () => void;
  disabled?: boolean;
}) {
  const { t } = useLang();
  return (
    <div className="rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 flex items-center gap-3">
      <div className="h-8 w-8 rounded-lg bg-foreground/[0.06] flex items-center justify-center shrink-0">
        <Zap className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-muted-foreground leading-tight">
          {t('Topping up wallet', '充值钱包')}
        </div>
        <div className="text-sm font-semibold tabular-nums leading-tight mt-0.5">
          {formatCents(quote.totalCents)}{' '}
          <span className="text-muted-foreground font-normal text-[11px]">
            ≈ {walletPointsLabel(quote.totalCents, t, tier)}
          </span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-base font-bold tabular-nums">
          {formatCents(quote.baseCents)}
        </div>
        <div className="text-[10px] text-muted-foreground">{t('You pay', '应付')}</div>
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          className="mt-1 inline-flex h-6 items-center gap-1 rounded-md border border-indigo-500/25 bg-indigo-500/[0.06] px-2 text-[10px] font-semibold text-indigo-700 transition-colors hover:border-indigo-500/40 hover:bg-indigo-500/[0.11] disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={t('Edit top-up amount', '修改充值金额')}
        >
          <Pencil className="h-3 w-3" />
          <span>{t('Edit', '修改金额')}</span>
        </button>
      </div>
    </div>
  );
}

function TopupIntroPanel({
  buyerMode,
  onBuyerModeChange,
}: {
  buyerMode: BuyerMode;
  onBuyerModeChange: (mode: BuyerMode) => void;
}) {
  const { t } = useLang();

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-sky-300/45 bg-gradient-to-br from-sky-500/[0.05] to-transparent px-4 py-3.5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1 space-y-2.5">
            <div>
              <div className="text-sm font-bold tracking-tight text-foreground">
                {t('Start free — 600 evaluations on us', '免费开始 — 送 600 次评测')}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-sky-800/80">
                {t(
                  'Valid for 30 days · no credit card · shared across every API key',
                  '一个月有效 · 无需信用卡 · 账户下所有 API Key 共享',
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold text-sky-800">
              <IntroChip>{t('≈ 600 word / sentence', '≈ 600 字/句')}</IntroChip>
              <IntroChip>{t('≈ 300 paragraphs', '≈ 300 段落')}</IntroChip>
              <IntroChip>{t('600 eval pts', '600 评测点')}</IntroChip>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 pt-0.5">
        <div
          role="tablist"
          aria-label={t('Billing type', '计费类型')}
          className="inline-flex w-full max-w-md rounded-xl border border-border bg-muted/35 p-1.5"
        >
          <BuyerModeButton
            active={buyerMode === 'personal'}
            icon={<Smartphone className="h-3.5 w-3.5" />}
            label={t('Self-serve', '自助充值')}
            hint={t('Pay as you go', '按量付费')}
            onClick={() => onBuyerModeChange('personal')}
          />
          <BuyerModeButton
            active={buyerMode === 'business'}
            icon={<Building2 className="h-3.5 w-3.5" />}
            label={t('Team / Enterprise', '团队 / 企业')}
            hint={t('Volume, invoice & SLA', '用量、发票与 SLA')}
            onClick={() => onBuyerModeChange('business')}
          />
        </div>
        <p className="max-w-md px-2 text-center text-[11px] leading-relaxed text-muted-foreground">
          {buyerMode === 'personal'
            ? t(
                'Pick a volume tier, choose an amount in USD, then pay — credits land instantly.',
                '选档位、按美元选金额、付款 — 评测额度即时到账。',
              )
            : t(
                'Volume pricing with Net terms, DPA / security review, and dedicated support for procurement-ready teams.',
                '面向需要用量定价、账期、DPA / 安全评审与专属支持的采购友好团队。',
              )}
        </p>
      </div>
    </div>
  );
}

function BusinessTopupPanel({
  onUseSelfServe,
}: {
  onUseSelfServe: () => void;
}) {
  const { t } = useLang();
  const mailSubject = encodeURIComponent('Chivox MCP enterprise volume pricing');

  return (
    <div className="overflow-hidden rounded-xl border border-emerald-600/20 bg-gradient-to-b from-emerald-500/[0.06] to-background shadow-[0_10px_28px_-22px_rgba(5,150,105,0.55)]">
      <div className="border-b border-emerald-500/15 px-4 py-3.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
              <Building2 className="h-3 w-3" />
              {t('For procurement & security review', '采购与安全评审友好')}
            </div>
            <h3 className="mt-2 text-[15px] font-bold tracking-tight text-foreground">
              {t('Enterprise volume pricing', '企业用量定价')}
            </h3>
            <p className="mt-1 max-w-lg text-[12px] leading-relaxed text-muted-foreground">
              {t(
                'Built for $200+/mo teams that need invoices, POs, Net terms, and a security / DPA review.',
                '适合月消耗 $200+、需要发票 / 采购单 / 账期，以及安全与 DPA 评审的团队。',
              )}
            </p>
          </div>
          <div className="rounded-lg border border-emerald-500/20 bg-background/80 px-2.5 py-1.5 text-right">
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {t('Typical start', '常见起步')}
            </div>
            <div className="text-sm font-bold tabular-nums text-emerald-800">
              {t('$200+/mo', '$200+/月')}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-2 p-3.5 sm:grid-cols-3">
        <BusinessFeature
          icon={<Zap className="h-3.5 w-3.5" />}
          title={t('Volume discounts', '规模用量折扣')}
          body={t(
            'Custom monthly evaluation pools with lower USD / use rates as volume grows.',
            '定制月度评测用量包；用量越大，美元/次单价越低。',
          )}
        />
        <BusinessFeature
          icon={<Receipt className="h-3.5 w-3.5" />}
          title={t('Invoice, PO & Net terms', '发票、采购单与账期')}
          body={t(
            'USD invoicing, purchase orders, bank transfer, and Net terms for finance and procurement.',
            '支持美元发票、采购单 (PO)、银行转账与账期，方便财务与采购。',
          )}
        />
        <BusinessFeature
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
          title={t('Security, DPA & SLA', '安全、DPA 与 SLA')}
          body={t(
            'GDPR-friendly defaults, SOC 2 aligned controls, enterprise uptime SLA, and a dedicated contact.',
            'GDPR 友好默认、SOC 2 对齐控制、企业级可用性 SLA，并配备专属对接。',
          )}
        />
      </div>

      <div className="flex flex-wrap gap-1.5 border-t border-emerald-500/10 bg-emerald-500/[0.03] px-3.5 py-2.5">
        <TrustPill>{t('USD invoice', '美元发票')}</TrustPill>
        <TrustPill>{t('Net terms / PO', '账期 / 采购单')}</TrustPill>
        <TrustPill>{t('GDPR & DPA', 'GDPR 与 DPA')}</TrustPill>
        <TrustPill>{t('SOC 2 aligned', 'SOC 2 对齐')}</TrustPill>
        <TrustPill>{t('Enterprise SLA', '企业级 SLA')}</TrustPill>
        <TrustPill>{t('Private / VPC', '私有化 / VPC')}</TrustPill>
      </div>

      <div className="flex flex-col gap-2.5 border-t border-emerald-500/15 bg-background/70 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {t(
            'Share expected monthly volume plus billing and security needs — we reply within one business day.',
            '告诉我们预计月用量，以及开票与安全需求，通常一个工作日内回复。',
          )}
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onUseSelfServe}
            className="h-9 rounded-lg border border-border bg-background px-3 text-[12px] font-semibold text-foreground transition-colors hover:bg-muted/60"
          >
            {t('Self-serve instead', '改用自助充值')}
          </button>
          <a
            href={`mailto:${SALES_EMAIL}?subject=${mailSubject}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            <Mail className="h-3.5 w-3.5" />
            {t('Contact sales', '联系销售')}
          </a>
        </div>
      </div>
    </div>
  );
}

function BusinessFeature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-emerald-500/15 bg-background/90 px-3 py-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-700">
        {icon}
      </div>
      <div className="mt-2 text-[12px] font-semibold leading-snug text-foreground">{title}</div>
      <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function TrustPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-background/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-900/80">
      <Check className="h-2.5 w-2.5 text-emerald-600" />
      {children}
    </span>
  );
}

function IntroChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-full bg-background/75 px-2 ring-1 ring-sky-300/35">
      <Check className="h-3 w-3 shrink-0" />
      {children}
    </span>
  );
}

function BuyerModeButton({
  active,
  icon,
  label,
  hint,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-3 py-2.5 transition-colors',
        active
          ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold leading-none">
        {icon}
        <span>{label}</span>
      </span>
      {hint ? (
        <span
          className={cn(
            'text-[10px] font-medium leading-none',
            active ? 'text-muted-foreground' : 'text-muted-foreground/70',
          )}
        >
          {hint}
        </span>
      ) : null}
    </button>
  );
}

function TieredTopupSelector({
  amountCents,
  customAmount,
  effectiveCents,
  selectedTier,
  selectedTierId,
  onSelectTier,
  onSwitchTierForCustom,
  onSelectAmount,
  onCustomAmount,
}: {
  amountCents: number;
  customAmount: string;
  effectiveCents: number;
  selectedTier: TopupBonusTier;
  selectedTierId: TopupBonusTier['id'];
  onSelectTier: (tier: TopupBonusTier) => void;
  onSwitchTierForCustom: (tier: TopupBonusTier) => void;
  onSelectAmount: (amountCents: number) => void;
  onCustomAmount: (value: string) => void;
}) {
  const { t } = useLang();
  const [dismissedSuggestionKey, setDismissedSuggestionKey] = useState<string | null>(null);
  const recommendedTier = customAmount.trim() ? getTopupBonusTier(effectiveCents) : selectedTier;
  const suggestionKey = `${selectedTier.id}:${recommendedTier.id}:${effectiveCents}`;
  const showTierSuggestion =
    customAmount.trim().length > 0 &&
    effectiveCents >= recommendedTier.minCents &&
    recommendedTier.bonusPct > selectedTier.bonusPct &&
    dismissedSuggestionKey !== suggestionKey;
  const belowTierMin =
    customAmount.trim().length > 0 &&
    effectiveCents > 0 &&
    effectiveCents < selectedTier.minCents;
  const fallbackTier = belowTierMin ? getTopupBonusTier(effectiveCents) : null;
  const canDowngradeTier =
    belowTierMin &&
    fallbackTier != null &&
    effectiveCents >= fallbackTier.minCents &&
    fallbackTier.id !== selectedTier.id;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="border-b border-border/70 bg-muted/20 px-3.5 py-3">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <Zap className="h-3.5 w-3.5 text-emerald-600" />
          {t('Pick a bonus tier, then an amount', '先选档位，再选金额')}
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          {t(
            'Higher tiers unlock more bonus points. Expand a tier to pick an amount and see what you get.',
            '档位越高，赠送评测点越多。点开任一档位选择金额，右侧会显示到账明细。',
          )}
        </p>
      </div>

      <div className="space-y-2.5 p-3">
        {TOPUP_BONUS_TIERS.map((tier) => {
          const expanded = tier.id === selectedTierId;
          const copy = topupTierCopy(tier, t);
          const details = buildTopupPointDetails(tier.minCents, tier);
          const wordPrice = formatEvaluationUnitDollars(
            WORD_SENTENCE_POINTS_PER_USE,
            Number(details.pointsPerUsd),
          );
          const paragraphPrice = formatEvaluationUnitDollars(
            PARAGRAPH_POINTS_PER_USE,
            Number(details.pointsPerUsd),
          );

          return (
            <div
              key={tier.id}
              className={cn(
                'group/tier overflow-hidden rounded-xl border bg-background transition-all',
                expanded
                  ? 'border-emerald-400/70 bg-emerald-500/[0.035] ring-1 ring-emerald-400/25'
                  : 'border-border/80 hover:-translate-y-px hover:border-emerald-500/35 hover:shadow-[0_10px_20px_-18px_rgba(16,185,129,0.9)]',
              )}
            >
              <button
                type="button"
                onClick={() => {
                  setDismissedSuggestionKey(null);
                  onSelectTier(tier);
                }}
                aria-expanded={expanded}
                aria-label={
                  expanded
                    ? t(`Collapse ${copy.label}`, `收起${copy.label}`)
                    : t(`Expand ${copy.label} to choose amount`, `展开${copy.label}并选择金额`)
                }
                className={cn(
                  'flex w-full cursor-pointer flex-col gap-1.5 px-3.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30',
                  expanded ? 'bg-emerald-500/[0.035]' : 'hover:bg-emerald-500/[0.04]',
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="flex shrink-0 items-center gap-1.5 text-sm font-bold text-foreground">
                    <copy.Icon
                      className={cn(
                        'h-3.5 w-3.5',
                        tier.id === 'flagship'
                          ? 'text-amber-600'
                          : tier.id === 'advanced'
                            ? 'text-emerald-600'
                            : 'text-sky-600',
                      )}
                    />
                    {copy.label}
                  </span>
                  {copy.badge && (
                    <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
                      {copy.badge}
                    </span>
                  )}
                  <span className="ml-auto flex shrink-0 items-center gap-1.5">
                    {expanded ? (
                      <span className="hidden rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-700 sm:inline">
                        {t('Current tier', '当前档位')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={cn(
                            'text-[11px] font-semibold',
                            tier.id === 'flagship' ? 'text-amber-800' : 'text-emerald-700',
                          )}
                        >
                          {tier.id === 'flagship'
                            ? t('Best discount', '最高折扣')
                            : tier.id === 'advanced'
                              ? t('More discount', '更多折扣')
                              : t('Includes bonus', '含赠送')}
                        </span>
                        <BonusPctPill pct={tier.bonusPct} />
                      </span>
                    )}
                    <span
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full border transition-all',
                        expanded
                          ? 'rotate-180 border-emerald-500/35 bg-emerald-500/10 text-emerald-700'
                          : 'border-border/80 bg-muted/30 text-muted-foreground group-hover/tier:border-emerald-500/35 group-hover/tier:bg-emerald-500/[0.08] group-hover/tier:text-emerald-700',
                      )}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </span>
                  </span>
                </div>

                <div className="pr-9 text-[11px] leading-relaxed text-muted-foreground">
                  {t(
                    `${formatCents(tier.minCents)}+ · ${details.pointsPerUsd} pts/$ · word ${wordPrice}/use · paragraph ${paragraphPrice}/use`,
                    `${formatCents(tier.minCents)} 起 · 每 $1 = ${details.pointsPerUsd} 评测点 · 字/句 ${wordPrice}/次 · 段落 ${paragraphPrice}/次`,
                  )}
                </div>
              </button>

              {expanded && (
                <div className="grid gap-3 border-t border-emerald-400/25 p-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.95fr)]">
                  <div className="space-y-3">
                    <div className="text-[11px] font-semibold text-muted-foreground">
                      {t('Choose amount', '选择金额')}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {tier.presetCents.map((preset) => {
                        const selected = !customAmount && amountCents === preset;
                        const presetDetails = buildTopupPointDetails(preset, tier);
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              setDismissedSuggestionKey(null);
                              onSelectAmount(preset);
                            }}
                            className={cn(
                              'min-h-[58px] rounded-xl border px-2.5 py-2 text-left transition-colors',
                              selected
                                ? 'border-emerald-500 bg-emerald-500 text-white shadow-[0_10px_18px_-14px_rgba(16,185,129,0.9)]'
                                : 'border-emerald-500/20 bg-background hover:border-emerald-500/45 hover:bg-emerald-500/[0.04]',
                            )}
                          >
                            <span className="block text-sm font-bold tabular-nums">
                              {formatCents(preset)}
                            </span>
                            <span className={cn('mt-1 block whitespace-nowrap text-[10px] tabular-nums', selected ? 'text-white/85' : 'text-muted-foreground')}>
                              {presetDetails.walletPoints} {t('eval pts', '评测点')}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground">
                      <span className="h-px flex-1 bg-border" />
                      {t('or enter any amount', '或输入任意金额')}
                      <span className="h-px flex-1 bg-border" />
                    </div>

                    <label
                      className={cn(
                        'flex h-11 items-center gap-2 rounded-xl border bg-background px-3 transition-colors',
                        belowTierMin
                          ? 'border-red-500 ring-1 ring-red-500/20'
                          : customAmount
                            ? 'border-zinc-900 ring-1 ring-zinc-900/10'
                            : 'border-border/80 focus-within:border-zinc-900/40',
                      )}
                    >
                      <span className="text-sm font-semibold text-muted-foreground">$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={customAmount}
                        onChange={(e) => {
                          setDismissedSuggestionKey(null);
                          onCustomAmount(e.target.value.replace(/[^0-9.]/g, '').slice(0, 10));
                        }}
                        placeholder={t('Enter an amount', '输入金额')}
                        aria-invalid={belowTierMin}
                        className="min-w-0 flex-1 bg-transparent text-sm font-semibold tabular-nums outline-none placeholder:font-normal placeholder:text-muted-foreground/70"
                      />
                      <span className="text-[10px] font-medium text-muted-foreground">USD</span>
                    </label>

                    {belowTierMin && (
                      <div className="rounded-lg border border-red-500/25 bg-red-50/80 px-2.5 py-2 text-[11px] leading-relaxed text-red-800">
                        <p className="font-semibold">
                          {t(
                            `${topupTierCopy(selectedTier, t).label} requires ${formatCents(selectedTier.minCents)} minimum.`,
                            `${topupTierCopy(selectedTier, t).label}最低充值 ${formatCents(selectedTier.minCents)}。`,
                          )}
                        </p>
                        <p className="mt-0.5 text-red-700/85">
                          {canDowngradeTier && fallbackTier
                            ? t(
                                `Entered ${formatCents(effectiveCents)} qualifies for ${topupTierCopy(fallbackTier, t).label} (+${fallbackTier.bonusPct}%).`,
                                `当前 ${formatCents(effectiveCents)} 可使用${topupTierCopy(fallbackTier, t).label}（+${fallbackTier.bonusPct}%）。`,
                              )
                            : t(
                                `Enter at least ${formatCents(selectedTier.minCents)}, or pick a lower tier.`,
                                `请至少输入 ${formatCents(selectedTier.minCents)}，或切换到更低档位。`,
                              )}
                        </p>
                        {canDowngradeTier && fallbackTier && (
                          <button
                            type="button"
                            onClick={() => onSwitchTierForCustom(fallbackTier)}
                            className="mt-1.5 h-7 rounded-full bg-red-700 px-2.5 text-[10.5px] font-semibold text-white transition-colors hover:bg-red-800"
                          >
                            {t(
                              `Switch to ${topupTierCopy(fallbackTier, t).label}`,
                              `切换到${topupTierCopy(fallbackTier, t).label}`,
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {showTierSuggestion && !belowTierMin && (
                      <TierSuggestionCard
                        amountCents={effectiveCents}
                        currentTier={selectedTier}
                        recommendedTier={recommendedTier}
                        onAccept={() => {
                          setDismissedSuggestionKey(null);
                          onSwitchTierForCustom(recommendedTier);
                        }}
                        onDismiss={() => setDismissedSuggestionKey(suggestionKey)}
                      />
                    )}
                  </div>

                  <TierQuoteCard
                    amountCents={effectiveCents}
                    tier={selectedTier}
                    belowMin={belowTierMin}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TierSuggestionCard({
  amountCents,
  currentTier,
  recommendedTier,
  onAccept,
  onDismiss,
}: {
  amountCents: number;
  currentTier: TopupBonusTier;
  recommendedTier: TopupBonusTier;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  const { t } = useLang();
  const currentCopy = topupTierCopy(currentTier, t);
  const recommendedCopy = topupTierCopy(recommendedTier, t);
  const currentDetails = buildTopupPointDetails(amountCents, currentTier);
  const recommendedDetails = buildTopupPointDetails(amountCents, recommendedTier);
  const currentPoints = Number(currentDetails.walletPoints.replace(/,/g, '')) || 0;
  const recommendedPoints = Number(recommendedDetails.walletPoints.replace(/,/g, '')) || 0;
  const gainedPoints = Math.max(0, recommendedPoints - currentPoints);
  const maxPoints = Math.max(currentPoints, recommendedPoints, 1);
  const gainPct = currentPoints > 0 ? Math.round((gainedPoints / currentPoints) * 100) : 0;

  return (
    <div className="rounded-xl border border-amber-300/70 bg-amber-50/80 px-3 py-2.5 text-amber-950">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-[12px] font-bold">
            {t(
              `This amount qualifies for ${recommendedCopy.label}`,
              `这个金额已达到${recommendedCopy.label}，切换后更划算`,
            )}
          </div>
          <p className="mt-0.5 text-[10.5px] leading-relaxed text-amber-800">
            {t(
              `Same ${formatCents(amountCents)}, higher bonus: +${currentTier.bonusPct}% → +${recommendedTier.bonusPct}%.`,
              `同样 ${formatCents(amountCents)}，赠送比例从 +${currentTier.bonusPct}% 提升到 +${recommendedTier.bonusPct}%。`,
            )}
          </p>
        </div>
        <div className="shrink-0 rounded-full bg-background/85 px-2 py-1 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-500/20">
          +{gainedPoints.toLocaleString('en-US')} {t('eval pts', '评测点')}
          {gainPct > 0 ? ` · +${gainPct}%` : ''}
        </div>
      </div>

      <div className="mt-2 space-y-1.5">
        <TierComparisonBar
          label={currentCopy.label}
          value={currentPoints}
          maxValue={maxPoints}
          muted
        />
        <TierComparisonBar
          label={recommendedCopy.label}
          value={recommendedPoints}
          maxValue={maxPoints}
        />
      </div>

      <div className="mt-2 flex flex-col gap-1.5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onDismiss}
          className="h-7 rounded-full border border-amber-300/70 bg-background/70 px-2.5 text-[10.5px] font-semibold text-amber-900 transition-colors hover:bg-background"
        >
          {t('Keep current tier', '仍用当前档')}
        </button>
        <button
          type="button"
          onClick={onAccept}
          className="h-7 rounded-full bg-emerald-600 px-2.5 text-[10.5px] font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          {t(`Switch to ${recommendedCopy.label}`, `切换到${recommendedCopy.label}`)}
        </button>
      </div>
    </div>
  );
}

function TierComparisonBar({
  label,
  value,
  maxValue,
  muted = false,
}: {
  label: string;
  value: number;
  maxValue: number;
  muted?: boolean;
}) {
  const width = `${Math.max(8, Math.min(100, (value / maxValue) * 100))}%`;

  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_4.5rem] items-center gap-2 text-[10px]">
      <span className={cn('truncate font-semibold', muted ? 'text-amber-800/75' : 'text-emerald-800')}>
        {label}
      </span>
      <span className="h-1.5 overflow-hidden rounded-full bg-background/80 ring-1 ring-amber-200/70">
        <span
          className={cn('block h-full rounded-full', muted ? 'bg-amber-300' : 'bg-emerald-500')}
          style={{ width }}
        />
      </span>
      <span className="text-right font-semibold tabular-nums text-foreground">
        {value.toLocaleString('en-US')} 次
      </span>
    </div>
  );
}

function TierQuoteCard({
  amountCents,
  tier,
  belowMin = false,
}: {
  amountCents: number;
  tier: TopupBonusTier;
  belowMin?: boolean;
}) {
  const { t } = useLang();
  const details = buildTopupPointDetails(amountCents, tier);
  const wordPrice = formatEvaluationUnitDollars(
    WORD_SENTENCE_POINTS_PER_USE,
    Number(details.pointsPerUsd),
  );
  const paragraphPrice = formatEvaluationUnitDollars(
    PARAGRAPH_POINTS_PER_USE,
    Number(details.pointsPerUsd),
  );
  const totalPoints = Number(details.walletPoints.replace(/,/g, '')) || 0;
  const walletValueCents = Math.round((totalPoints / BASE_POINTS_PER_USD) * 100);
  const quoteDate = new Date().toLocaleDateString('en-CA');
  const expiresDate = new Date(Date.now() + TRIAL_VALID_DAYS * 86_400_000).toLocaleDateString('en-CA');

  if (amountCents <= 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-background px-3 py-3 text-[11px] text-muted-foreground">
        {t('Pick an amount to compare wallet dollars and evaluation points.', '选择金额后对比钱包金额和到账评测点。')}
      </div>
    );
  }

  if (belowMin) {
    return (
      <div className="rounded-xl border border-dashed border-red-300/70 bg-red-50/40 px-3 py-3 text-[11px] leading-relaxed text-red-800">
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-red-700/80">
          {t('Credit quote', '额度账单')}
        </div>
        <p className="mt-2 font-semibold">
          {t('Amount below this tier minimum', '金额未达到当前档位最低要求')}
        </p>
        <p className="mt-1 text-red-700/85">
          {t(
            `${topupTierCopy(tier, t).label} starts at ${formatCents(tier.minCents)}. Quote unavailable until the minimum is met.`,
            `${topupTierCopy(tier, t).label}最低 ${formatCents(tier.minCents)}。未达标前不显示到账明细。`,
          )}
        </p>
      </div>
    );
  }

  const wordUses = Math.floor(totalPoints / WORD_SENTENCE_POINTS_PER_USE).toLocaleString('en-US');
  const paragraphUses = Math.floor(totalPoints / PARAGRAPH_POINTS_PER_USE).toLocaleString('en-US');

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-background">
      {/* Bill header — total + meta on one compact block */}
      <div className="px-3 pt-2.5 pb-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            {t('Credit quote', '额度账单')}
          </span>
          <span className="font-mono text-[10px] tabular-nums text-zinc-400">{quoteDate}</span>
        </div>
        <div className="mt-1.5 flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-1">
            <span className="text-[1.5rem] font-bold leading-none tracking-tight tabular-nums text-zinc-900">
              {details.walletPoints}
            </span>
            <span className="text-[12px] font-medium text-zinc-500">
              {t('eval pts', '评测点')}
            </span>
          </div>
          <span className="shrink-0 text-[11px] tabular-nums text-zinc-500">
            {t(`≈ ${formatCents(walletValueCents)}`, `≈ ${formatCents(walletValueCents)}`)}
          </span>
        </div>
      </div>

      <div className="border-t border-zinc-100" />

      {/* Line items — denser invoice rows */}
      <div className="space-y-1.5 px-3 py-2">
        <QuoteLine
          label={t('Base points', '基础评测点')}
          value={details.basePoints}
          hint={t(
            `${formatCents(amountCents)} × ${BASE_POINTS_PER_USD} pts/$1`,
            `每 $1 = ${BASE_POINTS_PER_USD} 点 · ${formatCents(amountCents)}`,
          )}
        />
        <QuoteLine
          label={t(`Bonus (+${tier.bonusPct}%)`, `赠送（+${tier.bonusPct}%）`)}
          value={`+${details.bonusPoints}`}
          tone="bonus"
        />
      </div>

      {/* Estimated usage — two compact rows, no nested card title bloat */}
      <div className="mx-2 mb-2 space-y-1 rounded-lg bg-zinc-50 px-2.5 py-1.5">
        <QuoteLine
          label={t('Word / sentence', '字 / 句')}
          value={`≈ ${wordUses} ${t('uses', '次')}`}
          hint={`${wordPrice}/${t('use', '次')}`}
          icon={MessageSquareText}
          compact
        />
        <QuoteLine
          label={t('Paragraph', '段落')}
          value={`≈ ${paragraphUses} ${t('uses', '次')}`}
          hint={`${paragraphPrice}/${t('use', '次')}`}
          icon={FileText}
          compact
        />
      </div>

      {/* Validity footer */}
      <div className="flex items-center gap-1.5 border-t border-amber-200/50 bg-amber-50/80 px-3 py-1.5">
        <Clock className="h-3 w-3 shrink-0 text-amber-700" />
        <p className="text-[10px] leading-snug text-amber-950/80">
          {t(
            `Valid ${TRIAL_VALID_DAYS} days · expires ${expiresDate} · non-refundable`,
            `${TRIAL_VALID_DAYS} 天有效 · ${expiresDate} 前用完 · 过期不退`,
          )}
        </p>
      </div>
    </div>
  );
}

function QuoteLine({
  label,
  value,
  hint,
  tone,
  icon: Icon,
  compact = false,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'bonus';
  icon?: LucideIcon;
  compact?: boolean;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
      <div className="flex min-w-0 items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3 shrink-0 text-zinc-400" strokeWidth={1.75} />}
        <span className={cn('truncate text-[11px]', tone === 'bonus' ? 'text-emerald-700' : 'text-zinc-600')}>
          {label}
        </span>
        {hint && !compact && (
          <span className="truncate text-[10px] tabular-nums text-zinc-400">· {hint}</span>
        )}
      </div>
      <div className="flex items-baseline justify-end gap-1.5 text-right">
        <span
          className={cn(
            'font-semibold tabular-nums leading-none',
            compact ? 'text-[12px]' : 'text-[12px]',
            tone === 'bonus' ? 'text-emerald-700' : 'text-zinc-900',
          )}
        >
          {value}
        </span>
        {hint && compact && (
          <span className="text-[10px] tabular-nums text-zinc-400">{hint}</span>
        )}
      </div>
    </div>
  );
}

function topupTierCopy(tier: TopupBonusTier, t: (en: string, zh: string) => string): {
  label: string;
  badge: string;
  Icon: LucideIcon;
} {
  if (tier.id === 'advanced') {
    return {
      label: t('Advanced', '高级版'),
      badge: t('Recommended', '推荐'),
      Icon: Star,
    };
  }
  if (tier.id === 'flagship') {
    return { label: t('Flagship', '旗舰版'), badge: '', Icon: Crown };
  }
  return { label: t('Standard', '标准版'), badge: '', Icon: Sparkles };
}

/** Flat bonus pill — emerald for mid tiers, amber for the top (+25%). */
function BonusPctPill({ pct }: { pct: number }) {
  const gold = pct >= 25;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums leading-none',
        gold
          ? 'bg-amber-500/12 text-amber-800'
          : 'bg-emerald-500/12 text-emerald-700',
      )}
    >
      +{pct}%
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-3 block text-xs font-medium text-muted-foreground">
      {children}
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
