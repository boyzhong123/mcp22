'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Mic, Sparkles, Zap, ArrowRight, Check, Languages, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

type Lang = 'en' | 'cn';
type QKey = 'word' | 'sent' | 'para' | 'semi';

interface ScoreCell { label: string; value: number; tone: 'amber' | 'emerald' }
interface ChipCell { ok: boolean; text: string }

interface PreviewData {
  /** 评测内核名称（对应驰声评测 API coreType） */
  coreType: string;
  urlHash: string;
  kicker: string;
  text: React.ReactNode;
  scores: ScoreCell[];
  chips: ChipCell[];
  practiceLabel: string;
  practice: string;
  audioCur: string;
  audioTotal: string;
  audioProgress: number;
}

const EN_TABS: { k: QKey; label: string }[] = [
  { k: 'word', label: 'Word' },
  { k: 'sent', label: 'Sentence' },
  { k: 'para', label: 'Paragraph' },
  { k: 'semi', label: 'Semi-open' },
];

// 中文内核仅支持封闭题型（字/词/句/段），半开放与开放目前仅英文支持
const CN_TABS: { k: QKey; label: string }[] = [
  { k: 'word', label: '字词题' },
  { k: 'sent', label: '句子题' },
  { k: 'para', label: '段落题' },
];

/** 站点中文 UI + 英文内核：题型按钮用中文简称 */
const EN_TAB_LABEL_ZH: Partial<Record<QKey, string>> = {
  word: '单词',
  sent: '句子',
  para: '段落',
  semi: '半开放',
};
/** 站点英文 UI + 中文内核：题型按钮用英文 */
const CN_TAB_LABEL_EN: Partial<Record<QKey, string>> = {
  word: 'Words',
  sent: 'Sentences',
  para: 'Paragraphs',
};

// ─────────────────────────────────────────
// 英文内核 · en.word.score / en.sent.score / en.pred.score / en.pqan.score
// ─────────────────────────────────────────
const EN_DATA: Record<QKey, PreviewData> = {
  word: {
    coreType: 'en.word.score',
    urlHash: 'en-word',
    kicker: 'Reference Word · en.word.score',
    text: (
      <>
        <span className="bg-rose-500/15 text-rose-700 dark:text-rose-300 px-0.5 rounded border-b border-rose-500/40">unique</span>
        <span className="ml-2 font-mono text-xs text-muted-foreground">/juːˈniːk/</span>
      </>
    ),
    // 单词题字段：总分 / 发音分
    scores: [
      { label: 'Overall', value: 82,  tone: 'amber'   },
      { label: 'Pron.',   value: 78,  tone: 'amber'   },
    ],
    chips: [
      { ok: false, text: '⚠ /juː/ lip rounding too flat' },
      { ok: false, text: '⚠ weak stress on 2nd syllable' },
      { ok: true,  text: '✓ /niː/ is accurate' },
      { ok: true,  text: '✓ final consonant /k/ is clear' },
    ],
    practiceLabel: 'LLM Generated · Word Correction',
    practice: '"Repeat 3 times: lift tongue for /j/, round lips for /uː/ → YOU-niːk, keep stress on the 2nd syllable..."',
    audioCur: '0:02',
    audioTotal: '0:03',
    audioProgress: 0.82,
  },
  sent: {
    coreType: 'en.sent.score',
    urlHash: 'en-sent',
    kicker: 'Reference Sentence · en.sent.score',
    text: (
      <>
        She sells <span className="bg-rose-500/15 text-rose-700 dark:text-rose-300 px-0.5 rounded border-b border-rose-500/40">seashells</span> by the <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 px-0.5 rounded border-b border-amber-500/40">seashore</span>.
      </>
    ),
    // 句子题字段：总分 / 准确度 / 流利度 / 完整度
    scores: [
      { label: 'Overall',   value: 74, tone: 'amber'   },
      { label: 'Accuracy',  value: 70, tone: 'amber'   },
      { label: 'Fluency',   value: 80, tone: 'amber'   },
      { label: 'Integrity', value: 92, tone: 'emerald' },
    ],
    chips: [
      { ok: false, text: '⚠ /ʃ/ pronounced as /s/' },
      { ok: false, text: '⚠ pause inside "seashore"' },
      { ok: true,  text: '✓ speaking rate is good' },
      { ok: true,  text: '✓ natural sentence ending' },
    ],
    practiceLabel: 'LLM Generated · Sentence Correction',
    practice: '"Train /ʃ/: raise tongue tip without touching teeth — SHE-sells SHE-shells by the SHE-shore, slow-read 5 times..."',
    audioCur: '0:04',
    audioTotal: '0:05',
    audioProgress: 0.65,
  },
  para: {
    coreType: 'en.pred.score',
    urlHash: 'en-para',
    kicker: 'Reference Text · en.pred.score',
    text: (
      <>
        The boy who had <span className="bg-rose-500/15 text-rose-700 dark:text-rose-300 px-0.5 rounded border-b border-rose-500/40">thought</span> about the <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 px-0.5 rounded border-b border-amber-500/40">unique</span> opportunity stood still, watching the sunset paint the sky in shades of gold.
      </>
    ),
    scores: [
      { label: 'Overall',   value: 78, tone: 'amber'   },
      { label: 'Accuracy',  value: 72, tone: 'amber'   },
      { label: 'Fluency',   value: 85, tone: 'emerald' },
      { label: 'Integrity', value: 96, tone: 'emerald' },
    ],
    chips: [
      { ok: false, text: '⚠ missing /θ/ tongue placement' },
      { ok: false, text: '⚠ stress misplaced in "unique"' },
      { ok: true,  text: '✓ smooth linking' },
      { ok: true,  text: '✓ good speaking rate' },
    ],
    practiceLabel: 'LLM Generated · Paragraph Correction',
    practice: '"For /θ/ tongue placement, try: The thirty-three thieves thought they thrilled the throne throughout Thursday..."',
    audioCur: '0:08',
    audioTotal: '0:12',
    audioProgress: 0.7,
  },
  semi: {
    coreType: 'en.pqan.score',
    urlHash: 'en-semi',
    kicker: 'Prompt · Semi-open · en.pqan.score',
    text: (
      <>
        <span className="text-muted-foreground">&ldquo;Tell me about your favorite </span>
        <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 px-0.5 rounded">weekend activity</span>
        <span className="text-muted-foreground">&rdquo;</span>
      </>
    ),
    // 半开放题 5 维：总分 / 发音分 / 语法分 / 内容分 / 流利分
    scores: [
      { label: 'Overall', value: 74, tone: 'amber'   },
      { label: 'Pron.',   value: 76, tone: 'amber'   },
      { label: 'Grammar', value: 80, tone: 'emerald' },
      { label: 'Content', value: 68, tone: 'amber'   },
      { label: 'Fluency', value: 78, tone: 'amber'   },
    ],
    chips: [
      { ok: false, text: '⚠ limited elaboration (only 1 sentence)' },
      { ok: false, text: '⚠ overuse of conjunction "and"' },
      { ok: true,  text: '✓ consistent tense' },
      { ok: true,  text: '✓ clear pronunciation overall' },
    ],
    practiceLabel: 'LLM Generated · Content Expansion',
    practice: '"Expand to 3 sentences: 1) what you do → 2) why you like it → 3) one concrete example, using because / so that / for example..."',
    audioCur: '0:14',
    audioTotal: '0:22',
    audioProgress: 0.64,
  },
};

// ─────────────────────────────────────────
// 中文内核 · cn.word.score / cn.sent.score / cn.pred.score / cn.semi
// 中文特有字段：tone（声调）、pinyin、erhua（儿化）、biandiao（变调）
// ─────────────────────────────────────────
const CN_DATA: Record<QKey, PreviewData> = {
  word: {
    coreType: 'cn.word.raw',
    urlHash: 'cn-word',
    kicker: '参考字词 · 字词题 · cn.word.raw',
    text: (
      <>
        <span className="bg-rose-500/15 text-rose-700 dark:text-rose-300 px-0.5 rounded border-b border-rose-500/40">独特</span>
        <span className="ml-2 font-mono text-xs text-muted-foreground">dú tè</span>
      </>
    ),
    // 单词题字段：总分 / 发音分
    scores: [
      { label: '总分',    value: 76, tone: 'amber'   },
      { label: '发音',    value: 82, tone: 'emerald' },
    ],
    chips: [
      { ok: false, text: '⚠ "独" 二声发成了三声' },
      { ok: false, text: '⚠ "特" 声调偏平' },
      { ok: true,  text: '✓ 拼音 dú/tè 清晰' },
      { ok: true,  text: '✓ 送气音 t 自然' },
    ],
    practiceLabel: 'LLM 生成 · 单词纠音（中文）',
    practice: '"跟读 3 遍：「独（dú）」二声由中平起，向高扬升；「特（tè）」四声由高快速降到低。音调起伏要干脆..."',
    audioCur: '0:02',
    audioTotal: '0:03',
    audioProgress: 0.75,
  },
  sent: {
    coreType: 'cn.sent.raw',
    urlHash: 'cn-sent',
    kicker: '参考句子 · 句子题 · cn.sent.raw',
    text: (
      <>
        妈妈骑着<span className="bg-rose-500/15 text-rose-700 dark:text-rose-300 px-0.5 rounded border-b border-rose-500/40">马儿</span>过<span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 px-0.5 rounded border-b border-amber-500/40">小桥</span>。
      </>
    ),
    // 句子题字段：总分 / 准确度 / 流利度 / 完整度
    scores: [
      { label: '总分',    value: 72, tone: 'amber'   },
      { label: '准确度',  value: 75, tone: 'amber'   },
      { label: '流利度',  value: 88, tone: 'emerald' },
      { label: '完整度',  value: 90, tone: 'emerald' },
    ],
    chips: [
      { ok: false, text: '⚠ "马儿" 儿化不明显' },
      { ok: false, text: '⚠ "妈妈" 轻声过重' },
      { ok: true,  text: '✓ 语流连贯' },
      { ok: true,  text: '✓ 无明显漏读' },
    ],
    practiceLabel: 'LLM 生成 · 句子纠音（中文）',
    practice: '"重点练「马儿」的儿化 —— 把「马」(mǎ) 尾音卷舌接近 r 即可，不要单独发「儿」。另外「妈妈」第二个字是轻声，声短促..."',
    audioCur: '0:04',
    audioTotal: '0:05',
    audioProgress: 0.72,
  },
  para: {
    coreType: 'cn.pred.raw',
    urlHash: 'cn-para',
    kicker: '参考短文 · 段落题 · cn.pred.raw',
    text: (
      <>
        春天的<span className="bg-rose-500/15 text-rose-700 dark:text-rose-300 px-0.5 rounded border-b border-rose-500/40">花儿</span>开了，小鸟在枝头<span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 px-0.5 rounded border-b border-amber-500/40">歌唱</span>，风轻轻拂过，带来阵阵花香。
      </>
    ),
    scores: [
      { label: '总分',    value: 80, tone: 'emerald' },
      { label: '准确度',  value: 78, tone: 'amber'   },
      { label: '流利度',  value: 90, tone: 'emerald' },
      { label: '完整度',  value: 94, tone: 'emerald' },
    ],
    chips: [
      { ok: false, text: '⚠ "花儿" 儿化缺失' },
      { ok: false, text: '⚠ "不 + 四声" 变调未处理' },
      { ok: true,  text: '✓ 停顿自然' },
      { ok: true,  text: '✓ 语速合宜（≈4 字/秒）' },
    ],
    practiceLabel: 'LLM 生成 · 段落纠音（中文）',
    practice: '"先练儿化韵：花儿 (huār)、鸟儿 (niǎor)，把末尾元音卷舌即可。再注意三声变调：当「你好」连读，第一个「你」由三声变成二声..."',
    audioCur: '0:08',
    audioTotal: '0:12',
    audioProgress: 0.68,
  },
  // 占位：中文内核目前不支持半开放，此项不会在 UI 中展示
  semi: {
    coreType: 'cn.semi.unavailable',
    urlHash: 'cn-semi',
    kicker: '题目 · 半开放题（中文暂不支持）',
    text: (
      <>
        <span className="text-muted-foreground">&ldquo;请介绍一下你最喜欢的 </span>
        <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 px-0.5 rounded">周末活动</span>
        <span className="text-muted-foreground">&rdquo;</span>
      </>
    ),
    scores: [
      { label: '内容',    value: 72, tone: 'amber'   },
      { label: '语言',    value: 76, tone: 'amber'   },
      { label: '发音',    value: 82, tone: 'emerald' },
      { label: '声调',    value: 70, tone: 'amber'   },
    ],
    chips: [
      { ok: false, text: '⚠ 内容展开较短（2 句）' },
      { ok: false, text: '⚠ "的" 字重复过多' },
      { ok: true,  text: '✓ 普通话语音清晰' },
      { ok: true,  text: '✓ 没有口头禅' },
    ],
    practiceLabel: 'LLM 生成 · 内容拓展（中文）',
    practice: '"扩展为 3 句：① 我最喜欢 ___；② 因为 ___；③ 举个例子 ___。可以使用「首先 / 因为 / 比如」让逻辑更清晰..."',
    audioCur: '0:14',
    audioTotal: '0:22',
    audioProgress: 0.6,
  },
};

const DATA: Record<Lang, Record<QKey, PreviewData>> = {
  en: EN_DATA,
  cn: CN_DATA,
};

export function DemoPreview() {
  const locale = useLocale();
  const siteZh = locale.startsWith('zh');
  /** 评测内核（英/中）：与顶部站点语言无关，可随时切换 */
  const [lang, setLang] = useState<Lang>('en');
  const [active, setActive] = useState<QKey>('word');

  // 当前内核可用的题型
  const availableTabs = lang === 'en' ? EN_TABS : CN_TABS;
  // 切到中文内核时若停在 semi，自动退回第一个可用题型
  const effectiveActive: QKey = availableTabs.some((t) => t.k === active)
    ? active
    : availableTabs[0].k;

  const data = DATA[lang][effectiveActive];

  function switchLang(next: Lang) {
    if (next === lang) return;
    setLang(next);
    const nextTabs = next === 'en' ? EN_TABS : CN_TABS;
    if (!nextTabs.some((t) => t.k === active)) {
      setActive(nextTabs[0].k);
    }
  }

  function tabButtonLabel(t: { k: QKey; label: string }) {
    if (lang === 'en') {
      return siteZh ? (EN_TAB_LABEL_ZH[t.k] ?? t.label) : t.label;
    }
    return siteZh ? t.label : (CN_TAB_LABEL_EN[t.k] ?? t.label);
  }

  const BAR_COUNT = 44;
  const playedUpTo = Math.floor(BAR_COUNT * data.audioProgress);

  return (
    <>
      {/* 主体 · 左叙事 / 右浏览器 Mock */}
      <div className="grid lg:grid-cols-12 gap-6 max-w-6xl mx-auto">
        {/* ── 左：语言切换 + 题型切换 + 亮点 + CTA ── */}
        <div className="lg:col-span-5 flex flex-col">
          {/* 评测内核：与站点语言独立，中/英内核均可选 */}
          <div className="mb-5">
            <div className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
              <Languages className="h-3 w-3" />
              {siteZh ? '评测内核' : 'Evaluation engine'}
            </div>
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-muted/40 border border-border/60">
              {(
                [
                  { k: 'en' as Lang, label: 'English', hint: siteZh ? '英文内核' : 'English engine' },
                  { k: 'cn' as Lang, label: siteZh ? '中文' : 'Chinese', hint: siteZh ? '中文内核' : 'Chinese engine' },
                ]
              ).map((it) => {
                const isActive = lang === it.k;
                return (
                  <button
                    key={it.k}
                    type="button"
                    onClick={() => switchLang(it.k)}
                    onMouseEnter={() => switchLang(it.k)}
                    onFocus={() => switchLang(it.k)}
                    className={cn(
                      'flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs transition-all cursor-pointer',
                      isActive
                        ? 'bg-foreground text-background shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span className="font-medium">{it.label}</span>
                    <span
                      className={cn(
                        'text-[11px] font-medium',
                        isActive ? 'text-background/75' : 'text-zinc-600 dark:text-zinc-300'
                      )}
                    >
                      · {it.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 题型 tab 按钮（按语言动态展示） */}
          <div className="mb-6">
            <div className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3 flex flex-wrap items-center gap-2">
              <span>{siteZh ? '题型' : 'Question types'}</span>
              {lang === 'cn' && (
                <span className="text-[10px] font-normal normal-case tracking-normal text-muted-foreground/70">
                  · {siteZh ? '中文内核：字词 / 句子 / 段落' : 'CN engine: words, sentences & paragraphs'}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2" role="tablist">
              {availableTabs.map((t) => {
                const isActive = effectiveActive === t.k;
                const coreSub = DATA[lang][t.k].coreType;
                return (
                  <button
                    key={t.k}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActive(t.k)}
                    onMouseEnter={() => setActive(t.k)}
                    onFocus={() => setActive(t.k)}
                    className={cn(
                      'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-all cursor-pointer',
                      isActive
                        ? 'border-foreground bg-foreground text-background shadow-md'
                        : 'border-border bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                    )}
                  >
                    <span className="font-medium">{tabButtonLabel(t)}</span>
                    <span
                      className={cn(
                        'font-mono text-[11px] font-medium',
                        isActive ? 'text-background/80' : 'text-zinc-600 dark:text-zinc-300'
                      )}
                    >
                      {coreSub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3 capability rows */}
          <div className="space-y-4 mb-7 flex-1">
            {[
              { icon: Mic,       title: siteZh ? '真实 API 响应' : 'Real API Response',    desc: siteZh ? '每个字段都来自驰声生产接口，不是 mock 出来糊弄人的数据' : 'Every field comes from production Chivox APIs, not fake mock data' },
              { icon: Sparkles,  title: siteZh ? 'LLM Prompt 可复制' : 'Reusable LLM Prompts', desc: siteZh ? '附完整 System Prompt 与输出样本，复制即可用到你的应用里' : 'Includes full system prompts and output samples, ready to copy into your app' },
              { icon: Zap,       title: siteZh ? '30 秒看完全流程' : 'See Full Flow in 30s',   desc: siteZh ? '点进去不用登录、不用连麦，立刻看到评测 → 诊断 → 练习闭环' : 'No signup required—see evaluate → diagnose → practice instantly' },
            ].map((b) => (
              <div key={b.title} className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg border border-border/60 bg-background flex items-center justify-center shrink-0">
                  <b.icon className="h-4 w-4 text-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium">{b.title}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed mt-0.5">{b.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/demo?lang=${lang}&type=${effectiveActive}`}
              className="group inline-flex items-center justify-center h-11 px-6 text-sm font-semibold rounded-full bg-foreground text-background hover:bg-foreground/90 transition-all gap-2 shadow-lg shadow-foreground/10 hover:-translate-y-0.5"
            >
              {siteZh ? '立即体验 Demo' : 'Try Demo Now'} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/docs"
              className="group inline-flex items-center justify-center h-11 px-6 text-sm font-medium rounded-full border border-border hover:bg-muted/50 transition-colors gap-2"
            >
              <BookOpen className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
              {siteZh ? '查看文档' : 'View Docs'} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* ── 右：浏览器 Mock · 按 lang + active 动态切换 ── */}
        <div className="lg:col-span-7">
          <div className="rounded-xl border border-border/60 bg-background shadow-xl shadow-black/5 overflow-hidden">
            {/* 浏览器顶栏 */}
            <div className="h-9 border-b border-border/60 bg-muted/40 flex items-center px-3 gap-2">
              <div className="flex gap-1.5 shrink-0">
                <div className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="h-5 max-w-[280px] w-full rounded-full bg-background border border-border/60 px-3 flex items-center justify-center text-[10px] text-muted-foreground font-mono truncate">
                  speech-eval.site/demo · {data.urlHash}
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE
              </div>
            </div>

            {/* 内容（随 lang + active 变） · 带淡入动画 */}
            <div key={`${lang}-${effectiveActive}`} className="p-5 space-y-4 animate-in fade-in-0 slide-in-from-right-2 duration-300">
              {/* 1. 参考文本 */}
              <div>
                <div className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground mb-1.5 flex items-center gap-2">
                  <span>{data.kicker}</span>
                  <span className="h-0.5 w-0.5 rounded-full bg-muted-foreground/40" />
                  <span className="font-mono text-muted-foreground/70 normal-case tracking-normal">
                    coreType: <span className="text-foreground">{data.coreType}</span>
                  </span>
                </div>
                <div className="text-sm leading-relaxed">{data.text}</div>
              </div>

              {/* 2. 波形 + 播放条 */}
              <div className="rounded-lg bg-muted/40 border border-border/40 p-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-foreground flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-background"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                  <div className="flex-1 flex items-center gap-[2px] h-8">
                    {Array.from({ length: BAR_COUNT }).map((_, i) => {
                      const h = 18 + Math.abs(Math.sin(i / 2.3) * 50) + Math.abs(Math.cos(i / 3.7) * 25);
                      const played = i < playedUpTo;
                      return (
                        <div
                          key={i}
                          className={cn('flex-1 rounded-full transition-colors', played ? 'bg-foreground' : 'bg-foreground/20')}
                          style={{ height: `${Math.min(h, 100).toFixed(2)}%` }}
                        />
                      );
                    })}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono tabular-nums shrink-0">
                    {data.audioCur} / {data.audioTotal}
                  </div>
                </div>
              </div>

              {/* 3. 按题型动态得分卡 */}
              <div className={cn(
                'grid gap-2',
                data.scores.length === 2
                  ? 'grid-cols-2'
                  : data.scores.length === 5
                    ? 'grid-cols-2 sm:grid-cols-5'
                    : 'grid-cols-2 sm:grid-cols-4'
              )}>
                {data.scores.map((s) => (
                  <div key={s.label} className="rounded-lg border border-border/40 bg-background p-2 text-center">
                    <div className={cn(
                      'text-lg font-bold tabular-nums',
                      s.tone === 'amber' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                    )}>
                      {s.value}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* 4. LLM 诊断 chips */}
              <div>
                <div className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground mb-2">
                  {siteZh ? 'LLM 诊断 · 次生分析' : 'LLM Diagnosis · Secondary Analysis'}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {data.chips.map((c, i) => (
                    <span
                      key={i}
                      className={cn(
                        'text-xs border rounded px-2 py-0.5',
                        c.ok
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
                      )}
                    >
                      {c.text}
                    </span>
                  ))}
                </div>
              </div>

              {/* 5. 练习建议 */}
              <div className="rounded-lg bg-foreground/[0.03] border border-dashed border-border/60 p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-foreground" />
                  <span className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground">{data.practiceLabel}</span>
                </div>
                <div className="text-xs text-muted-foreground italic leading-relaxed">{data.practice}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部特性 strip */}
      <div className="max-w-6xl mx-auto mt-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 rounded-xl border border-border/60 bg-background/60 backdrop-blur-sm p-3">
          {[
            siteZh ? '中 / 英双语评测' : 'Chinese / English evaluation',
            siteZh ? '4 种真实题型覆盖' : '4 real task types covered',
            siteZh ? 'LLM Prompt 可复制' : 'Reusable LLM prompts',
            siteZh ? '30 秒看完全流程' : 'Full flow in 30 seconds',
          ].map((text) => (
            <div key={text} className="flex items-center gap-2 text-xs text-muted-foreground px-2 py-1.5">
              <Check className="h-3.5 w-3.5 text-foreground shrink-0" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
