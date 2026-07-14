'use client';

import { useEffect, useState, useTransition } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Mail, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  sendGlobalContactEmail,
  type GlobalContactFormData,
  type GlobalContactUseCase,
} from '@/app/actions/send-global-contact';
import { useLang } from '../_lib/use-lang';

const USE_CASE_OPTIONS: Array<{ value: GlobalContactUseCase; labelEn: string; labelZh: string }> = [
  { value: 'language-learning', labelEn: 'Language learning', labelZh: '语言学习' },
  { value: 'serious-games', labelEn: 'Serious games / consumer', labelZh: '严肃游戏 / 消费级' },
  { value: 'accessibility', labelEn: 'Accessibility / speech therapy', labelZh: '无障碍 / 言语治疗' },
  { value: 'enterprise-training', labelEn: 'Enterprise training & L&D', labelZh: '企业培训 / L&D' },
  { value: 'research', labelEn: 'Research / academic', labelZh: '科研 / 学术' },
  { value: 'other', labelEn: 'Other', labelZh: '其他' },
];

export type EnterpriseContactFormProps = {
  /** Tracking source written into the outbound email (homepage-compatible). */
  source: string;
  /** Prefill work email when the console user is signed in. */
  defaultEmail?: string;
  /** Prefill name when available. */
  defaultName?: string;
  /** Extra class on the outer form. */
  className?: string;
  /** Compact spacing for the floating contact widget. */
  compact?: boolean;
  /** Called after a successful send (e.g. close a panel). */
  onSuccess?: () => void;
  /** Optional id so an external sticky button can submit via `form="…"`. */
  formId?: string;
  /** When true, hide the in-form submit (parent owns the CTA via `form=`). */
  hideSubmit?: boolean;
  /** Notify parent when the server action is in flight (for sticky CTAs). */
  onPendingChange?: (pending: boolean) => void;
  /** Notify parent of form status (so sticky CTAs can mirror success / reset). */
  onStatusChange?: (status: 'idle' | 'success' | 'error') => void;
};

/**
 * Same lead fields + `sendGlobalContactEmail` pipeline as the /global homepage
 * contact form — bilingual for the developer console / checkout modal.
 */
export function EnterpriseContactForm({
  source,
  defaultEmail = '',
  defaultName = '',
  className,
  compact = false,
  onSuccess,
  formId = 'enterprise-contact-form',
  hideSubmit = false,
  onPendingChange,
  onStatusChange,
}: EnterpriseContactFormProps) {
  const { t } = useLang();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<'company' | 'name' | 'email', string>>
  >({});
  const [form, setForm] = useState<GlobalContactFormData>({
    company: '',
    name: defaultName,
    email: defaultEmail,
    useCase: undefined,
    message: '',
    source,
  });

  useEffect(() => {
    setForm((f) => ({
      ...f,
      source,
      email: f.email || defaultEmail,
      name: f.name || defaultName,
    }));
  }, [source, defaultEmail, defaultName]);

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  const inputClass = cn(
    'w-full rounded-lg border border-border bg-background px-3 text-[13px] text-foreground',
    'placeholder:text-muted-foreground/70',
    'focus:outline-none focus:border-emerald-500/55 focus:ring-2 focus:ring-emerald-500/15',
    'disabled:opacity-60 transition-all',
    compact ? 'h-10' : 'h-11',
  );
  const labelClass = 'mb-1 block text-[12px] font-medium text-foreground';
  const invalidClass =
    'border-rose-400 focus:border-rose-400 focus:ring-rose-500/15 dark:border-rose-500/60';
  const fieldErrorText = (msg: string | undefined, id: string) =>
    msg ? (
      <p id={id} className="mt-1 flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400">
        <AlertCircle className="h-3 w-3 shrink-0" />
        {msg}
      </p>
    ) : null;

  // Inline validation instead of the browser's native `required` bubbles —
  // those render as OS-styled tooltips that clash with the modal UI and
  // vanish on the first click elsewhere.
  const validate = (): typeof fieldErrors => {
    const errors: typeof fieldErrors = {};
    if (!form.company.trim()) {
      errors.company = t('Please enter your company name.', '请填写公司名称。');
    }
    if (!form.name.trim()) {
      errors.name = t('Please enter your name.', '请填写您的姓名。');
    }
    if (!form.email.trim()) {
      errors.email = t('Please enter your work email.', '请填写工作邮箱。');
    } else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      errors.email = t(
        'That doesn’t look like a valid email address.',
        '邮箱格式不正确，请检查后重试。',
      );
    }
    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('idle');
    setErrorMsg('');
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const first = (['company', 'name', 'email'] as const).find((k) => errors[k]);
      // Focus after the error re-render commits, or the browser drops it.
      if (first) {
        requestAnimationFrame(() =>
          document.getElementById(`${formId}-${first}`)?.focus(),
        );
      }
      return;
    }
    startTransition(async () => {
      const result = await sendGlobalContactEmail(form);
      if (result.success) {
        setStatus('success');
        onSuccess?.();
      } else {
        setStatus('error');
        setErrorMsg(
          result.error ||
            t('Submission failed. Please try again.', '提交失败，请重试。'),
        );
      }
    });
  };

  if (status === 'success') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center text-center',
          compact ? 'py-6' : 'py-8',
          className,
        )}
      >
        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
          {t('Thanks — your note is in.', '已收到，我们会尽快回复。')}
        </h3>
        <p className="mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">
          {t(
            'We’ll get back within one business day. For anything urgent, email',
            '我们会在一个工作日内回复。紧急事项可直接发邮件至',
          )}{' '}
          <a
            href="mailto:ming.zhao@chivox.com"
            className="font-medium text-emerald-700 underline underline-offset-2 hover:no-underline dark:text-emerald-400"
          >
            ming.zhao@chivox.com
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus('idle');
            setFieldErrors({});
            setForm({
              company: '',
              name: defaultName,
              email: defaultEmail,
              useCase: undefined,
              message: '',
              source,
            });
          }}
          className="mt-4 text-[12.5px] font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground hover:no-underline"
        >
          {t('Send another message', '再发一条')}
        </button>
      </div>
    );
  }

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      noValidate
      className={cn('space-y-3', className)}
    >
      <div>
        <div className="mb-1 text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
          /get-in-touch
        </div>
        <h3 className="text-[14.5px] font-semibold tracking-tight text-foreground">
          {t('Tell us what you’re building.', '告诉我们你在做什么。')}
        </h3>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
          {t(
            'Share company details and expected volume — we route this to the partnership team.',
            '请填写公司信息与预计用量，系统会自动发给合作对接人。',
          )}
        </p>
      </div>

      {status === 'error' && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12.5px] text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className={cn('grid gap-3', compact ? 'grid-cols-1' : 'sm:grid-cols-2')}>
        <div>
          <label className={labelClass} htmlFor={`${formId}-company`}>
            {t('Company', '公司')} <span className="text-rose-500">*</span>
          </label>
          <input
            id={`${formId}-company`}
            type="text"
            value={form.company}
            onChange={(e) => {
              setForm({ ...form, company: e.target.value });
              if (fieldErrors.company) setFieldErrors({ ...fieldErrors, company: undefined });
            }}
            placeholder={t('Acme Inc.', '公司名称')}
            className={cn(inputClass, fieldErrors.company && invalidClass)}
            disabled={isPending}
            autoComplete="organization"
            required
            aria-invalid={!!fieldErrors.company}
            aria-describedby={fieldErrors.company ? `${formId}-company-error` : undefined}
          />
          {fieldErrorText(fieldErrors.company, `${formId}-company-error`)}
        </div>
        <div>
          <label className={labelClass} htmlFor={`${formId}-name`}>
            {t('Your name', '您的姓名')} <span className="text-rose-500">*</span>
          </label>
          <input
            id={`${formId}-name`}
            type="text"
            value={form.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value });
              if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: undefined });
            }}
            placeholder={t('Jane Doe', '姓名')}
            className={cn(inputClass, fieldErrors.name && invalidClass)}
            disabled={isPending}
            autoComplete="name"
            required
            aria-invalid={!!fieldErrors.name}
            aria-describedby={fieldErrors.name ? `${formId}-name-error` : undefined}
          />
          {fieldErrorText(fieldErrors.name, `${formId}-name-error`)}
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor={`${formId}-email`}>
          {t('Work email', '工作邮箱')} <span className="text-rose-500">*</span>
        </label>
        <input
          id={`${formId}-email`}
          type="email"
          value={form.email}
          onChange={(e) => {
            setForm({ ...form, email: e.target.value });
            if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
          }}
          placeholder="jane@acme.com"
          className={cn(inputClass, fieldErrors.email && invalidClass)}
          disabled={isPending}
          autoComplete="email"
          required
          aria-invalid={!!fieldErrors.email}
          aria-describedby={fieldErrors.email ? `${formId}-email-error` : undefined}
        />
        {fieldErrorText(fieldErrors.email, `${formId}-email-error`)}
      </div>

      <div>
        <label className={labelClass} htmlFor={`${formId}-usecase`}>
          {t('What are you building?', '你在构建什么？')}{' '}
          <span className="font-normal text-muted-foreground">
            ({t('optional', '可选')})
          </span>
        </label>
        <select
          id={`${formId}-usecase`}
          value={form.useCase ?? ''}
          onChange={(e) =>
            setForm({
              ...form,
              useCase: (e.target.value || undefined) as GlobalContactUseCase | undefined,
            })
          }
          className={cn(inputClass, 'cursor-pointer appearance-none pr-10')}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2371717a' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
          }}
          disabled={isPending}
        >
          <option value="">{t('Select a use case…', '选择使用场景…')}</option>
          {USE_CASE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {t(o.labelEn, o.labelZh)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor={`${formId}-message`}>
          {t('Anything we should know?', '还有什么需要我们知道？')}{' '}
          <span className="font-normal text-muted-foreground">
            ({t('optional', '可选')})
          </span>
        </label>
        <textarea
          id={`${formId}-message`}
          value={form.message ?? ''}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder={t(
            'Expected monthly volume, billing / PO needs, region, timeline…',
            '预计月用量、开票/采购需求、部署区域、时间计划…',
          )}
          rows={compact ? 3 : 4}
          className={cn(
            inputClass,
            'h-auto resize-none py-2.5',
          )}
          disabled={isPending}
          maxLength={4000}
        />
      </div>

      {!hideSubmit && (
        <div className={cn('flex flex-col gap-2 pt-0.5', !compact && 'sm:flex-row sm:items-start')}>
          <button
            type="submit"
            disabled={isPending}
            className={cn(
              'inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 text-sm font-semibold text-white',
              'shadow-[0_1px_0_rgba(255,255,255,0.12)_inset] transition-colors',
              'hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60',
              compact && 'w-full',
            )}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('Sending…', '发送中…')}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {t('Send message', '发送信息')}
              </>
            )}
          </button>
          <p className="text-[11px] leading-relaxed text-muted-foreground sm:flex-1">
            {t(
              'By submitting you agree to receive a reply from the Chivox MCP team. We don’t share your email with third parties.',
              '提交即表示你同意接收 Chivox MCP 团队回复。我们不会与第三方共享你的邮箱。',
            )}
          </p>
        </div>
      )}

      {hideSubmit && (
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Mail className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
          {t(
            'Submitted to ming.zhao@chivox.com · reply within 1 business day.',
            '将发送至 ming.zhao@chivox.com · 一个工作日内回复。',
          )}
        </p>
      )}
    </form>
  );
}
