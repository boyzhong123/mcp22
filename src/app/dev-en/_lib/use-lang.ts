'use client';

import { useSyncExternalStore } from 'react';
import { lookup } from './i18n-dict';
import {
  getLang,
  getLangServer,
  setLang as setLangImpl,
  subscribeLang,
  type DevEnLang,
} from './lang-store';

/**
 * `useLang()` returns `{ lang, setLang, t, tx }`.
 *
 *   const { t, tx } = useLang();
 *   <h1>{tx('Overview')}</h1>               ← dictionary-backed, recommended
 *   <p>{t('Hello {name}', '你好 {name}')}</p> ← use t() for dynamic strings
 *
 * `tx(en)` looks up `en` in the central i18n dictionary. If no entry is
 * registered the source English is returned unchanged, so components that
 * haven't been translated yet still render correctly — translations can be
 * added progressively in `i18n-dict.ts`.
 *
 * `t(en, zh)` is the older inline-pair form. Still supported for strings
 * that embed runtime values.
 */
export function useLang() {
  const lang = useSyncExternalStore(subscribeLang, getLang, getLangServer);
  const t = (en: string, zh: string) => (lang === 'zh' ? zh : en);
  const tx = (en: string) => lookup(en, lang);
  return { lang, setLang: setLangImpl, t, tx };
}

export type { DevEnLang };
