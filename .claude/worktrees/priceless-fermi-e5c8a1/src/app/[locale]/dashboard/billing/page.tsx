'use client';

import { useState, useMemo } from 'react';
import { Receipt, Calculator, CreditCard } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { generateBillingRecords, calculateCost, PLAN_DETAILS } from '@/lib/mock-data';
import { useLocale } from 'next-intl';

export default function BillingPage() {
  const locale = useLocale();
  const isZh = locale.startsWith('zh');
  const t = {
    title: isZh ? '费用账单' : 'Billing',
    subtitle: isZh ? '查看账单明细和费用预估' : 'View billing details and estimates',
    currentPlan: isZh ? '当前套餐' : 'Current Plan',
    free: isZh ? '免费' : 'Free',
    custom: isZh ? '定制报价' : 'Custom quote',
    perMonth: isZh ? '/月' : '/mo',
    monthlyCost: isZh ? '本月费用' : 'This Month Cost',
    overageCalls: isZh ? '超额调用' : 'Overage Calls',
    billedAt: isZh ? '按 ¥0.003/次计费' : 'Billed at ¥0.003/call',
    calcTitle: isZh ? '费用计算器' : 'Cost Calculator',
    calcDesc: isZh ? '输入预计月调用量，查看推荐套餐和费用预估' : 'Estimate plan and monthly cost by expected calls',
    inputPlaceholder: isZh ? '输入预计月调用量' : 'Enter expected monthly calls',
    callsPerMonth: isZh ? '次/月' : 'calls/mo',
    recPlan: isZh ? '推荐方案' : 'Recommended Plan',
    planFee: isZh ? '套餐费用' : 'Plan Fee',
    overage: isZh ? '超额' : 'Overage',
    estimatedTotal: isZh ? '预估总费用' : 'Estimated Total',
    history: isZh ? '历史账单' : 'Billing History',
    month: isZh ? '月份' : 'Month',
    plan: isZh ? '套餐' : 'Plan',
    planFeeHead: isZh ? '套餐费' : 'Plan Fee',
    overageCallsHead: isZh ? '超额调用' : 'Overage Calls',
    overageFee: isZh ? '超额费用' : 'Overage Fee',
    total: isZh ? '总费用' : 'Total',
    status: isZh ? '状态' : 'Status',
    paid: isZh ? '已支付' : 'Paid',
    pending: isZh ? '待支付' : 'Pending',
  };
  const { user } = useAuth();
  const billingRecords = useMemo(() => generateBillingRecords(), []);
  const currentPlan = PLAN_DETAILS[user?.plan || 'free'];
  const currentBill = billingRecords[0];

  const [calcInput, setCalcInput] = useState('');
  const calcResult = useMemo(() => {
    const num = parseInt(calcInput);
    if (isNaN(num) || num < 0) return null;
    return calculateCost(num);
  }, [calcInput]);

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight mb-2">{t.title}</h1>
      <p className="text-sm text-muted-foreground mb-8">{t.subtitle}</p>

      {/* Current Month Summary */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <CreditCard className="h-4 w-4" />
            <span className="text-xs font-medium">{t.currentPlan}</span>
          </div>
          <div className="text-lg font-bold">{currentPlan.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {currentPlan.price === 0 ? t.free : currentPlan.price === -1 ? t.custom : `¥${currentPlan.price}${t.perMonth}`}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Receipt className="h-4 w-4" />
            <span className="text-xs font-medium">{t.monthlyCost}</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tabular-nums">¥{currentBill?.total.toFixed(2) || '0.00'}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {isZh ? '套餐' : 'Plan'} ¥{currentBill?.planFee.toFixed(2) || '0.00'} + {isZh ? '超额' : 'Overage'} ¥{currentBill?.extraFee.toFixed(2) || '0.00'}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Calculator className="h-4 w-4" />
            <span className="text-xs font-medium">{t.overageCalls}</span>
          </div>
          <div className="text-2xl font-bold tabular-nums">{currentBill?.extraCalls.toLocaleString() || 0}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{t.billedAt}</div>
        </div>
      </div>

      {/* Cost Calculator */}
      <div className="rounded-xl border border-border bg-background p-6 mb-8 max-w-2xl">
        <h2 className="text-lg font-bold tracking-tight mb-1">{t.calcTitle}</h2>
        <p className="text-sm text-muted-foreground mb-5">{t.calcDesc}</p>

        <div className="flex items-center gap-3 mb-5">
          <input
            type="number"
            value={calcInput}
            onChange={e => setCalcInput(e.target.value)}
            placeholder={t.inputPlaceholder}
            min={0}
            className="flex-1 h-10 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30 transition-colors placeholder:text-muted-foreground tabular-nums"
          />
          <span className="text-sm text-muted-foreground shrink-0">{t.callsPerMonth}</span>
        </div>

        {calcResult && (
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t.recPlan}</span>
              <span className="font-medium">{calcResult.plan}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t.planFee}</span>
              <span className="tabular-nums">¥{calcResult.planFee.toFixed(2)}</span>
            </div>
            {calcResult.extraCalls > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t.overage} {calcResult.extraCalls.toLocaleString()} {isZh ? '次' : 'calls'}</span>
                <span className="tabular-nums">¥{calcResult.extraFee.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-border pt-2.5 flex items-center justify-between text-sm font-bold">
              <span>{t.estimatedTotal}</span>
              <span className="tabular-nums">¥{calcResult.total.toFixed(2)}{t.perMonth}</span>
            </div>
            <p className="text-xs text-muted-foreground pt-1">{calcResult.recommendation}</p>
          </div>
        )}
      </div>

      {/* Billing History */}
      <h2 className="text-lg font-bold tracking-tight mb-4">{t.history}</h2>
      <div className="rounded-xl border border-border bg-background overflow-hidden max-w-4xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t.month}</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t.plan}</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t.planFeeHead}</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t.overageCallsHead}</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t.overageFee}</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t.total}</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {billingRecords.map(b => (
                <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 px-4 font-medium">{b.month}</td>
                  <td className="py-2.5 px-4 text-muted-foreground">{b.plan}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums">¥{b.planFee.toFixed(2)}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums text-muted-foreground">{b.extraCalls.toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums">¥{b.extraFee.toFixed(2)}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums font-medium">¥{b.total.toFixed(2)}</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`inline-block text-[11px] px-2 py-0.5 rounded-md ${
                      b.status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {b.status === 'paid' ? t.paid : t.pending}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
