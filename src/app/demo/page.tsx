import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Demo – Try Speaking AI Scoring | Chivox AI',
  description: "Try Chivox's pronunciation assessment MCP live. Record your voice and receive instant phoneme-level feedback from our speech recognition engine.",
  alternates: { canonical: '/demo' },
};

export { default } from '../global/demo/page';
