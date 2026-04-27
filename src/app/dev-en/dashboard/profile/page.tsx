'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, Check, Mail, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLang } from '../../_lib/use-lang';
import { useMockAuth } from '../../_lib/mock-auth';

// Mock verification code. In a real flow this gets emailed — we surface it
// inline as a dev-preview hint so reviewers can actually complete the flow.
const MOCK_CODE = '123456';
const RESEND_SECONDS = 60;

export default function ProfilePage() {
  const { t } = useLang();
  const { user, updateProfile } = useMockAuth();
  const [profileName, setProfileName] = useState(user?.name ?? '');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatarUrl ?? '');
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Keep local edits in sync when the underlying user record changes
  // (e.g. after the email change modal writes through updateProfile).
  useEffect(() => {
    setProfileName(user?.name ?? '');
    setProfileAvatar(user?.avatarUrl ?? '');
  }, [user?.name, user?.avatarUrl]);

  const handleAvatarFile = (file: File | null) => {
    setAvatarError(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarError(t('Please choose an image file.', '请选择图片文件。'));
      return;
    }
    // 2 MB cap keeps the data URL under the localStorage budget used by
    // mock auth; real backend would hand back a CDN URL instead.
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError(t('Image is too large (max 2 MB).', '图片过大（最大 2 MB）。'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setProfileAvatar(reader.result);
    };
    reader.onerror = () => setAvatarError(t('Could not read file.', '读取文件失败。'));
    reader.readAsDataURL(file);
  };

  const profileDirty = useMemo(
    () => (user?.name ?? '') !== profileName || (user?.avatarUrl ?? '') !== profileAvatar,
    [user, profileName, profileAvatar],
  );

  const initials = useMemo(() => {
    const name = (profileName || user?.name || '').trim();
    if (!name) return 'U';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [profileName, user?.name]);

  const saveProfile = () => {
    updateProfile({ name: profileName.trim() || user?.name || '', avatarUrl: profileAvatar });
    setAvatarError(null);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1800);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page header — a back link keeps the "this is reached from the user
          chip, not from nav" mental model obvious. */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/overview"
            className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('Back to dashboard', '返回工作台')}
          </Link>
          <h1 className="mt-2 text-[22px] font-semibold tracking-tight">
            {t('Personal profile', '个人资料')}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            {t(
              'Information about you as an individual — separate from workspace settings.',
              '关于你个人的信息，与工作台的设置（通知、团队等）分开管理。',
            )}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background">
        {/* Avatar block */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative h-20 w-20 shrink-0 rounded-full overflow-hidden border border-border focus:outline-none focus:ring-2 focus:ring-ring/30"
              aria-label={t('Change avatar', '更换头像')}
            >
              {profileAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileAvatar}
                  alt={t('Avatar', '头像')}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-indigo-500 to-sky-500 text-white flex items-center justify-center text-xl font-semibold">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                handleAvatarFile(file);
                e.target.value = '';
              }}
            />
            <div className="min-w-0">
              <div className="text-sm font-medium">{t('Profile photo', '头像')}</div>
              <div className="text-[12px] text-muted-foreground mt-0.5">
                {t(
                  'Click the avatar or Upload to pick an image. PNG or JPG, up to 2 MB.',
                  '点击头像或「上传」选择图片，支持 PNG / JPG，最大 2 MB。',
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 px-3 rounded-md border border-border bg-background hover:bg-muted/50 text-xs font-medium inline-flex items-center gap-1.5"
                >
                  <Camera className="h-3.5 w-3.5" />
                  {t('Upload', '上传')}
                </button>
                {profileAvatar && (
                  <button
                    type="button"
                    onClick={() => setProfileAvatar('')}
                    className="h-8 px-3 rounded-md border border-border bg-background hover:bg-muted/50 text-xs font-medium inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t('Remove', '移除')}
                  </button>
                )}
              </div>
              {avatarError && (
                <div className="mt-1.5 text-[11px] text-red-500">{avatarError}</div>
              )}
            </div>
          </div>
        </div>

        {/* Name */}
        <div className="p-6 border-b border-border grid gap-2 sm:grid-cols-[180px_1fr]">
          <div>
            <div className="text-sm font-medium">{t('Name', '姓名')}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {t('Shown on receipts and in your sidebar.', '显示在账单回执与侧边栏。')}
            </div>
          </div>
          <input
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder={t('Your name', '你的姓名')}
            className="h-10 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30"
          />
        </div>

        {/* Email */}
        <div className="p-6 border-b border-border grid gap-2 sm:grid-cols-[180px_1fr]">
          <div>
            <div className="text-sm font-medium">{t('Email', '邮箱')}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {t(
                'Receives receipts, invoices and security alerts.',
                '接收账单回执、发票和安全告警。',
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-10 px-3 text-sm rounded-lg border border-border bg-muted/30 flex items-center truncate text-foreground">
              {user?.email ?? '—'}
            </div>
            <button
              type="button"
              onClick={() => setEmailModalOpen(true)}
              className="h-10 px-3 rounded-lg border border-border bg-background hover:bg-muted/50 text-xs font-medium whitespace-nowrap"
            >
              {t('Change email', '更换邮箱')}
            </button>
          </div>
        </div>

        {/* Read-only metadata */}
        <div className="p-6 grid gap-2 sm:grid-cols-[180px_1fr]">
          <div>
            <div className="text-sm font-medium">{t('Sign-in', '登录方式')}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {t('Bound when you created the account.', '创建账号时绑定。')}
            </div>
          </div>
          <div className="text-sm">
            <div className="font-medium">
              {user?.method ? labelForMethod(user.method, t) : '—'}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {t('Account created', '账号创建')}:{' '}
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
            </div>
          </div>
        </div>

        {/* Sticky-ish save bar */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 rounded-b-xl flex items-center justify-between gap-3">
          <div className="text-[12px] text-muted-foreground min-h-[18px]">
            {savedFlash ? (
              <span className="inline-flex items-center gap-1.5 text-foreground">
                <Check className="h-3.5 w-3.5 text-green-600" />
                {t('Profile saved.', '资料已保存。')}
              </span>
            ) : profileDirty ? (
              t('Unsaved changes', '有未保存的更改')
            ) : (
              ''
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!profileDirty}
              onClick={() => {
                setProfileName(user?.name ?? '');
                setProfileAvatar(user?.avatarUrl ?? '');
                setAvatarError(null);
              }}
              className="h-9 px-4 rounded-lg border border-border bg-background hover:bg-muted/50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('Discard', '放弃')}
            </button>
            <button
              type="button"
              disabled={!profileDirty}
              onClick={saveProfile}
              className="h-9 px-4 rounded-lg bg-foreground text-background text-sm font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('Save changes', '保存更改')}
            </button>
          </div>
        </div>
      </div>

      {emailModalOpen && (
        <EmailChangeModal
          currentEmail={user?.email ?? ''}
          onClose={() => setEmailModalOpen(false)}
          onConfirmed={(newEmail) => {
            updateProfile({ email: newEmail });
            setEmailModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function labelForMethod(method: string, t: (a: string, b: string) => string): string {
  if (method === 'google') return t('Google', 'Google');
  if (method === 'github') return t('GitHub', 'GitHub');
  if (method === 'microsoft') return t('Microsoft', 'Microsoft');
  if (method === 'email') return t('Email + one-time code', '邮箱 + 一次性验证码');
  return method;
}

// Two-step flow: (1) enter new email → send code, (2) enter code → confirm.
// Mocked server: any correctly-formatted email is accepted, and the code is
// always `123456`. A resend timer prevents impatient spam — same cadence we
// use on the login page SMS flow.
function EmailChangeModal({
  currentEmail,
  onClose,
  onConfirmed,
}: {
  currentEmail: string;
  onClose: () => void;
  onConfirmed: (newEmail: string) => void;
}) {
  const { t } = useLang();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [newEmail, setNewEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  const emailValid = /.+@.+\..+/.test(newEmail) && newEmail !== currentEmail;

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [resendIn]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const sendCode = () => {
    if (!emailValid) return;
    setStep('code');
    setCode('');
    setCodeError(null);
    setResendIn(RESEND_SECONDS);
  };

  const verify = () => {
    if (code.trim() === MOCK_CODE) {
      onConfirmed(newEmail.trim());
    } else {
      setCodeError(t('Incorrect code. Please try again.', '验证码不正确，请重试。'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-background border border-border shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm font-semibold">{t('Change email', '更换绑定邮箱')}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-md hover:bg-muted/50 flex items-center justify-center text-muted-foreground"
            aria-label={t('Close', '关闭')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-5 pt-4">
          <div className="flex items-center gap-2 text-[11px]">
            <StepPill active={step === 'email'} done={step === 'code'} n={1}>
              {t('New email', '新邮箱')}
            </StepPill>
            <div className="flex-1 h-px bg-border" />
            <StepPill active={step === 'code'} done={false} n={2}>
              {t('Verify', '验证')}
            </StepPill>
          </div>
        </div>

        {step === 'email' ? (
          <div className="px-5 py-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              {t(
                "We'll send a 6-digit code to the new address to confirm you own it. Your current email stays active until verification succeeds.",
                '我们会向新邮箱发送 6 位验证码。验证通过前，当前邮箱仍然有效。',
              )}
            </p>
            <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t('Current email', '当前邮箱')}
              </div>
              <div className="text-sm font-medium mt-0.5 truncate">{currentEmail || '—'}</div>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                {t('New email', '新邮箱')}
              </label>
              <input
                autoFocus
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && emailValid) sendCode();
                }}
                placeholder="new-email@example.com"
                className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30"
              />
            </div>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              {t('We sent a 6-digit code to', '我们已向')}{' '}
              <span className="font-medium text-foreground">{newEmail}</span>
              {t('. Enter it below to confirm.', ' 发送 6 位验证码，请输入以确认。')}
            </p>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                {t('Verification code', '验证码')}
              </label>
              <input
                autoFocus
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setCodeError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && code.length === 6) verify();
                }}
                placeholder="123456"
                className={cn(
                  'w-full h-11 px-3 text-base tracking-[0.4em] font-mono rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20',
                  codeError
                    ? 'border-red-500/60 focus:border-red-500'
                    : 'border-border focus:border-foreground/30',
                )}
              />
              {codeError && (
                <div className="mt-1.5 text-[11px] text-red-500">{codeError}</div>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <div className="rounded-md bg-muted/40 border border-border px-2 py-1 text-muted-foreground">
                {t('Demo code', '演示验证码')}:{' '}
                <span className="font-mono font-semibold text-foreground">{MOCK_CODE}</span>
              </div>
              <button
                type="button"
                disabled={resendIn > 0}
                onClick={() => setResendIn(RESEND_SECONDS)}
                className="text-foreground hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
              >
                {resendIn > 0
                  ? t(`Resend in ${resendIn}s`, `${resendIn} 秒后可重发`)
                  : t('Resend code', '重新发送')}
              </button>
            </div>
          </div>
        )}

        <div className="px-5 py-4 border-t border-border flex justify-between gap-2">
          <button
            type="button"
            onClick={step === 'email' ? onClose : () => setStep('email')}
            className="h-9 px-3 rounded-lg border border-border text-sm hover:bg-muted/50"
          >
            {step === 'email' ? t('Cancel', '取消') : t('Back', '返回')}
          </button>
          {step === 'email' ? (
            <button
              type="button"
              disabled={!emailValid}
              onClick={sendCode}
              className="h-9 px-4 rounded-lg bg-foreground text-background text-sm font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('Send code', '发送验证码')}
            </button>
          ) : (
            <button
              type="button"
              disabled={code.length !== 6}
              onClick={verify}
              className="h-9 px-4 rounded-lg bg-foreground text-background text-sm font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('Verify & update', '验证并更换')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepPill({
  n,
  active,
  done,
  children,
}: {
  n: number;
  active: boolean;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5',
        active || done ? 'text-foreground' : 'text-muted-foreground',
      )}
    >
      <span
        className={cn(
          'h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-semibold',
          done
            ? 'bg-green-600 text-white'
            : active
              ? 'bg-foreground text-background'
              : 'bg-muted text-muted-foreground',
        )}
      >
        {done ? <Check className="h-3 w-3" /> : n}
      </span>
      <span className="font-medium">{children}</span>
    </div>
  );
}
