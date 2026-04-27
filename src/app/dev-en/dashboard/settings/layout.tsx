import type { ReactNode } from 'react';
import { SectionTabs, type SectionTab } from '../../_components/section-tabs';

const TABS: SectionTab[] = [
  {
    href: '/dashboard/settings',
    label: 'Notifications',
    zhLabel: '通知',
    description:
      'Choose which emails reach you. Critical security alerts always fire and cannot be disabled.',
    zhDescription:
      '选择接收哪些邮件。重要安全告警始终开启，无法关闭。',
  },
  {
    href: '/dashboard/settings/members',
    label: 'Members',
    zhLabel: '团队成员',
    description:
      'Invite teammates to share keys, usage dashboards and billing. Roles control what each member can do.',
    zhDescription: '邀请成员共享密钥、用量数据与账单。通过角色控制权限。',
  },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <SectionTabs title="Settings" zhTitle="设置" tabs={TABS} />
      {children}
    </div>
  );
}
