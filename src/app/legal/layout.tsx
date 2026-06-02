import type { ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { HtmlLangSync } from '@/components/html-lang-sync';
import { DevEnLangToggle } from '../dev-en/_components/lang-toggle';

export const metadata = {
  title: 'Chivox MCP · Legal',
  description: 'Terms of Service and Privacy Policy for Chivox MCP.',
};

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delay={300}>
      <HtmlLangSync lang="en" />
      <div translate="no" lang="en">
        {children}
        <DevEnLangToggle />
      </div>
    </TooltipProvider>
  );
}
