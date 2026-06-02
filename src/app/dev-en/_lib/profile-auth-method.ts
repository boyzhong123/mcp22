type Translate = (en: string, zh: string) => string;

export function isEmailAuthMethod(method: string | undefined): boolean {
  return method === 'email';
}

export function authMethodLabel(method: string | undefined, t: Translate): string {
  return isEmailAuthMethod(method)
    ? t('Email sign-in', '邮箱登录')
    : t('Third-party sign-in', '第三方登录');
}
