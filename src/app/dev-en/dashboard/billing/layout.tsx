import type { ReactNode } from 'react';
import { SectionTabs, type SectionTab } from '../../_components/section-tabs';

const TABS: SectionTab[] = [
  {
    href: '/dashboard/billing',
    label: 'Overview',
    zhLabel: '概览',
    description:
      'Evaluation point balance, usage, and account limits.',
    zhDescription: '评测积分余额、消耗与账户上限。',
  },
  {
    href: '/dashboard/billing/history',
    label: 'History',
    zhLabel: '充值记录',
    description:
      'Searchable recharge records with payment and credited-point details.',
    zhDescription: '可搜索的充值记录，含支付金额与到账积分明细。',
  },
  {
    href: '/dashboard/billing/rates',
    label: 'Rates',
    zhLabel: '费率',
    description:
      'Tiered per-call pricing by monthly usage — $0.007 down to $0.005/call.',
    zhDescription: '按月用量阶梯计价 — $0.007 起，最低 $0.005/次。',
  },
];

export default function BillingLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <SectionTabs title="Billing" zhTitle="账单" tabs={TABS} />
      {children}
    </div>
  );
}
