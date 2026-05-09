'use client';

import type { ReactNode } from 'react';
import { Bell } from 'lucide-react';
import { PageHeader } from '../../_components/page-header';

// Single-purpose surface today: notification preferences. The previous
// SectionTabs scaffolding (Notifications + Members) collapsed once the
// console went single-seat — when multi-seat lands we'll restore tabs.
export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Bell}
        title="Settings"
        zhTitle="设置"
        description="Email preferences and account-level low-balance alert. Personal info lives on your profile."
        zhDescription="邮件提醒偏好以及账户级余额不足提醒。个人资料请前往个人资料页。"
      />
      {children}
    </div>
  );
}
