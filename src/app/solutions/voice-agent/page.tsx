import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site';

const title = 'Voice Agent Pronunciation Assessment | Speech Scoring API | Chivox';
const description =
  'Add real-time pronunciation and speech assessment to voice agents. Chivox enables accurate voice AI pronunciation scoring via MCP and API.';
const heroImage = '/solutions/voice-agent/voice-agent-hero.webp';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/solutions/voice-agent' },
  openGraph: {
    title,
    description,
    url: absoluteUrl('/solutions/voice-agent'),
    type: 'website',
    images: [
      {
        url: absoluteUrl(heroImage),
        width: 1536,
        height: 1024,
        alt: 'Professional speaking with a real-time voice agent at a laptop',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [absoluteUrl(heroImage)],
  },
};

export { default } from '../../global/reasoning/page';
