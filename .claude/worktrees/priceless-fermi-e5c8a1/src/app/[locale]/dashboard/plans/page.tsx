'use client';

import Image from 'next/image';
import { useLocale } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { Check, ArrowUpRight, Crown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SALES_CHAT_URL } from '@/lib/links';

type TierRow = {
  key: 'starter' | 'standard' | 'growth' | 'scale' | 'enterprise';
  label: string;
  h: number;
  tone: string;
  desc: string;
};

// ── 阶梯档位示意（不展示具体调用量 / 价格，仅相对单价示意） ──
const TIERS_ZH: TierRow[] = [
  { key: 'starter',    label: '起步档',  h: 92, tone: 'bg-foreground',       desc: '注册即用，适合产品原型验证' },
  { key: 'standard',   label: '标准档',  h: 74, tone: 'bg-foreground/75',    desc: '业务正式上线，稳定商用' },
  { key: 'growth',     label: '成长档',  h: 58, tone: 'bg-foreground/55',    desc: '用户量上升，单价首次下探' },
  { key: 'scale',      label: '规模档',  h: 42, tone: 'bg-foreground/35',    desc: '高并发高吞吐，单价显著优惠' },
  { key: 'enterprise', label: '企业档',  h: 28, tone: 'bg-foreground/20',    desc: '私有部署 / 定制 SLA / 专属支持' },
];

const TIERS_EN: TierRow[] = [
  { key: 'starter',    label: 'Starter',    h: 92, tone: 'bg-foreground',    desc: 'Ready after signup — ideal for prototypes' },
  { key: 'standard',   label: 'Standard',   h: 74, tone: 'bg-foreground/75', desc: 'Production workloads, stable commercial use' },
  { key: 'growth',     label: 'Growth',     h: 58, tone: 'bg-foreground/55', desc: 'Growing traffic — first unit-price drop' },
  { key: 'scale',      label: 'Scale',      h: 42, tone: 'bg-foreground/35', desc: 'High concurrency & throughput — stronger discounts' },
  { key: 'enterprise', label: 'Enterprise', h: 28, tone: 'bg-foreground/20', desc: 'Private deployment / custom SLA / dedicated support' },
];

// ── 当前账号档位映射（auth 里 plan 只有 free/pro/enterprise，简单对应一下）──
const PLAN_TO_TIER: Record<string, TierRow['key']> = {
  free: 'starter',
  pro: 'standard',
  enterprise: 'enterprise',
};

const PLAN_LABEL_ZH: Record<string, string> = {
  free: '起步档 · 免费试用',
  pro: '标准档 · 正式商用',
  enterprise: '企业档 · 定制合作',
};

const PLAN_LABEL_EN: Record<string, string> = {
  free: 'Starter · trial',
  pro: 'Standard · production',
  enterprise: 'Enterprise · custom',
};

// ── 套餐能力对比（改为相对强度示意，不展示具体数字） ──
const COMPARISON_ZH: { feature: string; cells: [string, string, string] }[] = [
  { feature: '调用量', cells: ['试用额度', '稳定商用', '海量 · 阶梯递减'] },
  { feature: '并发数', cells: ['基础', '可扩容', '企业级 · 支持独立部署'] },
  { feature: '评测工具', cells: ['基础题型', '全部 16 项', '全部 + 定制题型'] },
  { feature: '批量评测', cells: ['—', '支持', '支持 · 更大批量'] },
  { feature: 'LLM 二次 / 三次分析', cells: ['—', '支持', '支持 · 不限量'] },
  { feature: '多维度打分字段', cells: ['全部 8 项', '全部 8 项', '全部 + 定制字段'] },
  { feature: '结果缓存', cells: ['基础', '可配置', '自定义策略'] },
  { feature: '调度优先级', cells: ['普通队列', '优先队列', '最高优先'] },
  { feature: '技术支持', cells: ['文档 / 社区', '邮件 · 工作日响应', '7×24 专属群'] },
  { feature: 'SLA', cells: ['—', '标准 SLA', '企业级 SLA'] },
  { feature: '结算方式', cells: ['体验额度', '月度结算', '协商 · 支持私有化'] },
];

const COMPARISON_EN: { feature: string; cells: [string, string, string] }[] = [
  { feature: 'Call volume', cells: ['Trial quota', 'Production use', 'High volume · tiered discounts'] },
  { feature: 'Concurrency', cells: ['Basic', 'Scalable', 'Enterprise · dedicated deployment'] },
  { feature: 'Evaluation tools', cells: ['Core tasks', 'All 16 tools', 'All + custom tasks'] },
  { feature: 'Batch evaluation', cells: ['—', 'Yes', 'Yes · larger batches'] },
  { feature: 'LLM 2nd / 3rd pass', cells: ['—', 'Yes', 'Yes · unlimited'] },
  { feature: 'Score dimensions', cells: ['All 8', 'All 8', 'All + custom fields'] },
  { feature: 'Result cache', cells: ['Basic', 'Configurable', 'Custom policy'] },
  { feature: 'Queue priority', cells: ['Standard', 'Priority', 'Highest'] },
  { feature: 'Support', cells: ['Docs / community', 'Email · business days', '7×24 dedicated'] },
  { feature: 'SLA', cells: ['—', 'Standard SLA', 'Enterprise SLA'] },
  { feature: 'Billing', cells: ['Trial credits', 'Monthly', 'Negotiated · on-prem optional'] },
];

export default function PlansPage() {
  const locale = useLocale();
  const uiZh = locale.startsWith('zh');
  const { user } = useAuth();
  const currentPlan = user?.plan || 'free';
  const currentTier = PLAN_TO_TIER[currentPlan];
  const TIERS = uiZh ? TIERS_ZH : TIERS_EN;
  const PLAN_LABEL = uiZh ? PLAN_LABEL_ZH : PLAN_LABEL_EN;
  const COMPARISON = uiZh ? COMPARISON_ZH : COMPARISON_EN;

  return (
    <div>
      {/* ── 页头 ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-bold tracking-tight mb-2">{uiZh ? '会员套餐' : 'Membership plans'}</h1>
          <p className="text-sm text-muted-foreground">
            {uiZh ? (
              <>
                驰声按<span className="text-foreground font-medium"> 调用量 + 并发数 </span>阶梯计费，用得越多，单价自动下调。
                具体报价以销售报价为准。
              </>
            ) : (
              <>
                Chivox bills by <span className="text-foreground font-medium">call volume + concurrency</span> on a tiered model — the more you use, the lower the unit price.
                Final quotes come from sales.
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 text-xs">
          <Crown className="h-3.5 w-3.5 text-foreground" />
          <span className="text-muted-foreground">{uiZh ? '当前档位' : 'Your tier'}</span>
          <span className="font-medium text-foreground">{PLAN_LABEL[currentPlan]}</span>
        </div>
      </div>

      {/* ── 主体：左阶梯示意 + 右联系销售 ── */}
      <div className="grid lg:grid-cols-5 gap-6 mb-10">
        {/* ── 左：阶梯价示意 ── */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-border bg-background p-6 md:p-7 h-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-1">Tiered Pricing</div>
                <h3 className="text-base font-semibold">{uiZh ? '阶梯价模型示意' : 'Tiered pricing (illustrative)'}</h3>
              </div>
              <div className="hidden md:flex items-center gap-1.5 text-[11px] text-muted-foreground border border-border/60 rounded-full px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground/70" />
                {uiZh ? '单价随调用量递减' : 'Unit price drops with volume'}
              </div>
            </div>

            {/* 柱状示意 */}
            <div className="flex items-stretch justify-between gap-3 md:gap-4 h-48 md:h-52">
              {TIERS.map((t) => {
                const active = t.key === currentTier;
                return (
                  <div key={t.key} className="flex-1 flex flex-col items-center min-w-0">
                    <div className="w-full flex-1 flex items-end justify-center pb-1.5 relative">
                      {active && (
                        <span className="absolute -top-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-foreground text-background whitespace-nowrap">
                          {uiZh ? '你在这' : 'You'}
                        </span>
                      )}
                      <div
                        className={cn(
                          'w-full rounded-t-md transition-all',
                          t.tone,
                          active && 'ring-2 ring-offset-2 ring-offset-background ring-foreground/40'
                        )}
                        style={{ height: `${t.h}%` }}
                      />
                    </div>
                    <div className="w-full border-t border-border/60 pt-2 text-center">
                      <div className={cn('text-[11px]', active ? 'text-foreground font-semibold' : 'text-muted-foreground font-medium')}>
                        {t.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* X 轴示意 */}
            <div className="mt-3 flex items-center justify-between px-1 text-[11px] text-muted-foreground">
              <span>{uiZh ? '调用量 / 并发 小' : 'Lower volume / concurrency'}</span>
              <div className="flex-1 mx-3 relative h-px bg-border/60">
                <span className="absolute -right-0.5 -top-1 text-muted-foreground/70">▸</span>
              </div>
              <span>{uiZh ? '调用量 / 并发 大' : 'Higher volume / concurrency'}</span>
            </div>
            <div className="text-[11px] text-muted-foreground text-center mt-3 mb-5">
              {uiZh
                ? '↑ 柱高仅代表相对单价示意，具体阶梯与折扣以销售报价为准'
                : '↑ Bar height shows relative unit price only; tiers and discounts per sales quote.'}
            </div>

            <div className="h-px bg-border/60 my-4" />

            {/* 计费要点 */}
            <div className="grid sm:grid-cols-2 gap-x-5 gap-y-3">
              {(uiZh
                ? [
                    { k: '调用量计费', v: '按每次成功评测计费，失败请求不扣量' },
                    { k: '并发数弹性', v: '可单独购买加并发包，平滑应对流量高峰' },
                    { k: '阶梯自动递减', v: '每上一档单价自动下调，无需重新签约' },
                    { k: '免费试用额度', v: '注册即送试用次数，产品验证零门槛' },
                  ]
                : [
                    { k: 'Per-call billing', v: 'Charged per successful evaluation; failed requests are not counted.' },
                    { k: 'Elastic concurrency', v: 'Add concurrency packs separately to handle traffic spikes.' },
                    { k: 'Auto tier discounts', v: 'Moving up a tier lowers unit price automatically — no re-signing.' },
                    { k: 'Free trial credits', v: 'Trial calls on signup — zero friction for product validation.' },
                  ]
              ).map((r) => (
                <div key={r.k} className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{r.k}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">{r.v}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 右：联系销售 + 小程序扫码 ── */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-background p-6 h-full flex flex-col">
            <div className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-1">Contact Sales</div>
            <h3 className="text-base font-semibold mb-2">{uiZh ? '获取专属阶梯报价' : 'Get a tiered quote'}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              {uiZh
                ? '告诉我们你的业务场景、预估调用量和并发需求，销售会在 1 个工作日内提供精准阶梯报价与 PoC 支持。'
                : 'Share your use case, expected call volume, and concurrency needs — sales will reply within one business day with a quote and PoC options.'}
            </p>

            <a
              href={SALES_CHAT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 h-10 px-4 text-sm font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors w-full"
            >
              {uiZh ? '在线咨询销售' : 'Chat with sales'} <ArrowUpRight className="h-4 w-4" />
            </a>

            <a
              href="mailto:sales@chivox.com"
              className="inline-flex items-center justify-center gap-1.5 h-10 px-4 text-sm font-medium rounded-lg border border-border hover:bg-muted/60 transition-colors w-full mt-2.5"
            >
              {uiZh ? '发送邮件 · sales@chivox.com' : 'Email sales@chivox.com'}
            </a>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-border/60" />
              <span className="text-[11px] text-muted-foreground">{uiZh ? '或扫码咨询' : 'Or scan'}</span>
              <div className="flex-1 h-px bg-border/60" />
            </div>

            <div className="flex flex-col items-center text-center gap-3">
              <div className="relative shrink-0 rounded-lg border border-border/60 overflow-hidden bg-white p-1.5">
                <Image
                  src="/wechat-qr.png"
                  alt={uiZh ? '驰声微信小程序' : 'Chivox WeChat mini program'}
                  width={128}
                  height={128}
                  unoptimized
                  className="h-[128px] w-[128px] object-contain"
                />
              </div>
              <div>
                <div className="text-sm font-medium mb-1">{uiZh ? '微信扫码' : 'WeChat QR'}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">
                  {uiZh
                    ? '了解更多驰声技术，体验小程序评测 Demo。'
                    : 'Learn more about Chivox and try the mini-program scoring demo.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 套餐能力对比（无具体数字，只示意相对强度） ── */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-foreground" />
        <h2 className="text-base font-bold tracking-tight">{uiZh ? '套餐能力对比' : 'Plan comparison'}</h2>
        <span className="text-xs text-muted-foreground">
          {uiZh ? '· 能力强度示意，不代表最终配额' : '· Illustrative strength, not final quotas'}
        </span>
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground w-1/4">
                  {uiZh ? '能力维度' : 'Capability'}
                </th>
                <th className="text-center py-3 px-4 font-medium">
                  <div className={cn(currentTier === 'starter' && 'text-foreground')}>{uiZh ? '起步档' : 'Starter'}</div>
                  <div className="text-[11px] font-normal text-muted-foreground mt-0.5">
                    {uiZh ? '免费试用' : 'Trial'}
                  </div>
                </th>
                <th className="text-center py-3 px-4 font-medium">
                  <div className={cn(currentTier === 'standard' && 'text-foreground')}>{uiZh ? '标准档' : 'Standard'}</div>
                  <div className="text-[11px] font-normal text-muted-foreground mt-0.5">
                    {uiZh ? '正式商用' : 'Production'}
                  </div>
                </th>
                <th className="text-center py-3 px-4 font-medium">
                  <div className={cn(currentTier === 'enterprise' && 'text-foreground')}>{uiZh ? '企业档' : 'Enterprise'}</div>
                  <div className="text-[11px] font-normal text-muted-foreground mt-0.5">
                    {uiZh ? '定制合作' : 'Custom'}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {COMPARISON.map((row, i) => (
                <tr key={i} className="hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 px-4 font-medium">{row.feature}</td>
                  {row.cells.map((v, j) => (
                    <td key={j} className="py-2.5 px-4 text-center text-muted-foreground text-xs">
                      {v === '—' ? <span className="text-muted-foreground/50">—</span> : v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 底部 CTA ── */}
      <div className="mt-6 rounded-xl border border-border/60 bg-muted/30 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {uiZh ? (
            <>
              没有看到合适的档位？<span className="text-foreground font-medium">阶梯方案可以自由组合</span>，调用量包 + 并发包 + 定制工具按需搭配。
            </>
          ) : (
            <>
              Need something different? <span className="text-foreground font-medium">Tiers can be combined</span> — volume packs, concurrency add-ons, and custom tools.
            </>
          )}
        </div>
        <a
          href={SALES_CHAT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:opacity-70 transition-opacity"
        >
          {uiZh ? '联系销售定制' : 'Contact sales'} <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
