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
    | 'gauge'
    | 'settings'
    | 'book'
    | 'lifebuoy';
  title: string;
  zhTitle?: string;
  body: string;
  zhBody?: string;
  /** Placement hint for the floating card. 'auto' picks the best side automatically. */
  placement?: 'center' | 'auto';
}

/**
 * Walkthrough of the developer console, in the exact order the sidebar
 * lists its sections (Overview → Keys → Usage → Billing → Limits →
 * Settings → Docs), then a closing "how to get help" beat that points at
 * the floating Contact launcher. Keep this in sync with `NAV` in
 * `_components/sidebar.tsx` — every `selector` here targets a `data-tour`
 * anchor rendered there.
 */
export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    selector: null,
    placement: 'center',
    icon: 'sparkles',
    title: 'Welcome to Chivox MCP',
    zhTitle: '欢迎使用 Chivox MCP',
    body: "A quick walkthrough of your developer console — keys, usage, billing, limits and docs. It takes under a minute, and you can skip anytime.",
    zhBody: '快速了解开发者控制台：API 密钥、用量、账单、上限与文档。不到一分钟，随时可跳过。',
  },
  {
    id: 'overview',
    selector: '[data-tour="nav-overview"]',
    placement: 'auto',
    icon: 'layout',
    title: 'Overview — your daily snapshot',
    zhTitle: '概览 — 每日速览',
    body: 'Available evaluation points, free-trial progress, points and calls this month, top keys, and recent top-ups — all at a glance.',
    zhBody: '一屏掌握可用评测积分、免费试用进度、本月积分消耗与调用次数、热门 Key 以及最近充值记录。',
  },
  {
    id: 'keys',
    selector: '[data-tour="nav-keys"]',
    placement: 'auto',
    icon: 'key',
    title: 'API Keys — create & manage keys',
    zhTitle: 'API 密钥 — 创建与管理 Key',
    body: 'Create as many keys as you need. Every key shares the same evaluation-point pool and free trial — pin the important ones and set per-key guardrails.',
    zhBody: '按需创建任意数量 Key。所有 Key 共享评测积分池与免费试用；支持置顶常用 Key，并为单个 Key 设置积分/调用护栏。',
  },
  {
    id: 'usage',
    selector: '[data-tour="nav-usage"]',
    placement: 'auto',
    icon: 'usage',
    title: 'Usage — call charts & breakdowns',
    zhTitle: '用量 — 调用趋势与明细',
    body: 'Daily call trends and cost breakdowns. Filter by key, export CSV, and jump straight from a key to its usage.',
    zhBody: '查看每日调用趋势与成本拆分。支持按 Key 过滤、导出 CSV，并可从 Key 一键跳转到用量页。',
  },
  {
    id: 'billing',
    selector: '[data-tour="nav-billing"]',
    placement: 'auto',
    icon: 'wallet',
    title: 'Billing — top up & pay-as-you-go',
    zhTitle: '账单 — 充值与按量付费',
    body: 'Start on the free trial, then choose a package to add evaluation points to the shared pool. Review top-up history, point expiry, and unit rates here too.',
    zhBody: '先用免费试用，用完后选择套餐为共享积分池充值。这里还能查看充值记录、积分有效期与每次调用的费率。',
  },
  {
    id: 'limits',
    selector: '[data-tour="nav-limits"]',
    placement: 'auto',
    icon: 'gauge',
    title: 'Limits — daily & monthly caps',
    zhTitle: '上限 — 日 / 月积分上限',
    body: 'Set account-wide point and call caps so a runaway integration can never exhaust your point pool. Get alerted as you approach a cap.',
    zhBody: '设置账户级的积分 / 调用上限，避免异常调用耗尽评测积分；接近上限时还会收到提醒。',
  },
  {
    id: 'settings',
    selector: '[data-tour="nav-settings"]',
    placement: 'auto',
    icon: 'settings',
    title: 'Settings — notifications & profile',
    zhTitle: '设置 — 通知与资料',
    body: 'Tune low-point alerts and notification emails, manage members, and update your account profile.',
    zhBody: '调整低积分提醒与通知邮件、管理成员，并更新账户资料。',
  },
  {
    id: 'docs',
    selector: '[data-tour="nav-docs"]',
    placement: 'auto',
    icon: 'book',
    title: 'API Docs — MCP spec & quickstart',
    zhTitle: 'API 文档 — MCP 规范与快速上手',
    body: 'Full MCP spec, quickstart guides, error-code reference, and SDK examples. Opens in the same tab with a back button.',
    zhBody: '完整 MCP 规范、快速上手指南、错误码参考与 SDK 示例，点左上角返回键回到控制台。',
  },
  {
    id: 'help',
    selector: '[data-tour="contact-launcher"]',
    placement: 'auto',
    icon: 'lifebuoy',
    title: "That's it — need a hand?",
    zhTitle: '完成啦 — 需要帮助？',
    body: 'Tap Contact anytime to reach support & sales, press ⌘K to jump anywhere, and replay this tour from the ? in the top bar.',
    zhBody: '随时点击「联系我们」联系支持与销售；按 ⌘K 快速跳转；点击顶栏的 ? 可重新观看本引导。',
  },
];
