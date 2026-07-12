export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://chivox.voiceagent.bond'
).replace(/\/$/, '');

export function absoluteUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}
