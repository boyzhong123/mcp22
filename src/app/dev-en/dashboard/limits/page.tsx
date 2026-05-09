'use client';

import { Gauge } from 'lucide-react';
import { PageHeader } from '../../_components/page-header';
import { SpendLimitForm } from '../../_components/spend-limit-modal';

/**
 * Account-level spend & call cap configuration page.
 *
 * Single canonical home for the four caps (daily / monthly × $ /
 * calls) plus warning thresholds. Other pages should display these
 * values read-only and link here for editing — the goal is "one
 * place to change limits, many places to read them".
 */
export default function LimitsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        icon={Gauge}
        title="Limits"
        zhTitle="调用与消费上限"
        description="Account-wide guardrails. Caps apply to every API key on the account; whichever cap is hit first stops traffic."
        zhDescription="账户级硬性限制，对所有 API Key 同时生效。任意维度先达到上限即停止服务。"
      />
      <div className="rounded-2xl border border-border bg-background p-5">
        <SpendLimitForm />
      </div>
    </div>
  );
}
