'use client';

import { useMemo, useState } from 'react';
import {
  Check,
  Clock,
  Crown,
  Mail,
  MoreHorizontal,
  Pencil,
  Shield,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formatDateShort,
  inviteTeamMember,
  listTeamMembers,
  removeTeamMember,
  resendTeamInvite,
  updateTeamMemberRole,
  type TeamMember,
  type TeamRole,
} from '../../../_lib/mock-store';
import { useMockStore } from '../../../_lib/use-mock-store';
import { useLang } from '../../../_lib/use-lang';

const ROLE_META: Record<TeamRole, {
  label: string;
  zhLabel: string;
  desc: string;
  zhDesc: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}> = {
  owner: {
    label: 'Owner',
    zhLabel: '所有者',
    desc: 'Full control, billing, cannot be removed.',
    zhDesc: '全权控制，计费权限，无法移除。',
    icon: Crown,
    tone: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  admin: {
    label: 'Admin',
    zhLabel: '管理员',
    desc: 'Manage keys, billing, and invite teammates.',
    zhDesc: '管理密钥、账单和成员邀请。',
    icon: Shield,
    tone: 'text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20',
  },
  developer: {
    label: 'Developer',
    zhLabel: '开发者',
    desc: 'Read/write keys and view usage. No billing access.',
    zhDesc: '读写密钥、查看用量，无计费权限。',
    icon: Pencil,
    tone: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20',
  },
  viewer: {
    label: 'Viewer',
    zhLabel: '观察者',
    desc: 'Read-only access. Great for QA and finance reviewers.',
    zhDesc: '只读访问，适合 QA 和财务审核。',
    icon: Mail,
    tone: 'text-zinc-600 dark:text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
  },
};

export default function TeamPage() {
  const { t } = useLang();
  const members = useMockStore(listTeamMembers, [] as TeamMember[]);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<TeamMember | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...members].sort((a, b) => {
        const order: Record<TeamRole, number> = {
          owner: 0,
          admin: 1,
          developer: 2,
          viewer: 3,
        };
        return order[a.role] - order[b.role];
      }),
    [members],
  );

  const active = members.filter((m) => m.status === 'active').length;
  const invited = members.filter((m) => m.status === 'invited').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-foreground text-background text-sm font-semibold hover:brightness-110"
        >
          <UserPlus className="h-4 w-4" />
          {t('Invite teammate', '邀请成员')}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label={t('Members', '成员')}
          value={String(members.length)}
          hint={`${active} ${t('active', '活跃')} · ${invited} ${t('invited', '待接受')}`}
        />
        <StatTile
          label={t('Seats', '席位')}
          value={t('Unlimited', '无上限')}
          hint={t('Pay-as-you-go plan — no seat fee.', '按量计费套餐 — 席位免费。')}
        />
        <StatTile
          label={t('SSO', 'SSO')}
          value={t('Available on request', '按需开通')}
          hint={t('SAML / OIDC. Contact support.', 'SAML / OIDC，联系支持开通。')}
        />
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="grid grid-cols-[2fr_1.2fr_1fr_auto] items-center gap-4 px-5 py-3 border-b border-border bg-muted/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>{t('Member', '成员')}</span>
          <span>{t('Role', '角色')}</span>
          <span>{t('Last active', '最近活跃')}</span>
          <span className="w-8" />
        </div>
        <ul className="divide-y divide-border">
          {sorted.map((m) => (
            <MemberRow
              key={m.id}
              member={m}
              menuOpen={menuFor === m.id}
              onOpenMenu={(open) => setMenuFor(open ? m.id : null)}
              onChangeRole={(role) => {
                updateTeamMemberRole(m.id, role);
                setMenuFor(null);
              }}
              onResendInvite={() => {
                resendTeamInvite(m.id);
                setMenuFor(null);
              }}
              onRemove={() => {
                setConfirmRemove(m);
                setMenuFor(null);
              }}
            />
          ))}
        </ul>
      </div>

      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}
      {confirmRemove && (
        <RemoveModal
          member={confirmRemove}
          onClose={() => setConfirmRemove(null)}
          onConfirm={() => {
            removeTeamMember(confirmRemove.id);
            setConfirmRemove(null);
          }}
        />
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1.5 text-xl font-semibold tracking-[-0.02em]">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarGradient(seed: number): string {
  // Deterministic pair of hues from the seed; tailwind arbitrary value.
  const h1 = (seed * 37) % 360;
  const h2 = (h1 + 45) % 360;
  return `linear-gradient(135deg, hsl(${h1} 70% 55%), hsl(${h2} 70% 45%))`;
}

function MemberRow({
  member,
  menuOpen,
  onOpenMenu,
  onChangeRole,
  onResendInvite,
  onRemove,
}: {
  member: TeamMember;
  menuOpen: boolean;
  onOpenMenu: (open: boolean) => void;
  onChangeRole: (role: TeamRole) => void;
  onResendInvite: () => void;
  onRemove: () => void;
}) {
  const { t, lang } = useLang();
  const meta = ROLE_META[member.role];
  const Icon = meta.icon;
  const isOwner = member.role === 'owner';
  const isInvited = member.status === 'invited';

  return (
    <li className="grid grid-cols-[2fr_1.2fr_1fr_auto] items-center gap-4 px-5 py-3.5">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="h-9 w-9 rounded-full flex items-center justify-center text-[12px] font-semibold text-white shrink-0"
          style={{ background: avatarGradient(member.avatarSeed) }}
        >
          {initialsOf(member.name)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{member.name}</span>
            {isInvited && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Clock className="h-2.5 w-2.5" />
                {t('Invited', '待接受')}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground truncate">{member.email}</div>
        </div>
      </div>

      <div>
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border',
            meta.tone,
          )}
        >
          <Icon className="h-3 w-3" />
          {t(meta.label, meta.zhLabel)}
        </span>
      </div>

      <div className="text-xs text-muted-foreground">
        {member.lastActiveAt
          ? formatDateShort(member.lastActiveAt)
          : t('Never', '从未')}
      </div>

      <div className="relative">
        {isOwner ? (
          <span className="text-[10px] text-muted-foreground/60 pr-2">—</span>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onOpenMenu(!menuOpen)}
              className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label={t('More actions', '更多操作')}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => onOpenMenu(false)}
                />
                <div className="absolute right-0 top-9 z-20 w-52 rounded-lg border border-border bg-background shadow-xl p-1">
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('Change role', '修改角色')}
                  </div>
                  {(['admin', 'developer', 'viewer'] as TeamRole[]).map((r) => {
                    const rm = ROLE_META[r];
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => onChangeRole(r)}
                        className={cn(
                          'w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-muted',
                          member.role === r && 'bg-muted',
                        )}
                      >
                        <rm.icon className="h-3.5 w-3.5" />
                        <span>{t(rm.label, rm.zhLabel)}</span>
                        {member.role === r && (
                          <Check className="h-3.5 w-3.5 ml-auto text-foreground/60" />
                        )}
                      </button>
                    );
                  })}
                  <div className="h-px bg-border my-1" />
                  {isInvited && (
                    <button
                      type="button"
                      onClick={onResendInvite}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-muted"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {t('Resend invite', '重发邀请')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onRemove}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-red-600 dark:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t('Remove from team', '移出团队')}
                  </button>
                </div>
              </>
            )}
          </>
        )}
        <span className="sr-only">{lang}</span>
      </div>
    </li>
  );
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('developer');
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/.+@.+\..+/.test(email)) return;
    inviteTeamMember({ email, role });
    setDone(true);
    window.setTimeout(onClose, 900);
  };

  return (
    <ModalShell onClose={onClose} title={t('Invite teammate', '邀请成员')}>
      {done ? (
        <div className="py-8 flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-3">
            <Check className="h-6 w-6 text-emerald-500" strokeWidth={2.5} />
          </div>
          <p className="text-sm font-semibold">{t('Invitation sent', '邀请已发送')}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t(`${email} will receive an email to join.`, `${email} 将收到加入邮件。`)}
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              {t('Email address', '邮箱地址')}
            </label>
            <input
              autoFocus
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@company.com"
              className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              {t('Role', '角色')}
            </label>
            <div className="space-y-1.5">
              {(['admin', 'developer', 'viewer'] as TeamRole[]).map((r) => {
                const m = ROLE_META[r];
                return (
                  <label
                    key={r}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border px-3 py-2 cursor-pointer',
                      role === r
                        ? 'border-foreground/40 bg-muted/40'
                        : 'border-border hover:bg-muted/30',
                    )}
                  >
                    <input
                      type="radio"
                      name="role"
                      checked={role === r}
                      onChange={() => setRole(r)}
                      className="mt-0.5 h-3.5 w-3.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <m.icon className="h-3.5 w-3.5" />
                        <span className="text-sm font-medium">{t(m.label, m.zhLabel)}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {t(m.desc, m.zhDesc)}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3 rounded-lg border border-border text-sm hover:bg-muted/50"
            >
              {t('Cancel', '取消')}
            </button>
            <button
              type="submit"
              disabled={!/.+@.+\..+/.test(email)}
              className="h-9 px-4 rounded-lg bg-foreground text-background text-sm font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('Send invite', '发送邀请')}
            </button>
          </div>
        </form>
      )}
    </ModalShell>
  );
}

function RemoveModal({
  member,
  onClose,
  onConfirm,
}: {
  member: TeamMember;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useLang();
  return (
    <ModalShell onClose={onClose} title={t('Remove teammate', '移除成员')}>
      <p className="text-sm text-muted-foreground">
        {t(
          `${member.name} (${member.email}) will immediately lose access to this workspace. They won't be notified.`,
          `${member.name} (${member.email}) 将立即失去该工作区的访问权限，且不会收到通知。`,
        )}
      </p>
      <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-border">
        <button
          type="button"
          onClick={onClose}
          className="h-9 px-3 rounded-lg border border-border text-sm hover:bg-muted/50"
        >
          {t('Cancel', '取消')}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="h-9 px-4 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
        >
          {t('Remove', '移除')}
        </button>
      </div>
    </ModalShell>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-background border border-border shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="text-sm font-semibold">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
