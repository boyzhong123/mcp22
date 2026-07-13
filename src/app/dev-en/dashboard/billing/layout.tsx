import type { ReactNode } from 'react';
import { SectionTabs, type SectionTab } from '../../_components/section-tabs';

const TABS: SectionTab[] = [
  {
    href: '/dashboard/billing',
    label: 'Overview',
    zhLabel: '概览',
    description:
      'Available evaluation points, usage, and account limits.',
    zhDescription: '可用评测积分、消耗与账户上限。',
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
      'Point deductions for word, sentence, and paragraph evaluations.',
    zhDescription: '字、词、句与段落评测的积分扣减规则。',
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
