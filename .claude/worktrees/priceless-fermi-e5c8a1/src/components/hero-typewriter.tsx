'use client';

import { Typewriter } from './typewriter';
import { useTranslations } from 'next-intl';

const TYPEWRITER_ZH = ['接入大模型', '生成教学反馈', '驱动口语练习', '赋能教育产品'];
const TYPEWRITER_EN = ['with LLMs', 'into Teaching', 'into Practice', 'into Products'];

export function HeroTypewriter({ locale }: { locale: string }) {
  useTranslations('Hero');
  const texts = locale === 'en' ? TYPEWRITER_EN : TYPEWRITER_ZH;

  return (
    <span className="bg-gradient-to-r from-foreground via-foreground/70 to-muted-foreground bg-clip-text text-transparent">
      <Typewriter texts={texts} speed={100} deleteSpeed={50} pauseMs={2200} />
    </span>
  );
}
