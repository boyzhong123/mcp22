import type { ReactNode } from 'react';
import { SectionTabs, type SectionTab } from '../../_components/section-tabs';

const TABS: SectionTab[] = [
  {
    href: '/dashboard/billing',
    label: 'Overview',
    zhLabel: '概览',
    description:
      'Money in, money out — credits remaining, spend this month, and monthly limit.',
    zhDescription: '资金流入流出——剩余额度、本月消费、月度上限。',
  },
  {
    href: '/dashboard/billing/history',
    label: 'History',
    zhLabel: '充值记录',
    description:
      'Every top-up and invoice in one searchable, CSV-exportable list.',
    zhDescription: '所有充值与发票，可搜索、可导出 CSV。',
  },
  {
    href: '/dashboard/billing/rates',
    label: 'Rates',
    zhLabel: '费率',
    description:
      'Pay-as-you-go per 1,000 calls. Volume discounts apply automatically.',
    zhDescription: '按每 1000 次调用计费。批量折扣自动应用。',
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
