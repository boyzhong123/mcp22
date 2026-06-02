'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Camera,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Trash2,
} from 'lucide-react';
import { useLang } from '../../_lib/use-lang';
import { useMockAuth } from '../../_lib/mock-auth';
import { upload as uploadApi, describeError } from '../../_lib/api';
import { authMethodLabel, isEmailAuthMethod } from '../../_lib/profile-auth-method';
import { AvatarCropModal } from '../../_components/avatar-crop-modal';

export default function ProfilePage() {
  const { t } = useLang();
  const { user, updateProfile } = useMockAuth();
  const [profileName, setProfileName] = useState(user?.name ?? '');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatarUrl ?? '');
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  // The file the user just picked, pending crop. Drives the crop modal.
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Step 1: validate the picked file, then open the square-crop modal.
  const handleAvatarFile = (file: File | null) => {
    setAvatarError(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarError(t('Please choose an image file.', '请选择图片文件。'));
      return;
    }
    // Allow a generous source size — we crop + recompress client-side to a
    // 512×512 JPEG that lands well under the backend's 2 MB cap. Only reject
    // absurdly large originals that could hang the browser.
    if (file.size > 25 * 1024 * 1024) {
      setAvatarError(t('Image is too large (max 25 MB).', '图片过大（最大 25 MB）。'));
      return;
    }
    setCropFile(file);
  };

  // Step 2: upload the cropped + compressed square blob.
  const handleCropped = async (blob: Blob) => {
    setAvatarError(null);
    try {
      setAvatarUploading(true);
      const { url } = await uploadApi.avatar(blob);
      setProfileAvatar(url);
      setCropFile(null);
    } catch (err) {
      setAvatarError(describeError(err));
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
              '关于你个人的信息，与工作台的设置（通知等）分开管理。',
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
                  'Click the avatar or Upload to pick an image. You can crop it to a square; it is compressed to stay under 2 MB.',
                  '点击头像或「上传」选择图片，可裁剪为正方形，并自动压缩到 2 MB 以内。',
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
                'Receives payment receipts and security alerts.',
                '接收付款回执和安全告警。',
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
              {user ? authMethodLabel(user.method, t) : '—'}
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

      {/* Security — change password */}
      {isEmailAuthMethod(user?.method) && <ChangePasswordCard />}

      {cropFile && (
        <AvatarCropModal
          file={cropFile}
          busy={avatarUploading}
          onCancel={() => setCropFile(null)}
          onCropped={handleCropped}
        />
      )}
    </div>
  );
}

// Standalone so its form state is isolated from the profile form above.
// 设计稿：提交为本地模拟，真正接入时替换为：
//   POST /api/auth/change-password  body: { current_password, new_password }
// （需登录，client.ts 的 request() 默认会带上 Authorization 头。）
function ChangePasswordCard() {
  const { t } = useLang();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const nextValid = next.length >= 6;
  const matches = next === confirm;
  const sameAsCurrent = next.length > 0 && next === current;
  const canSubmit =
    current.length > 0 && nextValid && matches && !sameAsCurrent && !submitting;

  const submit = async () => {
    setError(null);
    if (!current) {
      setError(t('Enter your current password.', '请输入当前密码。'));
      return;
    }
    if (!nextValid) {
      setError(t('New password must be at least 6 characters.', '新密码至少 6 位。'));
      return;
    }
    if (sameAsCurrent) {
      setError(t('New password must differ from the current one.', '新密码不能与当前密码相同。'));
      return;
    }
    if (!matches) {
      setError(t('The two passwords do not match.', '两次输入的密码不一致。'));
      return;
    }
    setSubmitting(true);
    // TODO(api): await auth.changePassword({ current_password: current, new_password: next });
    await new Promise((r) => window.setTimeout(r, 800));
    setSubmitting(false);
    setCurrent('');
    setNext('');
    setConfirm('');
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2400);
  };

  const fieldClass =
    'w-full h-10 pl-9 pr-10 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30';

  return (
    <div className="mt-6 rounded-xl border border-border bg-background">
      <div className="p-6 border-b border-border flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 rounded-lg bg-muted/60 border border-border flex items-center justify-center">
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <div className="text-sm font-medium">{t('Password', '密码')}</div>
          <div className="text-[12px] text-muted-foreground mt-0.5">
            {t(
              'Change the password used for email sign-in. Choose at least 6 characters.',
              '修改用于邮箱登录的密码，至少 6 位。',
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4 max-w-md">
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs px-3 py-2">
            {error}
          </div>
        )}

        <PasswordField
          label={t('Current password', '当前密码')}
          value={current}
          onChange={(v) => {
            setCurrent(v);
            setError(null);
          }}
          show={show}
          autoComplete="current-password"
          placeholder={t('Your current password', '当前密码')}
          fieldClass={fieldClass}
        />

        <PasswordField
          label={t('New password', '新密码')}
          value={next}
          onChange={(v) => {
            setNext(v);
            setError(null);
          }}
          show={show}
          onToggleShow={() => setShow((s) => !s)}
          autoComplete="new-password"
          placeholder={t('At least 6 characters', '至少 6 位')}
          fieldClass={fieldClass}
        />

        <div>
          <PasswordField
            label={t('Confirm new password', '确认新密码')}
            value={confirm}
            onChange={(v) => {
              setConfirm(v);
              setError(null);
            }}
            show={show}
            autoComplete="new-password"
            placeholder={t('Re-enter the new password', '再次输入新密码')}
            fieldClass={fieldClass}
          />
          {confirm.length > 0 && !matches && (
            <p className="mt-1 text-[11px] text-red-500">
              {t('Passwords do not match.', '两次密码不一致。')}
            </p>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground">
          {t('Forgot your current password? ', '忘记当前密码？')}
          <Link
            href="/forgot-password"
            className="text-foreground font-medium hover:underline underline-offset-4"
          >
            {t('Reset it by email', '通过邮箱重置')}
          </Link>
        </p>
      </div>

      <div className="px-6 py-4 border-t border-border bg-muted/20 rounded-b-xl flex items-center justify-between gap-3">
        <div className="text-[12px] text-muted-foreground min-h-[18px]">
          {savedFlash && (
            <span className="inline-flex items-center gap-1.5 text-foreground">
              <Check className="h-3.5 w-3.5 text-green-600" />
              {t('Password updated.', '密码已更新。')}
            </span>
          )}
        </div>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => {
            void submit();
          }}
          className="h-9 px-4 rounded-lg bg-foreground text-background text-sm font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {t('Update password', '更新密码')}
        </button>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggleShow,
  autoComplete,
  placeholder,
  fieldClass,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow?: () => void;
  autoComplete: string;
  placeholder: string;
  fieldClass: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      <div className="relative">
        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
        <input
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={fieldClass}
        />
        {onToggleShow && (
          <button
            type="button"
            onClick={onToggleShow}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
