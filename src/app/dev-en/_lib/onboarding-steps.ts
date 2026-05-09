export interface TourStep {
  id: string;
  /** CSS selector for the element to highlight. null = centered modal (no spotlight). */
  selector: string | null;
  /** Icon key rendered on the tour card. */
  icon:
    | 'sparkles'
    | 'layout'
    | 'key'
    | 'usage'
    | 'wallet'
    | 'settings'
    | 'book';
  title: string;
  zhTitle?: string;
  body: string;
  zhBody?: string;
  /** Placement hint for the floating card. 'auto' picks the best side automatically. */
  placement?: 'center' | 'auto';
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    selector: null,
    placement: 'center',
    icon: 'sparkles',
    title: 'Welcome to Chivox MCP',
    zhTitle: '欢迎使用 Chivox MCP',
    body: "Quick 7-step tour of your developer console — we'll show you where everything lives. You can skip at any time.",
    zhBody: '6 步快速了解开发者控制台：Key、用量、账单与设置。一分钟上手，随时可跳过。',
  },
  {
    id: 'overview',
    selector: '[data-tour="nav-overview"]',
    placement: 'auto',
    icon: 'layout',
    title: 'Overview — your daily snapshot',
    zhTitle: '概览 — 每日用量速览',
    body: 'See total calls this month, account alerts, recent activity, and quick links to common actions.',
    zhBody: '查看本月累计调用次数、账号告警、最近动态，以及常用操作的快捷入口。',
  },
  {
    id: 'keys',
    selector: '[data-tour="nav-keys"]',
    placement: 'auto',
    icon: 'key',
    title: 'API Keys — create & manage keys',
    zhTitle: 'API 密钥 — 创建与管理 Key',
    body: 'Create as many keys as you need. Every key shares the same account wallet + free trial — you can pin important keys and set per-key guardrails.',
    zhBody: '按需创建任意数量 Key。所有 Key 共享账户钱包与免费试用；支持置顶常用 Key，并为单个 Key 设置消费/调用上限护栏。',
  },
  {
    id: 'usage',
    selector: '[data-tour="nav-usage"]',
    placement: 'auto',
    icon: 'usage',
    title: 'Usage — call charts & breakdowns',
    zhTitle: '用量 — 调用趋势与明细',
    body: 'View daily call trends and cost breakdowns. Filter by key, export CSV, and quickly jump from a key to its usage.',
    zhBody: '查看每日调用趋势与成本拆分。支持按 Key 过滤、导出 CSV，并可从 Key 一键跳转到用量页。',
  },
  {
    id: 'billing',
    selector: '[data-tour="nav-billing"]',
    placement: 'auto',
    icon: 'wallet',
    title: 'Billing — top up your wallet',
    zhTitle: '账单 — 充值到钱包',
    body: 'Top up dollars into your account wallet. Higher amounts unlock bonus credits automatically. Every key spends from the same wallet after the free trial is exhausted.',
    zhBody: '按“金额”充值到账户钱包，金额越高自动赠送越多。免费试用用完后，所有 Key 从同一钱包扣费。',
  },
  {
    id: 'settings',
    selector: '[data-tour="nav-settings"]',
    placement: 'auto',
    icon: 'settings',
    title: 'Settings — limits & notifications',
    zhTitle: '设置 — 上限与通知',
    body: 'Set account-wide daily/monthly limits, configure low-balance alerts, and tune notification emails.',
    zhBody: '设置账户级日/月上限，配置低余额提醒，并管理通知邮件偏好。',
  },
  {
    id: 'docs',
    selector: '[data-tour="nav-docs"]',
    placement: 'auto',
    icon: 'book',
    title: 'API Docs — MCP spec & quickstart',
    zhTitle: 'API 文档 — MCP 规范与快速上手',
    body: 'Full MCP spec, quickstart guides, error code reference, and SDK examples. Opens in the same tab with a back button.',
    zhBody: '完整 MCP 规范、快速上手指南、错误码参考与 SDK 示例，点左上角返回键回到控制台。',
  },
];
