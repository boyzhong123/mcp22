import type { ReactNode } from 'react';
import { MockAuthProvider } from './_lib/mock-auth';
import { TooltipProvider } from '@/components/ui/tooltip';
import { HtmlLangSync } from '@/components/html-lang-sync';
import { DevEnLangToggle } from './_components/lang-toggle';

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
      <MockAuthProvider>
        <HtmlLangSync lang="en" />
        <div translate="no" lang="en">
          {children}
          {/* Dev-only EN / 中 language toggle. Shipping dev console is
              English only — this exists purely so the developer can QA
              content in Chinese without mentally translating. */}
          <DevEnLangToggle />
        </div>
      </MockAuthProvider>
    </TooltipProvider>
  );
}
