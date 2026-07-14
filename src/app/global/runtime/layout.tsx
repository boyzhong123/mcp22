import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Speech Assessment API Runtime, Usage Controls and SLA | Chivox AI',
  description:
    'Operate a production speech assessment API with scoped keys, hard usage caps, alerts, usage analytics, zero-retention streaming and a 99.95% enterprise SLA.',
  alternates: { canonical: '/runtime' },
  openGraph: {
    title: 'Production controls for speech assessment APIs | Chivox AI',
    description:
      'Keys, usage caps, alerts, observability, privacy and production scale for pronunciation scoring and speech assessment APIs.',
    url: '/runtime',
    type: 'website',
  },
};

export default function RuntimeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
