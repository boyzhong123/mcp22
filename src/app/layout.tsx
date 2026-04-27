import { Geist, Geist_Mono, Noto_Sans_SC, Fraunces } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

const notoSansSC = Noto_Sans_SC({
  variable: '--font-noto-sc',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const fraunces = Fraunces({
  variable: '--font-hero-serif',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['SOFT', 'opsz'],
  display: 'swap',
});

export const metadata = {
  title: 'Chivox MCP | Speech Assessment',
  description: 'Multi-dimensional Analysis & LLM Integration',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansSC.variable} ${fraunces.variable} h-full`}
    >
      <body className="min-h-full flex flex-col relative">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
