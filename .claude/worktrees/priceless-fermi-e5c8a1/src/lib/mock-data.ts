export interface EvalType {
  id: string;
  name: string;
  nameEn: string;
}

export const EVAL_TYPES: EvalType[] = [
  { id: 'en.word.score', name: '英文单词评测', nameEn: 'English Word' },
  { id: 'en.word.pron', name: '英文单词纠音', nameEn: 'English Word Pron' },
  { id: 'en.nsp.score', name: '英文自然拼读', nameEn: 'English Phonics' },
  { id: 'en.sent.score', name: '英文句子评测', nameEn: 'English Sentence' },
  { id: 'en.sent.pron', name: '英文句子纠音', nameEn: 'English Sentence Pron' },
  { id: 'en.phrase.score', name: '英文词语评测', nameEn: 'English Phrase' },
  { id: 'en.pred.score', name: '英文段落评测', nameEn: 'English Paragraph' },
  { id: 'en.realtime', name: '英文实时朗读', nameEn: 'English Realtime' },
  { id: 'en.choice', name: '英文口语选择', nameEn: 'English Choice' },
  { id: 'en.semi', name: '英文半开放题', nameEn: 'English Semi-open' },
  { id: 'en.open', name: '英文开放题', nameEn: 'English Open' },
  { id: 'en.recog', name: '英文识别评测', nameEn: 'English Recognition' },
  { id: 'cn.char.pinyin', name: '中文字评测(拼音)', nameEn: 'Chinese Char Pinyin' },
  { id: 'cn.char.hanzi', name: '中文字评测(汉字)', nameEn: 'Chinese Char Hanzi' },
  { id: 'cn.word.score', name: '中文词句评测', nameEn: 'Chinese Word' },
  { id: 'cn.pred.score', name: '中文段落评测', nameEn: 'Chinese Paragraph' },
  { id: 'cn.branch', name: '中文有限分支', nameEn: 'Chinese Branch' },
  { id: 'cn.aitalk', name: '中文AI Talk', nameEn: 'Chinese AI Talk' },
];

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  secret: string;
  enabled: boolean;
  evalTypes: string[];
  createdAt: string;
  lastUsedAt: string | null;
}

export interface UsageRecord {
  id: string;
  keyId: string;
  tool: string;
  score: number;
  duration: number;
  status: 'success' | 'error';
  createdAt: string;
}

export interface BillingRecord {
  id: string;
  month: string;
  plan: string;
  planFee: number;
  extraCalls: number;
  extraFee: number;
  total: number;
  status: 'paid' | 'pending';
}

function randomHex(len: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function generateApiKey(): { key: string; secret: string } {
  return {
    key: `sk-${randomHex(8)}${randomHex(8)}${randomHex(8)}${randomHex(8)}`,
    secret: `sks-${randomHex(12)}${randomHex(12)}${randomHex(12)}`,
  };
}

const KEYS_STORAGE = 'chivox_api_keys';

export function getStoredKeys(): ApiKey[] {
  try {
    const stored = localStorage.getItem(KEYS_STORAGE);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return getDefaultKeys();
}

export function saveKeys(keys: ApiKey[]) {
  localStorage.setItem(KEYS_STORAGE, JSON.stringify(keys));
}

function getDefaultKeys(): ApiKey[] {
  const keys: ApiKey[] = [
    {
      id: '1',
      name: '测试项目',
      key: `sk-c9f7a2b8e3d14f6091827364${randomHex(8)}`,
      secret: `sks-${randomHex(36)}`,
      enabled: true,
      evalTypes: ['en.word.score', 'en.sent.pron', 'en.choice', 'en.nsp.score', 'en.semi'],
      createdAt: '2026-04-10T09:30:00Z',
      lastUsedAt: '2026-04-16T14:22:00Z',
    },
    {
      id: '2',
      name: '生产环境',
      key: `sk-d8e2f1a3b7c94e5086719253${randomHex(8)}`,
      secret: `sks-${randomHex(36)}`,
      enabled: true,
      evalTypes: ['en.word.score', 'en.sent.score', 'en.pred.score', 'cn.word.score', 'cn.pred.score'],
      createdAt: '2026-04-12T15:10:00Z',
      lastUsedAt: '2026-04-16T17:40:41Z',
    },
  ];
  saveKeys(keys);
  return keys;
}

export function generateDailyUsage(days: number): { date: string; calls: number; errors: number }[] {
  const data = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const base = Math.floor(Math.random() * 200) + 50;
    data.push({
      date: d.toISOString().slice(0, 10),
      calls: base,
      errors: Math.floor(base * (Math.random() * 0.05)),
    });
  }
  return data;
}

export function generateToolDistribution(): { tool: string; toolName: string; count: number; percentage: number }[] {
  const tools = [
    { tool: 'en.word.score', toolName: '英文单词评测' },
    { tool: 'en.sent.score', toolName: '英文句子评测' },
    { tool: 'en.sent.pron', toolName: '英文句子纠音' },
    { tool: 'en.pred.score', toolName: '英文段落评测' },
    { tool: 'cn.word.score', toolName: '中文词句评测' },
    { tool: 'en.nsp.score', toolName: '英文自然拼读' },
    { tool: 'en.choice', toolName: '英文口语选择' },
  ];

  const counts = tools.map(t => ({
    ...t,
    count: Math.floor(Math.random() * 1000) + 100,
    percentage: 0,
  }));

  const total = counts.reduce((sum, c) => sum + c.count, 0);
  counts.forEach(c => { c.percentage = Math.round((c.count / total) * 100); });
  counts.sort((a, b) => b.count - a.count);

  return counts;
}

export function generateUsageRecords(count: number): UsageRecord[] {
  const tools = ['en.word.score', 'en.sent.score', 'en.sent.pron', 'en.pred.score', 'cn.word.score', 'en.nsp.score'];
  const toolNames: Record<string, string> = {
    'en.word.score': '英文单词评测',
    'en.sent.score': '英文句子评测',
    'en.sent.pron': '英文句子纠音',
    'en.pred.score': '英文段落评测',
    'cn.word.score': '中文词句评测',
    'en.nsp.score': '英文自然拼读',
  };

  const records: UsageRecord[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const tool = tools[Math.floor(Math.random() * tools.length)];
    const isError = Math.random() < 0.03;
    records.push({
      id: `rec-${i + 1}`,
      keyId: Math.random() > 0.5 ? '1' : '2',
      tool: toolNames[tool] || tool,
      score: isError ? 0 : Math.floor(Math.random() * 40) + 60,
      duration: Math.floor(Math.random() * 3000) + 500,
      status: isError ? 'error' : 'success',
      createdAt: new Date(now - i * 300000 - Math.random() * 60000).toISOString(),
    });
  }

  return records;
}

export function generateBillingRecords(): BillingRecord[] {
  return [
    { id: 'b1', month: '2026-04', plan: '免费版', planFee: 0, extraCalls: 0, extraFee: 0, total: 0, status: 'pending' },
    { id: 'b2', month: '2026-03', plan: '免费版', planFee: 0, extraCalls: 120, extraFee: 0.36, total: 0.36, status: 'paid' },
    { id: 'b3', month: '2026-02', plan: '免费版', planFee: 0, extraCalls: 0, extraFee: 0, total: 0, status: 'paid' },
    { id: 'b4', month: '2026-01', plan: '免费版', planFee: 0, extraCalls: 0, extraFee: 0, total: 0, status: 'paid' },
  ];
}

export const PLAN_DETAILS = {
  free: {
    name: '开发者',
    nameEn: 'Developer',
    price: 0,
    priceLabel: '免费',
    priceLabelEn: 'Free',
    monthlyQuota: 1000,
    concurrency: 2,
    features: [
      { label: '月调用量', value: '1,000 次' },
      { label: '并发数', value: '2' },
      { label: '评测工具', value: '基础 3 项' },
      { label: '批量评测', value: '—' },
      { label: 'LLM 分析', value: '—' },
      { label: '技术支持', value: '社区' },
      { label: 'SLA', value: '—' },
    ],
  },
  pro: {
    name: '专业版',
    nameEn: 'Professional',
    price: 99,
    priceLabel: '¥99/月',
    priceLabelEn: '¥99/mo',
    monthlyQuota: 50000,
    concurrency: 10,
    features: [
      { label: '月调用量', value: '50,000 次' },
      { label: '并发数', value: '10' },
      { label: '评测工具', value: '全部 18 项' },
      { label: '批量评测', value: '≤20条/批' },
      { label: 'LLM 分析', value: '100 次/月' },
      { label: '技术支持', value: '邮件 48h' },
      { label: 'SLA', value: '99.5%' },
    ],
  },
  enterprise: {
    name: '企业版',
    nameEn: 'Enterprise',
    price: -1,
    priceLabel: '定制',
    priceLabelEn: 'Custom',
    monthlyQuota: -1,
    concurrency: 50,
    features: [
      { label: '月调用量', value: '不限' },
      { label: '并发数', value: '50+' },
      { label: '评测工具', value: '全部 + 定制' },
      { label: '批量评测', value: '≤50条/批' },
      { label: 'LLM 分析', value: '不限' },
      { label: '技术支持', value: '7×24 专属' },
      { label: 'SLA', value: '99.9%+' },
    ],
  },
} as const;

export function calculateCost(monthlyCalls: number): { plan: string; planFee: number; extraCalls: number; extraFee: number; total: number; recommendation: string } {
  if (monthlyCalls <= 1000) {
    return { plan: '免费版', planFee: 0, extraCalls: 0, extraFee: 0, total: 0, recommendation: '免费版完全满足您的需求' };
  }
  if (monthlyCalls <= 50000) {
    const extraCalls = Math.max(0, monthlyCalls - 1000);
    const extraFeeIfFree = extraCalls * 0.003;
    if (extraFeeIfFree < 99) {
      return {
        plan: '免费版 + 超额',
        planFee: 0,
        extraCalls,
        extraFee: extraFeeIfFree,
        total: extraFeeIfFree,
        recommendation: monthlyCalls > 5000 ? '建议升级专业版更划算' : '免费版 + 按量付费',
      };
    }
    return { plan: '专业版', planFee: 99, extraCalls: 0, extraFee: 0, total: 99, recommendation: '专业版是最佳选择' };
  }
  const extra = monthlyCalls - 50000;
  const extraFee = extra * 0.003;
  return {
    plan: '专业版 + 超额',
    planFee: 99,
    extraCalls: extra,
    extraFee,
    total: 99 + extraFee,
    recommendation: extraFee > 200 ? '建议联系销售获取企业版报价' : '专业版 + 按量付费',
  };
}
