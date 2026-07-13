'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  LifeBuoy,
  Mail,
  MessageCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLang } from '../_lib/use-lang';
import { useMockAuth } from '../_lib/mock-auth';
import { EnterpriseContactForm } from './enterprise-contact-form';

/**
 * Global "Contact us" launcher — the floating support entry that sits on
 * the right edge of every developer-console route (login, dashboard, …),
 * following the bottom-right "messenger bubble" convention popularised by
 * Intercom / Zendesk / Crisp on Western SaaS sites.
 *
 * Channels:
 *   • Technical support — mailto + copy (support@chivox.com)
 *   • Sales & enterprise — form → sendGlobalContactEmail (same as homepage)
 *   • Docs link
 */

const SUPPORT_EMAIL = 'support@chivox.com';

type Panel = 'menu' | 'sales';

export function DevEnContactWidget() {
  const { t } = useLang();
  const { user } = useMockAuth();
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>('menu');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (panel === 'sales') setPanel('menu');
        else setOpen(false);
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setPanel('menu');
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open, panel]);

  useEffect(() => {
    if (!open) setPanel('menu');
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="fixed bottom-[4.75rem] right-4 z-40 flex flex-col items-end gap-3"
    >
      {open && (
        <div
          role="dialog"
          aria-label={t('Contact us', '联系我们')}
          className={cn(
            'origin-bottom-right overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl shadow-black/[0.16] dark:shadow-black/60 ring-1 ring-black/[0.02] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200',
            panel === 'sales'
              ? 'w-[min(22.5rem,calc(100vw-2rem))]'
              : 'w-[min(21rem,calc(100vw-2rem))]',
          )}
        >
          <div className="relative overflow-hidden px-5 pt-5 pb-4">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/[0.14] via-teal-500/[0.06] to-transparent"
            />
            <div className="relative flex items-center gap-3">
              {panel === 'sales' ? (
                <button
                  type="button"
                  onClick={() => setPanel('menu')}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-background/70 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={t('Back', '返回')}
                >
                  <ArrowLeft className="h-[18px] w-[18px]" />
                </button>
              ) : (
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm shadow-emerald-500/30">
                  <LifeBuoy className="h-[18px] w-[18px]" />
                </span>
              )}
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold leading-tight tracking-[-0.01em] text-foreground">
                  {panel === 'sales'
                    ? t('Sales & enterprise', '销售与企业合作')
                    : t('Contact us', '联系我们')}
                </h2>
                <span className="mt-0.5 flex items-center gap-1.5 text-[11.5px] font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  {t('Replies within one business day', '一个工作日内回复')}
                </span>
              </div>
            </div>
          </div>

          {panel === 'sales' ? (
            <div className="max-h-[min(28rem,60vh)] overflow-y-auto px-4 pb-4 [scrollbar-width:thin]">
              <EnterpriseContactForm
                source="/dev-en#contact-widget-sales"
                defaultEmail={user?.email ?? ''}
                defaultName={user?.name ?? ''}
                compact
                formId="dev-en-contact-widget-sales"
                onSuccess={() => {
                  /* keep panel open so the success state is visible */
                }}
              />
            </div>
          ) : (
            <div className="px-2.5 pb-2.5">
              <EmailRow
                icon={<LifeBuoy className="h-[18px] w-[18px]" />}
                label={t('Technical support', '技术支持')}
                email={SUPPORT_EMAIL}
                subject="Chivox MCP support request"
                copyLabel={t('Copy email', '复制邮箱')}
                copiedLabel={t('Copied', '已复制')}
              />
              <button
                type="button"
                onClick={() => setPanel('sales')}
                className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted/70"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-emerald-500/12 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  <Mail className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-medium leading-tight text-foreground">
                    {t('Sales & enterprise', '销售与企业合作')}
                  </span>
                  <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">
                    {t('Fill a short form — auto-sent to sales', '填写简表，自动发送给销售')}
                  </span>
                </span>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-foreground" />
              </button>

              <Link
                href="/global/docs?from=dev"
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/70"
                onClick={() => setOpen(false)}
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-emerald-500/12 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  <BookOpen className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-medium leading-tight text-foreground">
                    {t('Browse the docs', '查阅文档')}
                  </span>
                  <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">
                    {t('Guides, API reference & quickstarts', '指南、API 参考与快速上手')}
                  </span>
                </span>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-foreground" />
              </Link>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        data-tour="contact-launcher"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? t('Close contact', '关闭联系我们') : t('Contact us', '联系我们')}
        className={cn(
          'group relative inline-flex h-12 items-center gap-2 rounded-full shadow-lg shadow-black/20 dark:shadow-black/50 transition-all duration-200 active:scale-95',
          open
            ? 'w-12 justify-center border border-border bg-card text-foreground hover:bg-muted/70'
            : 'bg-foreground px-5 text-background hover:shadow-xl hover:shadow-black/25',
        )}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <>
            <MessageCircle className="h-5 w-5" />
            <span className="text-[13.5px] font-semibold tracking-[-0.01em]">
              {t('Contact', '联系我们')}
            </span>
            <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-foreground bg-emerald-500" />
            </span>
          </>
        )}
      </button>
    </div>
  );
}

function EmailRow({
  icon,
  label,
  email,
  subject,
  copyLabel,
  copiedLabel,
}: {
  icon: React.ReactNode;
  label: string;
  email: string;
  subject: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard may be unavailable (insecure context) — mailto still works */
    }
  };

  return (
    <a
      href={`mailto:${email}?subject=${encodeURIComponent(subject)}`}
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/70"
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-emerald-500/12 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-medium leading-tight text-foreground">
          {label}
        </span>
        <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">{email}</span>
      </span>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? copiedLabel : copyLabel}
        title={copied ? copiedLabel : copyLabel}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 opacity-0 transition-all hover:bg-background hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </a>
  );
}
