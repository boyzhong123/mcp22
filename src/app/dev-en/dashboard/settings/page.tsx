'use client';

import {
  Bell,
  Check,
  CreditCard,
  DollarSign,
  Lock,
  Mail,
  Rss,
  TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getNotificationSettings,
  updateNotificationSettings,
  type NotificationSettings,
} from '../../_lib/mock-store';
import { useMockStore } from '../../_lib/use-mock-store';
import { useLang } from '../../_lib/use-lang';

const DEFAULT_NOTIF: NotificationSettings = {
  weeklyUsageReport: true,
  paymentReceipts: true,
  invoiceReady: true,
  spendLimitAlerts: true,
  lowBalanceAlertsMaster: true,
  productUpdates: false,
  securityAlerts: true,
};

// NOTE: Personal info (avatar, name, email, sign-in method) lives on
// /dashboard/profile and is reachable via the sidebar user chip. The
// Settings surface is intentionally scoped to *workspace* preferences —
// notifications here, team members on /settings/members — so the two
// concerns stop fighting for the same page.
export default function SettingsPage() {
  const { t } = useLang();
  const notif = useMockStore(getNotificationSettings, DEFAULT_NOTIF);

  const patch = (p: Partial<NotificationSettings>) => {
    updateNotificationSettings(p);
  };

  return (
    <div className="space-y-6">
      <Section
        icon={Bell}
        title={t('Email notifications', '邮件通知')}
        subtitle={t(
          "We'll send these to your account email. Security alerts can't be disabled.",
          '将发送至你的账号邮箱。安全提醒无法关闭。',
        )}
      >
        <div className="divide-y divide-border rounded-lg border border-border bg-background overflow-hidden">
          <Toggle
            icon={TrendingDown}
            label={t('Weekly usage report', '每周用量报告')}
            desc={t(
              'Summary of last week — calls, spend, and top active keys. Mondays.',
              '每周一汇总上周调用量、消费和最活跃的 Key。',
            )}
            on={notif.weeklyUsageReport}
            onChange={(v) => patch({ weeklyUsageReport: v })}
          />
          <Toggle
            icon={CreditCard}
            label={t('Payment receipts', '付款回执')}
            desc={t(
              'Sent every time a top-up succeeds. Includes the invoice PDF.',
              '每次充值成功后发送，附发票 PDF。',
            )}
            on={notif.paymentReceipts}
            onChange={(v) => patch({ paymentReceipts: v })}
          />
          <Toggle
            icon={Mail}
            label={t('Monthly invoice ready', '月度发票就绪')}
            desc={t(
              'First of every month, a combined invoice for the previous month.',
              '每月 1 日收到上月合并发票。',
            )}
            on={notif.invoiceReady}
            onChange={(v) => patch({ invoiceReady: v })}
          />
          <Toggle
            icon={DollarSign}
            label={t('Spend limit alerts', '支出上限提醒')}
            desc={t(
              'Warn at 50 / 75 / 90% of monthly cap, and when auto-cutoff fires.',
              '月度上限 50 / 75 / 90% 以及自动熔断时提醒。',
            )}
            on={notif.spendLimitAlerts}
            onChange={(v) => patch({ spendLimitAlerts: v })}
          />
          <Toggle
            icon={Bell}
            label={t('Low-balance alerts (master)', '余额不足提醒（总开关）')}
            desc={t(
              'Master switch for the per-key alerts you configured on the API Keys page.',
              '控制在 API 密钥页面为每个 Key 配置的余额不足提醒。',
            )}
            on={notif.lowBalanceAlertsMaster}
            onChange={(v) => patch({ lowBalanceAlertsMaster: v })}
          />
          <Toggle
            icon={Rss}
            label={t('Product updates', '产品动态')}
            desc={t(
              'Occasional emails about new features and pricing changes.',
              '新功能和定价变更时偶尔邮件通知。',
            )}
            on={notif.productUpdates}
            onChange={(v) => patch({ productUpdates: v })}
          />
          <Toggle
            icon={Lock}
            label={t('Security alerts', '安全提醒')}
            desc={t(
              "Sign-in from new device, key rotated, billing email changed. Can't be disabled.",
              '新设备登录、密钥轮换、计费邮箱变更。无法关闭。',
            )}
            on={notif.securityAlerts}
            onChange={(v) => patch({ securityAlerts: v })}
            forced
          />
        </div>
      </Section>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-background">
      <div className="px-5 pt-5 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div>
            <div className="text-sm font-semibold">{title}</div>
            <div className="text-[11px] text-muted-foreground">{subtitle}</div>
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Toggle({
  icon: Icon,
  label,
  desc,
  on,
  onChange,
  forced,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  on: boolean;
  onChange: (v: boolean) => void;
  forced?: boolean;
}) {
  const { t } = useLang();
  return (
    <div className="flex items-start gap-4 px-4 py-3.5">
      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium flex items-center gap-2">
          {label}
          {forced && (
            <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Check className="h-2.5 w-2.5" />
              {t('Always on', '始终开启')}
            </span>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
          {desc}
        </div>
      </div>
      <button
        type="button"
        onClick={() => !forced && onChange(!on)}
        disabled={forced}
        role="switch"
        aria-checked={on}
        className={cn(
          'relative h-5 w-9 rounded-full transition-colors shrink-0 disabled:cursor-not-allowed disabled:opacity-70',
          on ? 'bg-foreground' : 'bg-muted-foreground/30',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-background transition-all shadow-sm',
            on ? 'left-[18px]' : 'left-0.5',
          )}
        />
      </button>
    </div>
  );
}
