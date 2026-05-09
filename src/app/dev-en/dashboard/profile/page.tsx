'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, Check, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLang } from '../../_lib/use-lang';
import { useMockAuth } from '../../_lib/mock-auth';

export default function ProfilePage() {
  const { t } = useLang();
  const { user, updateProfile } = useMockAuth();
  const [profileName, setProfileName] = useState(user?.name ?? '');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatarUrl ?? '');
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Keep local edits in sync when the underlying user record changes
  // (e.g. avatar uploaded successfully via the picker below).
  useEffect(() => {
    setProfileName(user?.name ?? '');
    setProfileAvatar(user?.avatarUrl ?? '');
  }, [user?.name, user?.avatarUrl]);

  const handleAvatarFile = async (file: File | null) => {
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
    try {
      setAvatarUploading(true);
      const body = new FormData();
      body.set('file', file);
      const res = await fetch('/api/upload/avatar', { method: 'POST', body });
      const json = (await res.json()) as { url?: string; message?: string };
      if (!res.ok || !json.url) {
        throw new Error(json.message || t('Upload failed.', '上传失败。'));
      }
      setProfileAvatar(json.url);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : t('Upload failed.', '上传失败。'));
    } finally {
      setAvatarUploading(false);
    }
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

  const saveProfile = async () => {
    const res = await updateProfile({
      name: profileName.trim() || user?.name || '',
      avatarUrl: profileAvatar,
    });
    if (!res.ok) {
      setAvatarError(res.error ?? t('Failed to save profile.', '保存资料失败。'));
      return;
    }
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
                void handleAvatarFile(file);
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
                  disabled={avatarUploading}
                  className="h-8 px-3 rounded-md border border-border bg-background hover:bg-muted/50 text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {avatarUploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Camera className="h-3.5 w-3.5" />
                  )}
                  {avatarUploading ? t('Uploading…', '上传中…') : t('Upload', '上传')}
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
          <div className="h-10 px-3 text-sm rounded-lg border border-border bg-muted/30 flex items-center truncate text-foreground">
            {user?.email ?? '—'}
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
              disabled={!profileDirty || avatarUploading}
              onClick={() => {
                void saveProfile();
              }}
              className="h-9 px-4 rounded-lg bg-foreground text-background text-sm font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('Save changes', '保存更改')}
            </button>
          </div>
        </div>
      </div>

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

