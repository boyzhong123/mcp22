'use client';

import { useEffect } from 'react';

/**
 * Forces light color scheme while any /global/* route is mounted.
 * The rest of the site (dashboard, docs, [locale]) keeps its
 * normal next-themes behavior — this only neutralizes `.dark`
 * for the standalone English landing + playground pages,
 * because their warm cream palette doesn't have a tuned dark
 * counterpart.
 */
export function ForceLightTheme() {
  useEffect(() => {
    const html = document.documentElement;
    const hadDark = html.classList.contains('dark');
    const prevColorScheme = html.style.colorScheme;

    html.classList.remove('dark');
    html.classList.add('light');
    html.style.colorScheme = 'light';

    return () => {
      html.classList.remove('light');
      if (hadDark) html.classList.add('dark');
      html.style.colorScheme = prevColorScheme;
    };
  }, []);

  return null;
}
