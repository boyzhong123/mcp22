'use client';

import {
  Check,
  ChevronRight,
  Crown,
  Lock,
  Mail,
  Pencil,
  Sparkles,
  Star,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { cn } from '@/lib/utils';
import { formatCents, type Transaction } from '../_lib/mock-store';
import { useMockAuth } from '../_lib/mock-auth';
import { useLang } from '../_lib/use-lang';
import {
  FIXED_TOPUP_PLANS,
  PARAGRAPH_POINTS_PER_USE,
  TRIAL_VALID_DAYS,
  WORD_SENTENCE_POINTS_PER_USE,
  buildTopupPointDetails,
  formatBonusPercent,
  formatEvaluationUnitDollars,
  getEvaluationUnitPrices,
  type FixedTopupPlan,
} from '../_lib/topup';
import { billing, describeError } from '../_lib/api';
import { hydrateFromApi } from '../_lib/mock-store-bridge';
import { usePaymentConfig } from '../_lib/payment-config';
import { useUi } from '../_lib/use-ui-store';

interface StripeCheckoutModalFixedProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (txn: Transaction) => void;
  keyId?: string;
  onSwitchVariant?: () => void;
}

type Step = 1 | 2;

export function StripeCheckoutModalFixed({
  open,
  onClose,
  onSuccess: _onSuccess,
  onSwitchVariant,
}: StripeCheckoutModalFixedProps) {
  if (!open) return null;
  return (
    <OpenedFixedCheckout
      onClose={onClose}
      onSwitchVariant={onSwitchVariant}
    />
  );
}

function OpenedFixedCheckout({
  onClose,
  onSwitchVariant,
}: Omit<StripeCheckoutModalFixedProps, 'open' | 'keyId'>) {
  const { t, tx } = useLang();
  const { user } = useMockAuth();
  const { paypalClientId } = usePaymentConfig();
  const sidebarCollapsed = useUi((s) => s.sidebarCollapsed);

  const recommended =
    FIXED_TOPUP_PLANS.find((plan) => plan.recommended) ?? FIXED_TOPUP_PLANS[1];
  const [selectedPlanId, setSelectedPlanId] = useState<FixedTopupPlan['id']>(recommended.id);
  const [step, setStep] = useState<Step>(1);
  const [receiptEmail, setReceiptEmail] = useState(() => user?.email ?? '');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPlan =
    FIXED_TOPUP_PLANS.find((plan) => plan.id === selectedPlanId) ?? recommended;
  const details = useMemo(
    () =>
      buildTopupPointDetails(selectedPlan.amountCents, {
        id: selectedPlan.id,
        minCents: selectedPlan.amountCents,
        bonusPct: selectedPlan.bonusPct,
        presetCents: [selectedPlan.amountCents],
      }),
    [selectedPlan],
  );
  const totalPoints = Number(details.walletPoints.replace(/,/g, '')) || 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !processing) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [processing, onClose]);

  const card = (
    <div className="relative flex max-h-[92vh] w-full max-w-[720px] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
      <div className="flex shrink-0 items-center justify-between border-b border-border/60 bg-background px-5 py-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{t('Add points', '充值')}</div>
          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
            <Lock className="h-2.5 w-2.5 shrink-0" />
            {t(
              'Pick one fixed pack — no custom amounts.',
              '选择固定套餐 — 不可自定义金额。',
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {onSwitchVariant && (
            <button
              type="button"
              onClick={onSwitchVariant}
              disabled={processing}
              className="rounded-md border border-indigo-500/30 bg-indigo-500/[0.08] px-2.5 py-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 transition-colors hover:bg-indigo-500/[0.14] disabled:opacity-40"
            >
              {t('Switch version', '切换版本')}
            </button>
          )}
          <button
            type="button"
            onClick={() => !processing && onClose()}
            disabled={processing}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-40"
            aria-label={t('Close', '关闭')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {done ? (
        <div className="flex flex-col items-center px-8 py-12 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
            <Check className="h-7 w-7 text-emerald-500" strokeWidth={2.5} />
          </div>
          <h3 className="mb-1 text-lg font-semibold">{tx('Payment successful')}</h3>
          <p className="text-sm text-muted-foreground">
            +{details.walletPoints} {t('pts', '评测积分')}{' '}
            {t('added to your wallet.', '已入账钱包。')} {t('Charged', '扣款')}{' '}
            {formatCents(selectedPlan.amountCents)}.
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <FixedStepIndicator
              step={step}
              onBack={() => {
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

            {step === 1 && (
              <>
                <div>
                  <h3 className="text-sm font-semibold">
                    {t('Which pack fits you?', '哪个套餐更适合你？')}
                  </h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {t(
                      'Three fixed packs. Compare bonus points and estimated usage — amounts cannot be customized.',
                      '三档固定金额。对比赠送评测积分与预估用量 — 不可自定义金额。',
                    )}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {FIXED_TOPUP_PLANS.map((plan) => (
                    <FixedPlanCard
                      key={plan.id}
                      plan={plan}
                      selected={plan.id === selectedPlanId}
                      onSelect={() => setSelectedPlanId(plan.id)}
                    />
                  ))}
                </div>

                <FixedCompareTable selectedPlanId={selectedPlanId} />
              </>
            )}

            {step === 2 && (
              <>
                <div className="rounded-xl border border-border bg-muted/20 px-3.5 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        {t('Selected pack', '已选套餐')}
                      </div>
                      <div className="mt-1 text-sm font-bold">
                        {fixedPlanCopy(selectedPlan, t).label} · {formatCents(selectedPlan.amountCents)}
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {details.walletPoints} {t('pts', '评测积分')} ·{' '}
                        {selectedPlan.bonusPct > 0
                          ? t(
                              `${formatBonusPercent(selectedPlan.bonusPct)} bonus`,
                              `${formatBonusPercent(selectedPlan.bonusPct)} 赠送`,
                            )
                          : t('Base points', '基准积分')}{' '}
                        · {TRIAL_VALID_DAYS}{' '}
                        {t('days validity', '天有效')}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => {
                        if (processing) return;
                        setError(null);
                        setStep(1);
                      }}
                      className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline disabled:opacity-40"
                    >
                      {t('Change', '更换')}
                    </button>
                  </div>
                </div>

                <section>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      {tx('Receipt email')}
                    </label>
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
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-500/[0.08] text-indigo-600 dark:text-indigo-400">
                      <Pencil className="h-3 w-3" />
                    </span>
                  </label>
                </section>

                <div className="space-y-0.5 text-center">
                  <div className="text-xs font-semibold">
                    {tx('Complete your payment securely with PayPal')}
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {tx(
                      'Choose an option below. PayPal will open a secure checkout window for you to approve the payment.',
                    )}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="shrink-0 space-y-2 border-t border-border/60 bg-background/95 px-5 py-4 shadow-[0_-6px_14px_-10px_rgba(17,24,39,0.18)] backdrop-blur-sm">
            {step === 1 ? (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep(2);
                }}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#635bff] text-sm font-semibold text-white transition-colors hover:bg-[#5148e3]"
              >
                <span className="flex flex-col items-center leading-tight">
                  <span>
                    {t('Continue', '下一步')} · {formatCents(selectedPlan.amountCents)}
                  </span>
                  <span className="text-[11px] font-normal opacity-85 tabular-nums">
                    ≈ {details.walletPoints} {t('pts', '评测积分')}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <div className="space-y-2">
                <FixedPayPalButtons
                  amountCents={selectedPlan.amountCents}
                  disabled={processing || !receiptEmail.includes('@')}
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
                  className="mx-auto block h-9 w-full max-w-[750px] rounded-lg border border-border bg-muted/60 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t('Cancel payment', '取消支付')}
                </button>
              </div>
            )}
            <p className="flex items-center justify-center gap-1 text-center text-[10px] leading-relaxed text-muted-foreground">
              <Lock className="h-2.5 w-2.5" />
              {step === 1
                ? t(
                    `${totalPoints.toLocaleString('en-US')} pts · ${TRIAL_VALID_DAYS}-day validity · non-refundable`,
                    `${totalPoints.toLocaleString('en-US')} 评测积分 · ${TRIAL_VALID_DAYS} 天有效 · 过期不退`,
                  )
                : tx('Points land in your wallet as soon as PayPal confirms the payment.')}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        sidebarCollapsed ? 'lg:pl-[60px]' : 'lg:pl-60',
      )}
      translate="no"
      lang="en"
    >
      <div className="absolute inset-0 bg-black/25" onClick={() => !processing && onClose()} />
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

function FixedStepIndicator({
  step,
  onBack,
}: {
  step: Step;
  onBack: () => void;
}) {
  const { t } = useLang();
  const items: { idx: Step; label: string }[] = [
    { idx: 1, label: t('Choose pack', '选择套餐') },
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
              onClick={() => completed && onBack()}
              disabled={!completed}
              className={cn(
                'flex items-center gap-2 rounded-full transition-colors',
                completed &&
                  'cursor-pointer hover:bg-emerald-500/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30',
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums',
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
                  'text-[11px] font-medium',
                  active ? 'text-foreground' : 'text-muted-foreground',
                  completed && 'text-emerald-700 dark:text-emerald-400',
                )}
              >
                {it.label}
              </span>
            </button>
            {i === 0 && (
              <span
                className={cn('h-px w-6', step === 2 ? 'bg-emerald-500/60' : 'bg-border')}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FixedPlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: FixedTopupPlan;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useLang();
  const copy = fixedPlanCopy(plan, t);
  const details = buildTopupPointDetails(plan.amountCents, {
    id: plan.id,
    minCents: plan.amountCents,
    bonusPct: plan.bonusPct,
    presetCents: [plan.amountCents],
  });
  const totalPoints = Number(details.walletPoints.replace(/,/g, '')) || 0;
  const wordUses = Math.floor(totalPoints / WORD_SENTENCE_POINTS_PER_USE);
  const paragraphUses = Math.floor(totalPoints / PARAGRAPH_POINTS_PER_USE);
  const unitPrices = getEvaluationUnitPrices(plan.id);
  const wordPrice = formatEvaluationUnitDollars(unitPrices.wordSentenceDollars);
  const paragraphPrice = formatEvaluationUnitDollars(unitPrices.paragraphDollars);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex h-full flex-col rounded-2xl border p-3.5 text-left transition-all',
        selected
          ? 'border-emerald-500 bg-emerald-500/[0.04] ring-1 ring-emerald-500/30'
          : 'border-border/80 bg-background hover:-translate-y-px hover:border-emerald-500/35 hover:shadow-[0_10px_20px_-18px_rgba(16,185,129,0.9)]',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-xl',
            plan.id === 'flagship'
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
              : plan.id === 'advanced'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
          )}
        >
          <copy.Icon className="h-4 w-4" />
        </span>
        {plan.recommended && (
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-700 dark:text-emerald-400">
            {t('Recommended', '推荐')}
          </span>
        )}
      </div>

      <div className="mt-3 text-sm font-bold">{copy.label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-xl font-bold tabular-nums tracking-tight">
          {formatCents(plan.amountCents)}
        </span>
        <span className="text-[11px] text-muted-foreground">{t('one-time', '一次性')}</span>
      </div>

      <div className="mt-3 space-y-1.5 text-[11px] leading-relaxed text-muted-foreground">
        <FeatureLine>
          {details.walletPoints} {t('pts', '评测积分')}
        </FeatureLine>
        <FeatureLine>
          {plan.bonusPct > 0
            ? t(
                `${formatBonusPercent(plan.bonusPct)} bonus points`,
                `${formatBonusPercent(plan.bonusPct)} 赠送评测积分`,
              )
            : t('Base points · no extra bonus', '基准评测积分 · 不额外赠送')}
        </FeatureLine>
        <FeatureLine>
          ≈ {wordUses.toLocaleString('en-US')} {t('word / sentence', '字/句')}
        </FeatureLine>
        <FeatureLine>
          ≈ {paragraphUses.toLocaleString('en-US')} {t('paragraph', '段落')}
        </FeatureLine>
        <FeatureLine>
          {wordPrice}/{t('use', '次')} · {paragraphPrice}/{t('paragraph use', '段落次')}
        </FeatureLine>
        <FeatureLine>
          {TRIAL_VALID_DAYS} {t('days validity', '天有效')}
        </FeatureLine>
      </div>

      <div
        className={cn(
          'mt-4 flex h-9 items-center justify-center rounded-lg text-[12px] font-semibold transition-colors',
          selected
            ? 'bg-emerald-500 text-white'
            : 'border border-border bg-muted/30 text-foreground',
        )}
      >
        {selected ? t('Selected', '已选择') : t('Select', '选择')}
      </div>
    </button>
  );
}

function FeatureLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-1.5">
      <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600/80 dark:text-emerald-400/80" />
      <span>{children}</span>
    </div>
  );
}

function FixedCompareTable({ selectedPlanId }: { selectedPlanId: FixedTopupPlan['id'] }) {
  const { t } = useLang();
  const rows = [
    {
      label: t('Price', '价格'),
      values: FIXED_TOPUP_PLANS.map((plan) => formatCents(plan.amountCents)),
    },
    {
      label: t('Points', '到账评测积分'),
      values: FIXED_TOPUP_PLANS.map((plan) => {
        const details = buildTopupPointDetails(plan.amountCents, {
          id: plan.id,
          minCents: plan.amountCents,
          bonusPct: plan.bonusPct,
          presetCents: [plan.amountCents],
        });
        return details.walletPoints;
      }),
    },
    {
      label: t('Bonus', '赠送'),
      values: FIXED_TOPUP_PLANS.map((plan) =>
        plan.bonusPct > 0
          ? formatBonusPercent(plan.bonusPct)
          : t('0% · base', '0% · 基准'),
      ),
    },
    {
      label: t('Pts / $1', '每 $1 评测积分'),
      values: FIXED_TOPUP_PLANS.map((plan) => {
        const details = buildTopupPointDetails(plan.amountCents, {
          id: plan.id,
          minCents: plan.amountCents,
          bonusPct: plan.bonusPct,
          presetCents: [plan.amountCents],
        });
        return details.pointsPerUsd;
      }),
    },
    {
      label: t('Word / phrase / sentence unit price', '字、词、句评测单价'),
      values: FIXED_TOPUP_PLANS.map((plan) =>
        formatEvaluationUnitDollars(getEvaluationUnitPrices(plan.id).wordSentenceDollars),
      ),
    },
    {
      label: t('Paragraph unit price', '段落评测单价'),
      values: FIXED_TOPUP_PLANS.map((plan) =>
        formatEvaluationUnitDollars(getEvaluationUnitPrices(plan.id).paragraphDollars),
      ),
    },
    {
      label: t('Word / sentence uses', '可测字/句'),
      values: FIXED_TOPUP_PLANS.map((plan) => {
        const details = buildTopupPointDetails(plan.amountCents, {
          id: plan.id,
          minCents: plan.amountCents,
          bonusPct: plan.bonusPct,
          presetCents: [plan.amountCents],
        });
        const pts = Number(details.walletPoints.replace(/,/g, '')) || 0;
        return `≈ ${Math.floor(pts / WORD_SENTENCE_POINTS_PER_USE).toLocaleString('en-US')}`;
      }),
    },
    {
      label: t('Paragraph uses', '可测段落'),
      values: FIXED_TOPUP_PLANS.map((plan) => {
        const details = buildTopupPointDetails(plan.amountCents, {
          id: plan.id,
          minCents: plan.amountCents,
          bonusPct: plan.bonusPct,
          presetCents: [plan.amountCents],
        });
        const pts = Number(details.walletPoints.replace(/,/g, '')) || 0;
        return `≈ ${Math.floor(pts / PARAGRAPH_POINTS_PER_USE).toLocaleString('en-US')}`;
      }),
    },
    {
      label: t('Validity', '有效期'),
      values: FIXED_TOPUP_PLANS.map(() => `${TRIAL_VALID_DAYS} ${t('days', '天')}`),
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="border-b border-border/70 bg-muted/20 px-3 py-2 text-[11px] font-semibold">
        {t('Compare packs', '套餐对比')}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left text-[11px]">
          <thead>
            <tr className="border-b border-border/70">
              <th className="px-3 py-2 font-medium text-muted-foreground">
                {t('Feature', '对比项')}
              </th>
              {FIXED_TOPUP_PLANS.map((plan) => {
                const copy = fixedPlanCopy(plan, t);
                const active = plan.id === selectedPlanId;
                return (
                  <th
                    key={plan.id}
                    className={cn(
                      'px-3 py-2 font-semibold',
                      active ? 'bg-emerald-500/[0.06] text-emerald-800 dark:text-emerald-300' : 'text-foreground',
                    )}
                  >
                    {copy.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-border/50 last:border-b-0">
                <td className="px-3 py-2 text-muted-foreground">{row.label}</td>
                {row.values.map((value, idx) => {
                  const plan = FIXED_TOPUP_PLANS[idx];
                  const active = plan.id === selectedPlanId;
                  return (
                    <td
                      key={`${row.label}-${plan.id}`}
                      className={cn(
                        'px-3 py-2 font-medium tabular-nums',
                        active && 'bg-emerald-500/[0.04] text-emerald-900 dark:text-emerald-200',
                      )}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function fixedPlanCopy(
  plan: FixedTopupPlan,
  t: (en: string, zh: string) => string,
): { label: string; Icon: LucideIcon } {
  if (plan.id === 'advanced') {
    return { label: t('Advanced', '高级版'), Icon: Star };
  }
  if (plan.id === 'flagship') {
    return { label: t('Flagship', '旗舰版'), Icon: Crown };
  }
  return { label: t('Standard', '标准版'), Icon: Sparkles };
}

function FixedPayPalButtons({
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
    <div
      className={cn(
        'paypal-topup-buttons relative w-full',
        disabled && 'pointer-events-none opacity-60',
      )}
    >
      <PayPalButtons
        style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal', tagline: false }}
        disabled={disabled}
        forceReRender={[amountCents]}
        createOrder={async () => {
          onProcessing(true);
          try {
            const order = await billing.createTopupOrder({
              amount_cents: amountCents,
              package_id: 'standard',
            });
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
