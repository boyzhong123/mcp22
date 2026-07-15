/**
 * Normalize the API's language value for display. Older responses may omit
 * the field, in which case a CoreType prefix is used as a compatibility hint.
 */
export function kernelLanguage(
  language: string | null | undefined,
  coreType: string,
): 'zh' | 'en' | '—' {
  const serverLanguage = language?.trim().toLowerCase();
  if (serverLanguage === 'zh' || serverLanguage === 'cn') return 'zh';
  if (serverLanguage === 'en') return 'en';

  const prefix = coreType.trim().split('.')[0]?.toLowerCase();
  if (prefix === 'zh' || prefix === 'cn') return 'zh';
  if (prefix === 'en') return 'en';
  return '—';
}
