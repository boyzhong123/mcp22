import type { ReactNode } from 'react';
import { MockAuthProvider } from '../dev-en/_lib/mock-auth';
import { TooltipProvider } from '@/components/ui/tooltip';
import { HtmlLangSync } from '@/components/html-lang-sync';
import { DevEnLangToggle } from '../dev-en/_components/lang-toggle';

export const metadata = {
  title: 'Chivox MCP · Developer (English preview)',
  description: 'Static preview of the English developer console for Chivox MCP.',
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delay={300}>
      <MockAuthProvider>
        <HtmlLangSync lang="en" />
        <div translate="no" lang="en">
          {children}
          <DevEnLangToggle />
        </div>
      </MockAuthProvider>
    </TooltipProvider>
  );
}

