import { redirect } from 'next/navigation';

/**
 * Root entry → canonical landing lives at `/global`, which has its own
 * layout (warm-cream wrapper; light theme is forced via RootThemeProvider on
 * these paths). Re-exporting the page
 * directly skipped that layout and broke the palette in dark-mode user
 * agents, so we redirect instead — single source of truth.
 */
export default function RootPage() {
  redirect('/global');
}
