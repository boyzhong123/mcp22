import type { MetadataRoute } from 'next';
import { absoluteUrl, SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/dashboard/',
        '/dev-en/',
        '/oauth/',
        '/auth/',
        '/login',
        '/register',
        '/forgot-password',
      ],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL,
  };
}
