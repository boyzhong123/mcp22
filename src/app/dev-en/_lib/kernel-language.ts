/** Normalize only Catalog-provided language metadata. CoreType prefixes are
 * not a reliable product contract and must not be used as a fallback. */
export function kernelLanguage(
  language: string | null | undefined,
): 'zh' | 'en' | '—' {
  const serverLanguage = language?.trim().toLowerCase();
  if (serverLanguage?.startsWith('zh') || serverLanguage === 'cn') return 'zh';
  if (serverLanguage?.startsWith('en')) return 'en';
  return '—';
}
