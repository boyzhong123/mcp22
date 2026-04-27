'use client';

import { useState } from 'react';
import {
  Copy,
  Check,
  Globe,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="absolute top-3 right-3 p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors text-zinc-400 hover:text-zinc-200"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export function CodeBlock({
  filename,
  lang,
  children,
  locale = 'zh',
}: {
  filename?: string;
  lang?: string;
  children: string;
  locale?: 'zh' | 'en';
}) {
  const hint = locale === 'en' ? 'Swipe horizontally to see full code' : '左右滑动查看完整代码';
  return (
    <div className="rounded-lg border border-border/60 bg-zinc-950 text-zinc-100 overflow-hidden my-4 relative">
      {filename && (
        <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2 border-b border-white/[0.06] text-[11px] sm:text-xs text-zinc-500 font-mono">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
          <span className="ml-2 truncate">{filename}</span>
          {lang && <span className="ml-auto text-zinc-600">{lang}</span>}
        </div>
      )}
      <CopyButton text={children.trim()} />
      <pre className="p-3 sm:p-4 text-[12px] sm:text-sm font-mono leading-relaxed overflow-x-auto">
        <code>{children.trim()}</code>
      </pre>
      <div className="sm:hidden px-3 pb-2 text-[10px] text-zinc-500">{hint}</div>
    </div>
  );
}

export function DocSection({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 mb-16">
      <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border/40">
        <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      </div>
      <div className="text-sm leading-relaxed text-foreground/90 space-y-6">{children}</div>
    </section>
  );
}

export function SubDoc({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-24 mb-10">
      <h3 className="text-base font-semibold mb-3">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function ParamTable({
  params,
  locale = 'zh',
}: {
  params: { name: string; type: string; required: boolean; desc: string }[];
  locale?: 'zh' | 'en';
}) {
  const h =
    locale === 'en'
      ? { n: 'Parameter', t: 'Type', r: 'Required', d: 'Description' }
      : { n: '参数', t: '类型', r: '必填', d: '说明' };
  return (
    <div className="overflow-x-auto rounded-lg border border-border/60">
      <table className="w-full min-w-[620px] text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-border/40 bg-muted/30">
            <th className="text-left py-2 px-3 font-medium">{h.n}</th>
            <th className="text-left py-2 px-3 font-medium">{h.t}</th>
            <th className="text-left py-2 px-3 font-medium">{h.r}</th>
            <th className="text-left py-2 px-3 font-medium">{h.d}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {params.map((p) => (
            <tr key={p.name}>
              <td className="py-2 px-3 font-mono text-xs">{p.name}</td>
              <td className="py-2 px-3 font-mono text-xs text-muted-foreground">{p.type}</td>
              <td className="py-2 px-3">
                {p.required ? (
                  <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="py-2 px-3 text-muted-foreground">{p.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Callout({
  type = 'info',
  children,
}: {
  type?: 'info' | 'warning' | 'tip';
  children: React.ReactNode;
}) {
  const styles = {
    info: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200',
    warning:
      'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200',
    tip: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200',
  };
  const icons = { info: Globe, warning: AlertTriangle, tip: Lightbulb };
  const Ic = icons[type];
  return (
    <div className={`flex gap-3 rounded-lg border p-4 text-sm ${styles[type]}`}>
      <Ic className="h-4 w-4 mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function FlowStep({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
        {title}
      </div>
      <div className="flex-1 text-sm">{children}</div>
    </div>
  );
}

export function ToolTable({
  tools,
  locale = 'zh',
}: {
  tools: [string, string, string][];
  locale?: 'zh' | 'en';
}) {
  const h =
    locale === 'en'
      ? { a: 'Tool', b: 'What it does', c: 'Typical use' }
      : { a: '工具名', b: '功能', c: '典型场景' };
  return (
    <div className="overflow-x-auto rounded-lg border border-border/60">
      <table className="w-full min-w-[680px] text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-border/40 bg-muted/30">
            <th className="text-left py-2 px-3 font-medium">{h.a}</th>
            <th className="text-left py-2 px-3 font-medium">{h.b}</th>
            <th className="text-left py-2 px-3 font-medium">{h.c}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {tools.map(([name, desc, scene]) => (
            <tr key={name}>
              <td className="py-2 px-3 font-mono text-xs">{name}</td>
              <td className="py-2 px-3">{desc}</td>
              <td className="py-2 px-3 text-muted-foreground">{scene}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
