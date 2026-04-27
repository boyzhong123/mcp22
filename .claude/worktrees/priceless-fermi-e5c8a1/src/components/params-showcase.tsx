'use client';

import { BarChart3, Target, ShieldCheck, AudioWaveform, Music2, Timer, ScanLine, Ruler } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';
import { FadeUp, StaggerContainer, StaggerItem, IconWrap } from './animated-section';

type FeatureKey =
  | 'overall'
  | 'accuracy'
  | 'integrity'
  | 'fluency'
  | 'rhythm'
  | 'speed'
  | 'diagnostics'
  | 'phoneme';

const FEATURES: { key: FeatureKey; icon: typeof BarChart3 }[] = [
  { key: 'overall', icon: BarChart3 },
  { key: 'accuracy', icon: Target },
  { key: 'integrity', icon: ShieldCheck },
  { key: 'fluency', icon: AudioWaveform },
  { key: 'rhythm', icon: Music2 },
  { key: 'speed', icon: Timer },
  { key: 'diagnostics', icon: ScanLine },
  { key: 'phoneme', icon: Ruler },
];

export function ParamsShowcase() {
  const t = useTranslations('Features');
  const [active, setActive] = useState<FeatureKey | null>(null);

  // Inline highlight wrapper
  function Hi({ on, keys, children }: { on?: boolean; keys?: FeatureKey[]; children: ReactNode }) {
    const matched = on ?? (active !== null && !!keys?.includes(active));
    return (
      <span
        className={`rounded-[3px] transition-all duration-200 ${
          matched
            ? 'bg-amber-400/20 ring-1 ring-amber-400/40 ring-offset-0'
            : 'bg-transparent ring-0'
        }`}
      >
        {children}
      </span>
    );
  }

  return (
    <div className="grid lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
      {/* ── Left: 8 param cards ── */}
      <StaggerContainer
        className="lg:col-span-3 min-w-0 grid sm:grid-cols-2 gap-px bg-border/40 border border-border/40 rounded-lg overflow-hidden"
        staggerDelay={0.06}
      >
        {FEATURES.map((f) => {
          const isActive = active === f.key;
          return (
            <StaggerItem key={f.key}>
              <div
                onMouseEnter={() => setActive(f.key)}
                onMouseLeave={() => setActive(null)}
                className={`bg-background p-5 flex gap-4 cursor-pointer h-full transition-colors duration-200 ${
                  isActive ? 'bg-amber-50/60 dark:bg-amber-500/[0.04]' : 'hover:bg-muted/30'
                }`}
              >
                <IconWrap
                  className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                    isActive ? 'bg-foreground text-background' : 'bg-muted text-foreground'
                  }`}
                >
                  <f.icon className="h-4 w-4" />
                </IconWrap>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-sm font-semibold">{t(f.key)}</h3>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-mono text-amber-600 dark:text-amber-400 shrink-0">
                        <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                        联动
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{t(`${f.key}_desc`)}</p>
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* ── Right: JSON with sync highlight ── */}
      <FadeUp delay={0.2} className="lg:col-span-2 min-w-0">
        <div className="rounded-lg border border-border/60 bg-zinc-950 text-zinc-100 overflow-hidden h-full flex flex-col">
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06]">
            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            <span className="ml-2 text-[11px] text-zinc-500 font-mono">mcp-response.json</span>
            {active && (
              <span className="ml-auto text-[10px] text-amber-400/80 font-mono flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                {active}
              </span>
            )}
          </div>
          <pre className="text-xs font-mono leading-relaxed p-5 flex-1 max-w-full overflow-auto">
{`{
  `}<span className="text-zinc-500">{'// 四大主维度'}</span>{`
  `}<Hi keys={['overall']}>{`"overall": `}<span className="text-amber-300">72</span></Hi>{`,
  "pron": {
    `}<Hi keys={['accuracy']}>{`"accuracy":  `}<span className="text-amber-300">65</span></Hi>{`,
    `}<Hi keys={['integrity']}>{`"integrity": `}<span className="text-amber-300">95</span></Hi>{`,
    `}<Hi keys={['fluency']}>{`"fluency":   `}<span className="text-amber-300">85</span></Hi>{`,
    `}<Hi keys={['rhythm']}>{`"rhythm":    `}<span className="text-amber-300">70</span></Hi>{`
  },
  `}<Hi keys={['speed']}>{`"speed": `}<span className="text-amber-300">130</span></Hi>{` `}<span className="text-zinc-500">{'// WPM'}</span>{`,

  `}<span className="text-zinc-500">{'// 词/音素级诊断'}</span>{`
  "details": [
    {
      "char":  `}<span className="text-emerald-400">{'"record"'}</span>{`,
      "score": `}<span className="text-amber-300">58</span>{`,
      `}<Hi keys={['diagnostics']}>{`"dp_type": `}<span className="text-rose-400">{'"mispron"'}</span></Hi>{`,
      `}<Hi keys={['phoneme']}>{`"phonemes": [
        { "char": `}<span className="text-emerald-400">{'"r"'}</span>{`, "score": `}<span className="text-amber-300">45</span>{`, "dp_type": `}<span className="text-rose-400">{'"mispron"'}</span>{` },
        { "char": `}<span className="text-emerald-400">{'"ɪ"'}</span>{`, "score": `}<span className="text-amber-300">78</span>{`, "dp_type": `}<span className="text-zinc-400">{'"normal"'}</span>{`  }
      ]`}</Hi>{`
    }
  ]
}`}
          </pre>
          <div className="px-4 py-2.5 border-t border-white/[0.06] text-[11px] text-zinc-400 flex flex-wrap items-center justify-between gap-2">
            <Hi keys={['diagnostics']}>
              <span>dp_type: normal / omit / insert / mispron</span>
            </Hi>
            <span className="font-mono text-zinc-500">考试级 API</span>
          </div>
        </div>
      </FadeUp>
    </div>
  );
}
