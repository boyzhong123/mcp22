import localFont from 'next/font/local';
import { Newsreader } from 'next/font/google';
import type { Metadata } from 'next';
import { RootThemeProvider } from '@/components/root-theme-provider';
import { SITE_URL } from '@/lib/site';
import './globals.css';

const geistSans = localFont({
  src: [
    { path: './fonts/GeistVF.woff2', style: 'normal' },
    { path: './fonts/GeistVF-ext.woff2', style: 'normal' },
  ],
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = localFont({
  src: [
    { path: './fonts/GeistMonoVF.woff2', style: 'normal' },
    { path: './fonts/GeistMonoVF-ext.woff2', style: 'normal' },
  ],
  variable: '--font-geist-mono',
  display: 'swap',
});

const fraunces = localFont({
  src: [
    { path: './fonts/FrauncesVF.woff2', style: 'normal' },
    { path: './fonts/FrauncesVF-italic.woff2', style: 'italic' },
  ],
  variable: '--font-hero-serif',
  display: 'swap',
});

/** HeroEarArt “think” watermark — Newsreader reads cleaner at large italic sizes. */
const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['400', '500', '600'],
  variable: '--font-think-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Chivox AI | Speech and Pronunciation Assessment',
    template: '%s',
  },
  description:
    'Speech assessment, pronunciation scoring and MCP tools for AI language tutors, voice agents and EdTech products.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${newsreader.variable} font-noto-sc h-full`}
    >
      <body className="min-h-full flex flex-col relative">
        <RootThemeProvider>{children}</RootThemeProvider>
      </body>
    </html>
  );
}
