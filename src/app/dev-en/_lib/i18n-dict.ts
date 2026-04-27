/**
 * Dev-time English → Chinese dictionary for /dev-en/* pages.
 *
 * The dashboard ships English-only, but we expose a 中/EN toggle so the
 * product owner can sanity-check content in Chinese. Rather than force every
 * JSX literal through a verbose `t('English', '中文')` pair, we look up the
 * English source string here and fall back to the English if a translation
 * isn't registered yet.
 *
 * Guideline when adding entries:
 *  - Use the EXACT English source string as the key (including punctuation,
 *    capitalisation, trailing spaces). This makes grep-based auditing trivial.
 *  - For product terms that should stay English even in Chinese (API, key,
 *    Stripe, ACH, Wire, Apple Pay, Google Pay, PayPal, Cash App Pay,
 *    Amazon Pay, Link, CSV, OAuth, SDK, UUID, Appkey), KEEP them verbatim in
 *    the Chinese copy — that matches how Chinese developers refer to them.
 *  - For template strings that include interpolated values, prefer the
 *    `t(en, zh)` form from use-lang.ts instead.
 */

export const DICT: Record<string, string> = {
  // ── Navigation / shell ──────────────────────────────────────────────
  Overview: '概览',
  'API Keys': 'API 密钥',
  Usage: '用量',
  Billing: '账单',
  Pricing: '价格',
  'Top-up history': '充值记录',
  'Top-ups': '充值',
  Team: '团队',
  Settings: '设置',
  Account: '账号',
  Resources: '资源',
  'API Docs': 'API 文档',
  Dashboard: '控制台',
  'Sign out': '退出登录',
  'Log out': '退出登录',
  Logout: '退出登录',

  // ── Login page ──────────────────────────────────────────────────────
  'Sign in': '登录',
  'Sign up': '注册',
  'Sign in to continue': '登录以继续',
  'Sign in to your developer account': '登录你的开发者账号',
  'Create your developer account': '创建开发者账号',
  'Continue with GitHub': '使用 GitHub 登录',
  'Continue with Google': '使用 Google 登录',
  'Continue with email': '使用邮箱登录',
  'or continue with': '或使用以下方式登录',
  Email: '邮箱',
  'Work email': '邮箱',
  Password: '密码',
  'Remember me': '记住我',
  'Forgot password?': '忘记密码？',
  'Phone number': '手机号',
  'Verification code': '验证码',
  'Send code': '发送验证码',
  'Resend code': '重发验证码',
  Code: '验证码',
  'I agree to the Terms of Service and Privacy Policy':
    '我同意《服务条款》与《隐私政策》',
  "Don't have an account?": '还没有账号？',
  'Already have an account?': '已有账号？',
  'Sign in instead': '去登录',
  'Create one': '立即注册',

  // ── Topbar / breadcrumb ─────────────────────────────────────────────
  Search: '搜索',
  Docs: '文档',
  Notifications: '通知',
  'Dark mode': '深色模式',
  'Light mode': '浅色模式',
  'Theme: Light': '主题：浅色',
  'Theme: Dark': '主题：深色',
  'Toggle theme': '切换主题',
  Profile: '个人资料',

  // ── Generic actions ─────────────────────────────────────────────────
  Save: '保存',
  'Save changes': '保存修改',
  'Save payment method': '保存支付方式',
  Cancel: '取消',
  Close: '关闭',
  Done: '完成',
  Delete: '删除',
  Remove: '移除',
  Revoke: '吊销',
  Rotate: '轮换',
  Copy: '复制',
  Copied: '已复制',
  'Copied!': '已复制！',
  Edit: '编辑',
  Create: '创建',
  Add: '添加',
  Update: '更新',
  Apply: '应用',
  Confirm: '确认',
  Continue: '继续',
  Back: '返回',
  Next: '下一步',
  Retry: '重试',
  Reset: '重置',
  Details: '详情',
  View: '查看',
  'View all': '查看全部',
  'Show more': '展开更多',
  'Show less': '收起',
  'Learn more': '了解更多',
  Export: '导出',
  Import: '导入',
  Download: '下载',
  Upload: '上传',
  Refresh: '刷新',
  Filter: '筛选',
  Clear: '清除',
  'Clear all': '清除全部',
  'Select all': '全选',
  'All projects': '全部项目',
  'All keys': '全部 key',
  'All models': '全部模型',
  'All time': '全部时间',
  All: '全部',
  None: '无',
  Default: '默认',
  Optional: '可选',
  Required: '必填',
  Active: '活跃',
  Inactive: '未激活',
  Revoked: '已吊销',
  Pending: '待处理',
  Failed: '失败',
  Succeeded: '成功',
  Success: '成功',
  Error: '错误',
  Loading: '加载中',
  'Loading…': '加载中…',
  Processing: '处理中',
  'Processing…': '处理中…',
  Verifying: '验证中',
  'Verifying device…': '设备验证中…',
  Sending: '发送中',
  'Sending…': '发送中…',
  'Code sent': '验证码已发送',
  Resending: '重发中',
  Saved: '已保存',
  'Saved securely': '已安全保存',
  'Not set': '未设置',
  'No data': '暂无数据',
  'No results': '无结果',

  // ── Overview / KPI tiles ────────────────────────────────────────────
  Welcome: '欢迎',
  'Welcome back': '欢迎回来',
  'Good morning': '早上好',
  'Good afternoon': '下午好',
  'Good evening': '晚上好',
  "Here's what's happening across your keys.": '以下是你账号下 key 的整体情况。',
  'Account balance': '账户余额',
  'Total balance': '总余额',
  'Credits remaining': '剩余额度',
  'Total credits': '总额度',
  'Credits left': '剩余额度',
  'Spend this month': '本月消费',
  'Spent this month': '本月消费',
  'This month': '本月',
  'This week': '本周',
  'Last 7 days': '最近 7 天',
  'Last 28 days': '最近 28 天',
  'Last 30 days': '最近 30 天',
  'Last 90 days': '最近 90 天',
  'Last month': '上月',
  'Calls today': '今日调用',
  'API calls': 'API 调用',
  'Total calls': '总调用',
  Calls: '调用',
  'Success rate': '成功率',
  'Error rate': '错误率',
  Latency: '延迟',
  'Avg latency': '平均延迟',
  'P95 latency': 'P95 延迟',
  'p95 latency': 'P95 延迟',
  'Recent activity': '近期活动',
  'Quick links': '快捷入口',
  'Quick actions': '快捷操作',
  'View docs': '查看文档',
  'Contact sales': '联系销售',
  'View usage': '查看用量',
  'View billing': '查看账单',
  'View all keys': '查看全部 key',
  'Manage keys': '管理 key',
  'Add credits': '充值',
  'Add credits to this key': '为此 key 充值',
  'Add credits to a key': '为 key 充值',
  'Add credits to': '充值到',
  'Top up': '充值',
  'Buy credits': '购买额度',
  'Manage spend limit': '管理消费上限',
  'Modify spend limit': '修改消费上限',
  'Spend cap': '消费上限',
  'Spend limit': '消费上限',
  'Monthly spend cap': '月度消费上限',
  'Low-balance alert': '低余额提醒',
  'No spend cap': '未设上限',
  'No low-balance alert': '未设低余额提醒',
  'No cap': '未设上限',
  'No alert': '未设提醒',
  'Cap reached': '已触达上限',
  Starter: '入门',
  'Starter Key': '入门 Key',
  'Starter key': '入门 Key',
  'Free allowance': '免费额度',
  'Free tier': '免费层',
  'Paid keys': '付费 Key',
  'Paid Keys': '付费 Key',
  'Paid Key': '付费 Key',
  'Paid key': '付费 Key',
  'provisioned with your account': '账号创建时自动预置',

  // ── API Keys page ───────────────────────────────────────────────────
  'Create paid key': '创建付费 Key',
  'New paid key': '新建付费 Key',
  'New key': '新建 Key',
  'Create key': '创建 Key',
  'Key name': 'Key 名称',
  'Key label': 'Key 名称',
  Project: '项目',
  Environment: '环境',
  Production: '生产',
  Development: '开发',
  Staging: '测试',
  'API key': 'API key',
  AppKey: 'AppKey',
  Appkey: 'AppKey',
  Secret: '密钥',
  'Copy key': '复制 key',
  'Reveal key': '显示 key',
  'Hide key': '隐藏 key',
  'Rotate key': '轮换 key',
  'Revoke key': '吊销 key',
  'Revoke this key': '吊销此 key',
  'Delete key': '删除 key',
  'Key revoked': 'Key 已吊销',
  'Last used': '最近使用',
  'Created on': '创建于',
  Created: '创建时间',
  'Created by': '创建者',
  Used: '已用',
  Remaining: '剩余',
  'Daily limit': '每日上限',
  'Total limit': '总量上限',
  'Per day': '每日',
  'Total free quota': '总免费额度',
  'Daily free quota': '每日免费额度',
  'Free requests per day': '每日免费请求数',
  'Free requests total': '免费请求总数',
  Configure: '配置',
  'Configure spend cap and low-balance alerts': '配置消费上限与低余额提醒',
  'Spend cap & low-balance alerts': '消费上限与低余额提醒',
  'Needs credits': '需充值',
  'Top up to activate': '充值后即可启用',
  'Credits needed': '需要充值',
  'Fund this key': '为此 key 充值',
  Status: '状态',
  Balance: '余额',
  'Balance remaining': '剩余余额',
  'Your Starter Key': '你的入门 Key',
  'Pre-provisioned — no signup required':
    '账号预置 —— 无需手动创建',
  'This key is free forever, but capped at 30 calls/day and 900 calls total.':
    '此 key 永久免费，每天上限 30 次、累计上限 900 次。',
  'Create and fund paid keys for production traffic.':
    '为生产流量创建并充值付费 key。',

  // ── Usage page ──────────────────────────────────────────────────────
  'Export CSV': '导出 CSV',
  'Export current view to CSV': '将当前视图导出为 CSV',
  'Filter by project': '按项目筛选',
  'Filter by key': '按 key 筛选',
  'Filter by model': '按模型筛选',
  'Group by': '分组方式',
  'Time range': '时间范围',
  'Custom range': '自定义范围',
  Model: '模型',
  'By project': '按项目',
  'By key': '按 key',
  'By model': '按模型',
  'Calls over time': '调用趋势',
  'Spend over time': '消费趋势',
  'No usage in this period': '此时段内暂无用量',

  // ── Billing / recharge history / plans ──────────────────────────────
  'Payment methods': '支付方式',
  'Payment method': '支付方式',
  'Default payment method': '默认支付方式',
  'Saved cards': '已保存的卡',
  'Manage saved cards': '管理已保存的卡',
  'Add card': '添加卡',
  'Add new card': '添加新卡',
  'Remove card': '移除卡',
  'Expires': '有效期至',
  'Billing address': '账单地址',
  'Tax information': '税务信息',
  Invoice: '发票',
  'Invoice ready': '发票可下载',
  'Download invoice': '下载发票',
  Receipt: '收据',
  'Payment receipts': '付款收据',
  'All transactions': '全部交易',
  Transaction: '交易',
  Transactions: '交易记录',
  Method: '方式',
  Amount: '金额',
  Date: '日期',
  'Pricing & spend limits': '价格与消费上限',
  'Pricing and spend limits': '价格与消费上限',
  'Pay as you go': '按用量计费',
  'Volume discount': '阶梯折扣',
  'Volume tier': '阶梯层级',
  'per 1K calls': '每千次调用',
  'per call': '每次调用',
  'Price per 1K calls': '每千次调用价格',
  'Rate card': '价格表',
  'Plan': '套餐',
  'Current plan': '当前套餐',

  // ── Stripe checkout modal ───────────────────────────────────────────
  'Add credits to your key': '为 key 充值',
  'Add payment method': '添加支付方式',
  'Add a payment method': '添加支付方式',
  'Which key?': '充值到哪个 key？',
  'Choose a key': '选择 key',
  'Select a project': '选择项目',
  'Select a key': '选择 key',
  'Create a paid key first': '请先创建付费 key',
  'Top-up amount': '充值金额',
  'Custom amount': '自定义金额',
  'Or enter custom amount (min $1.00)': '或输入自定义金额（最低 $1.00）',
  'Minimum $1.00': '最低 $1.00',
  'Express checkout': '快捷支付',
  'Or pay with card': '或使用银行卡支付',
  'Or pay by bank': '或使用银行转账',
  'Credit or debit card': '信用卡或借记卡',
  'Bank transfer · US': '银行转账 · 美国',
  'Use a different card': '使用其他卡',
  'New card': '新卡',
  'Visa, Mastercard, Amex': '支持 Visa、Mastercard、Amex',
  'Card number': '卡号',
  'Card details': '卡信息',
  'MM / YY': '月 / 年',
  CVC: '安全码',
  'Name on card': '持卡人姓名',
  Country: '国家/地区',
  Postal: '邮编',
  'Postal / ZIP': '邮编',
  'Save card for future payments': '保存此卡用于后续付款',
  'Apple Pay': 'Apple Pay',
  'Google Pay': 'Google Pay',
  Link: 'Link',
  PayPal: 'PayPal',
  'Cash App Pay': 'Cash App Pay',
  'Amazon Pay': 'Amazon Pay',
  'Authorize with Face ID or Touch ID': '使用 Face ID 或 Touch ID 授权',
  'Pay with your Google account': '使用 Google 账号支付',
  'One-click checkout by Stripe': 'Stripe 一键结账',
  'Pay with your PayPal balance or linked card': '使用 PayPal 余额或绑定的卡支付',
  'Scan a QR code from the Cash App': '使用 Cash App 扫码支付',
  'Use addresses and cards from your Amazon account':
    '使用 Amazon 账户中的地址与卡',
  'ACH direct debit': 'ACH 直接扣款',
  'Wire transfer': '电汇',
  Subtotal: '小计',
  'Estimated tax': '预估税费',
  'Total due': '应付总额',
  Total: '合计',
  'Runway estimate': '额度可用时长预估',
  'of runway at your current pace': '够你以当前速率继续使用',
  'Balance after': '充值后余额',
  'Daily burn': '日均消耗',
  'Last 28d': '最近 28 天',
  'Not enough history yet': '历史数据不足',
  'Sparse usage history — treat this as a rough guide, not a guarantee.':
    '历史用量偏少 —— 仅供参考，不构成保证。',
  'Demo checkout — no card is actually charged. Taxes collected via Stripe Tax.':
    '演示结账 —— 实际不会扣款，税费由 Stripe Tax 处理。',
  'Payment successful': '支付成功',
  'Wire instructions sent': '电汇指引已发送',
  'Card saved': '卡已保存',
  'Your new payment method is ready for future payments.':
    '新支付方式已就绪，可用于后续付款。',

  // ── Pay button dynamic ─────────────────────────────────────────────
  Pay: '支付',
  'Get wire instructions': '获取电汇指引',
  'Pay by ACH': '使用 ACH 支付',

  // ── Team page ──────────────────────────────────────────────────────
  Members: '成员',
  'Team members': '团队成员',
  'Invite member': '邀请成员',
  'Invite teammate': '邀请成员',
  'Pending invites': '待接受邀请',
  'Resend invite': '重新发送邀请',
  'Revoke invite': '撤回邀请',
  Role: '角色',
  Owner: '拥有者',
  Admin: '管理员',
  Developer: '开发者',
  Viewer: '只读',
  'Last active': '最近活跃',
  'Change role': '变更角色',

  // ── Settings / Notifications ───────────────────────────────────────
  'Account information': '账号信息',
  'Account info': '账号信息',
  'Display name': '显示名称',
  'Sign-in method': '登录方式',
  'Member since': '注册时间',
  'Email notifications': '邮件通知',
  'Weekly usage report': '周度用量报告',
  'Invoice ready to download': '发票可下载通知',
  'Spend limit alerts': '消费上限提醒',
  'Low-balance alerts': '低余额提醒',
  'Product updates': '产品更新',
  'Security alerts': '安全告警',
  'Always on — cannot be disabled.': '始终开启 —— 不可关闭。',

  // ── Misc phrases across screens ─────────────────────────────────────
  'Upgrade now': '立即升级',
  'Upgrade to paid': '升级到付费',
  'Starter key exhausted': '入门 Key 已用尽',
  'Your Starter key is out of free calls.': '你的入门 Key 免费额度已用完。',
  'Create or fund a paid key to keep building.':
    '创建付费 key 或充值以继续使用。',
  'See pricing': '查看价格',
  'Go to API keys': '前往 API 密钥',
  'Go to keys': '前往 API 密钥',
  'Back to dashboard': '返回控制台',

  // ── Extended coverage (auto-audit pass) ────────────────────────────
  // Login / developer console
  'Sign in to Chivox MCP': '登录 Chivox MCP',
  'Signing in': '登录中',
  'Welcome, developer. Continue with your provider or use a one-time code.':
    '欢迎，开发者。选择登录方式或使用一次性验证码。',
  'or with a one-time code': '或使用一次性验证码',
  'Your number is only used to deliver the verification code.':
    '手机号仅用于发送验证码。',
  'Email address': '邮箱地址',
  'Fill demo credentials': '填入演示账号',
  'Terms of Service': '服务条款',
  'Privacy Policy': '隐私政策',
  '6-digit code': '6 位验证码',
  'We sent a code to': '已发送验证码至',
  'Demo: any 6 digits work.': '演示模式：任意 6 位数字均可通过。',
  'Link email': 'Link 邮箱',
  "Link is Stripe's 1-click checkout. Verify your email once — after that your cards auto-fill across any Stripe site.":
    'Link 是 Stripe 的一键结账。验证一次邮箱，之后你的卡会在所有 Stripe 网站自动填充。',
  'Developer Console · Preview': '开发者控制台 · 预览',
  Dev: '开发',
  Experimental: '实验版',
  'speech-grade MCP': '语音级 MCP',
  'Build with': '使用',

  // Filters / time / KPIs
  Today: '今日',
  'Peak day': '峰值日',
  'Avg / day': '日均',
  'Net cost': '净消费',
  Cost: '消费',
  'Spend MTD': '本月至今消费',
  'No spend': '无消费',
  'No usage': '无用量',
  'No usage in this window.': '此时段暂无用量。',
  'Credits by paid key': '各付费 key 余额',
  'Daily calls by key': '按 Key 查看每日调用',
  'View usage for this key': '查看此 Key 的用量',
  'Per-key breakdown': '按 Key 拆分',
  'Volume discounts applied': '已应用阶梯折扣',
  'Effective savings': '实际节省',
  Savings: '节省',
  'Savings this month': '本月节省',
  Credits: '额度',
  'Credits added': '已充值额度',
  'Total paid': '累计支付',
  'Total transactions': '累计交易',
  'Latest top-up': '最近一次充值',
  'Recent top-ups': '最近充值',
  'Monthly spend limit': '月度消费上限',
  'Monthly spend limit (USD)': '月度消费上限（USD）',
  'Monthly cap enforced across all your API keys':
    '针对你所有 API key 统一执行的月度上限',
  'Cap at': '上限',
  'Email me when balance drops below': '余额低于以下值时邮件提醒',
  'Low-balance email alert': '低余额邮件提醒',
  'Email warnings at': '以下余额时邮件提醒',

  // Pricing / plans
  'Amount (USD)': '金额（USD）',
  'Base rate · USD': '基础价 · USD',
  'Base rates': '基础价',
  'MCP call rate': 'MCP 调用费率',
  'Per successful call': '每次成功调用',
  'Charged per 1,000 successful MCP calls. Errors (4xx/5xx) are not billed.':
    '按每 1,000 次成功的 MCP 调用计费，错误请求（4xx/5xx）不计费。',
  'No development keys yet.': '暂无开发 Key。',
  'No production keys yet. Create one when you are ready to ship.':
    '暂无生产 Key，准备发布时再创建即可。',
  'No paid keys match that project filter.': '没有符合该项目筛选的付费 Key。',
  'Live credentials serving real traffic — guard these and keep them topped up.':
    '承载真实流量的密钥 — 请妥善保管并按时充值。',
  'Use for testing, staging, and local work. Separate balance keeps experiments from draining prod.':
    '用于测试、预发布和本地开发。独立余额避免调试消耗生产配额。',
  'per month': '每月',
  'Pay-as-you-go': '按用量计费',
  'pay-as-you-go pricing': '按用量计费',
  'Only pay for what you ship': '用多少付多少',
  'Automatic volume discounts': '自动阶梯折扣',
  'Applied in real-time as your monthly call volume crosses each threshold.':
    '当你月度调用量跨过阈值时实时生效。',
  'Charged per 1,000 successful calls. Errors (4xx/5xx) are not billed.':
    '按每 1,000 次成功调用计费。错误（4xx/5xx）不计费。',
  '— volume discounts apply automatically.': '—— 阶梯折扣自动生效。',
  'Calls per month': '每月调用',
  'Calls this month': '本月调用',
  'Current tier': '当前阶梯',
  'All accounts include': '所有账号均包含',
  'Included with your account · 30/day · 900 lifetime':
    '随账号自带 · 每日 30 次 · 累计 900 次',
  Lifetime: '累计',
  'Lifetime usage per key within the current filter.':
    '当前筛选范围内每个 key 的累计用量。',
  'Free · complimentary': '免费 · 附赠',
  'free starter key': '免费入门 key',
  'Custom — contact sales': '定制 —— 联系销售',
  'Contact sales →': '联系销售 →',
  'View pricing': '查看定价',
  'off base rate': '相对基础价',

  // Bank / ACH / Wire
  '9 digits': '9 位',
  '4–17 digits': '4–17 位',
  'Routing number': '路由号',
  'Routing (ABA)': '路由号（ABA）',
  'Account number': '账号',
  "Account numbers don't match": '账号不一致',
  'Account holder name': '开户人姓名',
  'Confirm account number': '确认账号',
  'Re-enter to confirm': '再次输入以确认',
  'As shown on your bank statement': '与银行对账单一致',
  'Company name (optional)': '公司名称（选填）',
  'Full name': '全名',
  'I authorize Chivox, Inc. and Stripe, its authorized representative, to debit the account indicated above for the amount shown. This authorization will remain in effect until I notify you in writing to cancel it.':
    '我授权 Chivox, Inc. 及其代理 Stripe 从上述账户扣款。本授权在我书面撤销前持续有效。',
  "You're authorizing a one-time ACH debit for this top-up. Funds typically settle in 3–4 business days; credits are applied once confirmed. US bank accounts only.":
    '你正在授权本次 ACH 一次性扣款。资金通常在 3–4 个工作日到账，确认后即充入额度。仅支持美国银行账户。',
  "I'll initiate this wire from my bank and include the reference above. I understand credits are not applied until funds are received.":
    '我将从开户行发起电汇并在备注中填写上方的参考号。资金到账后额度才会充入。',
  "Initiate a wire from your bank using the details below. Credits will be applied once funds land (usually same-day domestic, 1–3 days international). We'll email the full instructions and a PDF to your receipt email.":
    '请按以下信息从你的银行发起电汇。资金到账后额度即刻充入（国内通常当天，国际 1–3 天）。完整指引与 PDF 会发到你的收件邮箱。',
  'You must include the reference number in the wire memo so we can credit the correct account. Wires without a reference are held for manual review for up to 5 business days.':
    '请务必在电汇备注中写明参考号，以便正确入账。未填写参考号的电汇将被保留至多 5 个工作日人工审核。',
  'Important:': '重要：',
  'Bank name': '银行名称',
  'Bank address': '银行地址',
  Beneficiary: '收款人',
  'Reference / memo': '参考号 / 备注',
  'Receipt email': '收据邮箱',
  Minimum: '最低',
  '— increase amount to enable': '—— 增加金额后可启用',
  'US bank account · $0.80 flat fee · settles in 3–4 business days':
    '美国银行账户 · 固定 $0.80 手续费 · 3–4 个工作日到账',
  'Bank-to-bank · settles same-day · no processing fee':
    '银行到银行 · 当日到账 · 无手续费',

  // Payment method UI
  Card: '银行卡',
  'Card information': '银行卡信息',
  'Card data is tokenised by Stripe; we only store the last 4 digits and brand.':
    '卡信息由 Stripe 令牌化处理；我们仅保存后 4 位与卡类。',
  'Country / postal code': '国家 / 邮编',
  'Save this card for future top-ups': '保存此卡用于后续充值',
  'Saved cards auto-fill at checkout. New cards are added during a top-up.':
    '已保存的卡会在结账时自动填充。新卡在充值时添加。',
  'Auto-filled at checkout. Add new cards during a top-up.':
    '结账时自动填充。新卡在充值时添加。',
  'Cards get saved when you add credits to a key and tick':
    '为 key 充值时勾选保存选项，卡片就会自动保存',
  'Make default': '设为默认',
  'Remove this card?': '移除此卡？',
  "We'll remove": '将移除',
  'from your saved cards. Future top-ups will need to re-enter card details.':
    '之后的充值需重新输入卡信息。',
  'No saved cards yet': '暂无已保存的卡',
  'Payment method added': '已添加支付方式',
  'Delete permanently': '永久删除',
  'Confirm with Face ID / Touch ID': '使用 Face ID / Touch ID 确认',
  'Continue with Amazon Pay': '使用 Amazon Pay 继续',
  'Continue with Cash App Pay': '使用 Cash App Pay 继续',
  'Continue with Google Pay': '使用 Google Pay 继续',
  'Continue with PayPal': '使用 PayPal 继续',
  'Connecting to Amazon…': '连接 Amazon 中…',
  'Waiting for Cash App…': '等待 Cash App…',
  'Redirecting to PayPal…': '跳转到 PayPal…',
  'Scan the QR code in your Cash App to approve this payment. Nothing is charged until you press Pay.':
    '在 Cash App 中扫码以确认本次支付。你按下 Pay 之前不会扣款。',
  "Funds will draw from your Cash App balance, then linked debit card if the balance is insufficient.":
    '优先从 Cash App 余额扣款，余额不足时从绑定的借记卡扣款。',
  'Funds will draw from your PayPal balance, then linked card. A confirmation email will be sent to your PayPal address.':
    '优先从 PayPal 余额扣款，余额不足时从绑定的卡扣款。确认邮件将发送到你的 PayPal 邮箱。',
  'From your Amazon account — press Pay to charge this card.':
    '来自你的 Amazon 账户 —— 按 Pay 对此卡扣款。',
  'Use the shipping and payment details from your Amazon account. Nothing is charged until you press Pay here.':
    '使用 Amazon 账户中的地址与支付信息。你按下 Pay 之前不会扣款。',
  'No card details are shared — Amazon returns a tokenised card to Stripe.':
    '不会共享卡信息 —— Amazon 会向 Stripe 返回一张令牌化的卡。',
  "Most popular in the US. Settles instantly from the customer's Cash App balance.":
    '在美国最常用。从客户的 Cash App 余额即时到账。',
  'Trusted by hundreds of millions of shoppers across 200+ countries.':
    '全球 200+ 国家、数亿用户信赖。',
  "You'll be redirected to PayPal to approve this payment. Nothing is charged until you press Pay here.":
    '会跳转到 PayPal 完成支付确认。你按下 Pay 之前不会扣款。',
  'Default card on your Link account.': '你 Link 账户中的默认卡。',
  'Paying with': '支付方式：',
  authorized: '已授权',
  'Secure card entry powered by Stripe · Demo':
    '由 Stripe 提供的安全卡信息录入 · 演示',

  // Dashboard / Keys / empty states
  'API Keys page': 'API 密钥页',
  'No paid keys yet': '暂无付费 key',
  "No paid keys yet — you're running on the free starter key. Create a paid key on the":
    '暂无付费 key —— 你当前使用免费的入门 key。可在以下页面创建付费 key：',
  'No active API keys. Create one on the': '没有可用的 API key。可在以下页面创建：',
  'No paid keys match those filters.': '没有符合筛选条件的付费 key。',
  'No keys in this project': '此项目下暂无 key',
  'No activity yet. Add credits to a key to see them here.':
    '暂无活动。为某个 key 充值后会显示在这里。',
  'No matching transactions': '没有匹配的交易',
  'No payments yet': '暂无支付记录',
  'No successful top-ups yet. Your first credit purchase will appear here.':
    '暂无成功充值。首次充值后会显示在这里。',
  'Adjust your filters or add funds from the billing page.':
    '调整筛选条件，或在账单页面充值。',
  'Current balance:': '当前余额：',
  Exhausted: '已用尽',
  'Your Starter key is used up': '入门 Key 已用尽',
  'The 900 free lifetime calls on your Starter key are now spent. To keep your integrations running, fund a paid key — no subscription, just pay per 1,000 calls with volume discounts.':
    '入门 Key 的 900 次累计免费调用已全部用完。请为付费 Key 充值以继续使用 —— 无订阅，按每 1,000 次调用计费，享阶梯折扣。',
  "You're fine on the starter key. When you need more, create a paid key.":
    '入门 key 的额度当前足够。需要更多时再创建付费 key 即可。',
  'when you need more headroom.': '当你需要更多额度时。',
  'This key needs credits before it can serve traffic.':
    '此 key 需充值后才能对外提供服务。',
  'No credits loaded — add some to activate this key.':
    '尚未充值 —— 充值后即可启用此 key。',
  'Your most active paid keys': '最活跃的付费 Key',
  'Balance, spend cap and low-balance alerts at a glance.':
    '一眼看清余额、消费上限与低余额提醒。',
  'Spend, limit, credit balances per key.': '按 key 查看消费、上限与余额。',
  'Each paid key has its own balance — top up the ones running low. Your starter key is listed on the':
    '每个付费 key 都有独立余额 —— 及时为余额不足的 key 充值。入门 key 展示在：',
  'Pick a project + key, top up with Stripe.': '选择项目 + key，通过 Stripe 充值。',
  'Spin up a scoped paid key under any project.': '为任意项目创建作用域付费 key。',
  'Create a paid key': '创建付费 Key',
  'Rename key': '重命名 key',
  Rename: '重命名',
  'Rotate secret': '轮换密钥',
  'Key settings': 'Key 设置',
  Enabled: '已启用',
  Disabled: '已停用',
  'Enable key': '启用 Key',
  'Disable key': '停用 Key',
  Limits: '上限',
  'Limits & alerts': '上限与提醒',
  'Configure spend cap & low-balance alert': '配置消费上限与余额不足提醒',
  Key: 'Key',
  Env: '环境',
  Prod: '生产',
  'Masked preview — copy for the full secret': '预览（已遮掩）—— 复制后可见完整密钥',
  'Copy full API key to clipboard': '复制完整 API key 到剪贴板',
  "Copy it now — for security, we won't show it in full again.":
    '请立即复制 —— 出于安全考虑，我们不会再次完整显示。',
  'Search invoice #, last 4, description…': '搜索发票号、后 4 位、描述…',
  'Succeeded only': '仅显示成功',
  'View full history': '查看完整历史',
  'Review billing': '查看账单',
  'Read the docs': '查看文档',
  'MCP spec, quickstarts, error codes.': 'MCP 规范、快速入门、错误码。',
  'Need to review rates? Check': '需要查看价格？请访问',
  'Common next steps for pay-as-you-go teams.': '按量计费团队的常见后续操作。',

  // Misc UI
  Action: '操作',
  Actions: '操作',
  Dismiss: '忽略',
  More: '更多',
  'More actions': '更多操作',
  Name: '名称',
  'New project': '新建项目',
  'New project name': '新项目名称',
  'Save limit': '保存上限',
  'Save settings': '保存设置',
  'e.g. Mobile app, Staging, CI': '例如：Mobile app、Staging、CI',
  'first.': '先创建。',
  'page.': '页面。',
  'paid keys': '付费 key',
  'Spend limits are enforced with up to 10 minutes of latency; small overages may occur. Counters reset at 12:00 AM on the 1st of each month (Pacific time).':
    '消费上限的生效延迟最多 10 分钟，可能出现少量超额。每月 1 号太平洋时间 0 点重置计数。',
  'Invoices are emailed to the receipt email on your account. Billing currency is USD. Taxes collected via Stripe Tax where applicable.':
    '发票会发送到你账号上的收据邮箱。结算货币为 USD。税费由 Stripe Tax 按需代征。',
  'Your card was declined. Please try a different card.':
    '你的银行卡被拒绝。请尝试其他银行卡。',
  'Choose a project and key, then pay': '选择项目与 key，再支付',
  '. Start a top-up from the Billing or API Keys page.':
    '。请从账单页或 API 密钥页开始充值。',
};

function normalizeI18nKey(input: string): string {
  // Normalisation is intentionally conservative: we want to collapse benign
  // formatting differences (whitespace, punctuation variants) without making
  // unrelated strings collide.
  let s = input.trim();
  // Collapse internal whitespace (newlines in template literals, double spaces)
  s = s.replace(/\s+/g, ' ');
  // Normalise common punctuation variants
  s = s
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/：/g, ':')
    .replace(/，/g, ',')
    .replace(/。/g, '.');
  // Strip trailing sentence punctuation (helps when JSX adds a period)
  s = s.replace(/[.!?…]+$/g, '').trim();
  return s.toLowerCase();
}

const NORMALIZED_KEY_INDEX: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const key of Object.keys(DICT)) {
    const nk = normalizeI18nKey(key);
    if (!m.has(nk)) m.set(nk, key);
  }
  return m;
})();

/**
 * Inline single-string lookup. Falls back to the source English if no
 * Chinese translation is registered — this is intentional so that untagged
 * copy still renders correctly (just in English) while we gradually
 * translate.
 */
export function lookup(en: string, lang: 'en' | 'zh'): string {
  if (lang === 'en') return en;
  const hit = DICT[en];
  if (hit) return hit;
  // Heuristic: try trimmed match (handles trailing whitespace from JSX)
  const trimmed = en.trim();
  if (trimmed !== en && DICT[trimmed]) return DICT[trimmed];

  const nk = normalizeI18nKey(en);
  const canonicalKey = NORMALIZED_KEY_INDEX.get(nk);
  if (canonicalKey) return DICT[canonicalKey] ?? en;

  return en;
}
