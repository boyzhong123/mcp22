import type { MetadataRoute } from 'next';
import { ALL_MARKETING_PAGES } from '@/app/_marketing/seo-content';
import { absoluteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const corePages: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/global'), changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/about'), changeFrequency: 'monthly', priority: 0.8 },
    { url: absoluteUrl('/pricing'), changeFrequency: 'monthly', priority: 0.8 },
    { url: absoluteUrl('/demo'), changeFrequency: 'monthly', priority: 0.8 },
    { url: absoluteUrl('/docs'), changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteUrl('/faq'), changeFrequency: 'monthly', priority: 0.6 },
    { url: absoluteUrl('/blog'), changeFrequency: 'weekly', priority: 0.7 },
    { url: absoluteUrl('/reasoning'), changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteUrl('/runtime'), changeFrequency: 'monthly', priority: 0.7 },
  ];

  const detailPages: MetadataRoute.Sitemap = ALL_MARKETING_PAGES.map((page) => ({
    url: absoluteUrl(page.path),
    changeFrequency: 'monthly',
    priority: page.group === 'Product' ? 0.8 : 0.7,
  }));

  return [...corePages, ...detailPages];
}
