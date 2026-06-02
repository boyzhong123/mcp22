'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useLang } from '../_lib/use-lang';

export function LegalAgreementCheckbox({
  checked,
  onChange,
  id = 'legal-agreement',
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  className?: string;
}) {
  const { t } = useLang();

  return (
    <label
      htmlFor={id}
      className={cn(
        'flex gap-2.5 text-[11px] text-muted-foreground leading-[1.45] cursor-pointer select-none',
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-[3px] h-3.5 w-3.5 shrink-0 rounded border-border accent-foreground"
      />
      <span>
        {t('I have read and agree to the ', '我已阅读并同意')}
        <Link
          href="/legal/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground font-medium underline underline-offset-2 hover:text-foreground/80"
          onClick={(e) => e.stopPropagation()}
        >
          {t('Terms of Service', '《服务条款》')}
        </Link>
        {t(' and ', ' 与 ')}
        <Link
          href="/legal/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground font-medium underline underline-offset-2 hover:text-foreground/80"
          onClick={(e) => e.stopPropagation()}
        >
          {t('Privacy Policy', '《隐私政策》')}
        </Link>
        {t('.', '。')}
      </span>
    </label>
  );
}
