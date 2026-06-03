import type { ReactNode } from 'react';
import { AuthProvider } from './_lib/auth-context';
import { TooltipProvider } from '@/components/ui/tooltip';
import { HtmlLangSync } from '@/components/html-lang-sync';
import { DevEnLangToggle } from './_components/lang-toggle';
import { PaymentConfigProvider } from './_lib/payment-config';
import { DevEnContactWidget } from './_components/contact-widget';

export const metadata = {
  title: 'Chivox MCP · Developer (English preview)',
  description: 'Static preview of the English developer console for Chivox MCP.',
};

export default function DevEnLayout({ children }: { children: ReactNode }) {
  // The wrapping <div translate="no" lang="en"> prevents Chrome / Edge
  // auto-translation from mangling the English developer console. Without
  // this, when a user's browser locale is zh-CN, Chrome will sometimes
  // translate element attribute values too (e.g. `hover:underline` becomes
  // `hover：underline` with a full-width colon), causing JSX tags to fall
  // out of the DOM and render as literal text on the page.
  return (
    <TooltipProvider delay={300}>
      <AuthProvider>
        <PaymentConfigProvider>
          <HtmlLangSync lang="en" />
          <div translate="no" lang="en">
            {children}
            {/* Global "Contact us" entry — floating right-edge support
                launcher, present on every developer-console route. */}
            <DevEnContactWidget />
            {/* Dev-only EN / 中 language toggle. Shipping dev console is
                English only — this exists purely so the developer can QA
                content in Chinese without mentally translating. */}
            <DevEnLangToggle />
          </div>
        </PaymentConfigProvider>
      </AuthProvider>
    </TooltipProvider>
  );
}
