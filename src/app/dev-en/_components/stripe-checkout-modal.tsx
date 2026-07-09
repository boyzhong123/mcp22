'use client';

import { Check, Sparkles, TrendingDown, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Transaction } from '../_lib/mock-store';
import { useLang } from '../_lib/use-lang';
import { StripeCheckoutModalLegacy } from './stripe-checkout-modal-legacy';
import { StripeCheckoutModalPackages } from './stripe-checkout-modal-packages';

export type CheckoutModalVariant = 'packages' | 'legacy';

interface StripeCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (txn: Transaction) => void;
  /** Accepted for back-compat; wallet top-ups are account-wide. */
  keyId?: string;
}

/**
 * Entry point for "Add credits". Shows a version picker first so product /
 * design can compare the new evaluation-point packages flow (Codex) against
 * the committed legacy wallet + volume-tier flow.
 */
export function StripeCheckoutModal({
  open,
  onClose,
  onSuccess,
  keyId,
}: StripeCheckoutModalProps) {
  // Remount on every open so HMR / Fast Refresh cannot keep a previously
  // selected variant and skip the picker.
  const [session, setSession] = useState(0);

  useEffect(() => {
    if (open) setSession((n) => n + 1);
  }, [open]);

  if (!open) return null;

  return (
    <CheckoutSession
      key={session}
      onClose={onClose}
      onSuccess={onSuccess}
      keyId={keyId}
    />
  );
}

function CheckoutSession({
  onClose,
  onSuccess,
  keyId,
}: Omit<StripeCheckoutModalProps, 'open'>) {
  const [variant, setVariant] = useState<CheckoutModalVariant | null>(null);
  const switchVariant = () => setVariant(null);

  if (!variant) {
    return <CheckoutVariantPicker onClose={onClose} onSelect={setVariant} />;
  }

  if (variant === 'legacy') {
    return (
      <StripeCheckoutModalLegacy
        open
        onClose={onClose}
        onSuccess={onSuccess}
        keyId={keyId}
        onSwitchVariant={switchVariant}
      />
    );
  }

  return (
    <StripeCheckoutModalPackages
      open
      onClose={onClose}
      onSuccess={onSuccess}
      keyId={keyId}
      onSwitchVariant={switchVariant}
    />
  );
}

function CheckoutVariantPicker({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (variant: CheckoutModalVariant) => void;
}) {
  const { t } = useLang();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label={t('Close', '关闭')}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-variant-title"
        className="relative w-full max-w-lg rounded-2xl border border-border bg-background shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            <h2 id="checkout-variant-title" className="text-sm font-semibold">
              {t('Choose checkout experience', '选择充值页面版本')}
            </h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {t('Compare the new package flow with the legacy wallet flow.', '对比新包档位页与老版钱包充值页。')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50"
            aria-label={t('Close', '关闭')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <VariantCard
            title={t('New · Evaluation packages', '新版 · 评测点套餐')}
            badge={t('Recommended', '推荐')}
            icon={<Sparkles className="h-5 w-5 text-sky-600" />}
            highlights={[
              t('Personal / Business toggle', '个人 / 企业切换'),
              t('Standard · Advanced · Flagship tiers', '标准 / 高级 / 旗舰档位'),
              t('Bonus eval points + 30-day validity', '赠送评测点 + 30 天有效期'),
            ]}
            onClick={() => onSelect('packages')}
            tone="sky"
          />
          <VariantCard
            title={t('Legacy · Wallet top-up', '老版 · 钱包充值')}
            icon={<TrendingDown className="h-5 w-5 text-emerald-600" />}
            highlights={[
              t('Monthly volume pricing ladder', '月用量阶梯价'),
              t('$10 – $500 preset amounts', '$10 – $500 预设金额'),
              t('Estimated calls by usage tier', '按档位估算可调用次数'),
            ]}
            onClick={() => onSelect('legacy')}
            tone="emerald"
          />
        </div>

        <div className="border-t border-border/60 bg-muted/20 px-5 py-3 text-[10px] leading-relaxed text-muted-foreground">
          {t(
            'You can switch versions anytime from inside the checkout header. Both flows share the same PayPal payment step.',
            '进入充值页后，也可点右上角「切换版本」随时对比。付款步骤相同。',
          )}
        </div>
      </div>
    </div>
  );
}

function VariantCard({
  title,
  badge,
  icon,
  highlights,
  onClick,
  tone,
}: {
  title: string;
  badge?: string;
  icon: React.ReactNode;
  highlights: string[];
  onClick: () => void;
  tone: 'sky' | 'emerald';
}) {
  const { t } = useLang();
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex h-full flex-col rounded-xl border bg-background p-4 text-left transition-all',
        'hover:-translate-y-px hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30',
        tone === 'sky'
          ? 'border-sky-300/50 hover:border-sky-400/70 hover:bg-sky-500/[0.03]'
          : 'border-border/80 hover:border-emerald-500/35 hover:bg-emerald-500/[0.03]',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl',
            tone === 'sky' ? 'bg-sky-500/10' : 'bg-emerald-500/10',
          )}
        >
          {icon}
        </span>
        {badge && (
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-3 text-sm font-bold text-foreground">{title}</div>
      <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-muted-foreground">
        {highlights.map((line) => (
          <li key={line} className="flex items-start gap-1.5">
            <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600/70" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <span
        className={cn(
          'mt-4 text-[11px] font-semibold',
          tone === 'sky' ? 'text-sky-700' : 'text-emerald-700',
        )}
      >
        {tone === 'sky'
          ? t('Open new checkout →', '打开新版 →')
          : t('Open legacy checkout →', '打开老版 →')}
      </span>
    </button>
  );
}
