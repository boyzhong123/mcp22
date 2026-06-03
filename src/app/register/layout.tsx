import type { ReactNode } from 'react';
import { AuthProvider } from '../dev-en/_lib/auth-context';
import { TooltipProvider } from '@/components/ui/tooltip';
import { HtmlLangSync } from '@/components/html-lang-sync';
import { DevEnLangToggle } from '../dev-en/_components/lang-toggle';
import { DevEnContactWidget } from '../dev-en/_components/contact-widget';

export const metadata = {
  title: 'Chivox MCP · Create your account',
  description: 'Sign up for Chivox MCP — speech-grade evaluation tools for any LLM.',
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delay={300}>
      <AuthProvider>
        <HtmlLangSync lang="en" />
        <div translate="no" lang="en">
          {children}
          <DevEnContactWidget />
          <DevEnLangToggle />
        </div>
      </AuthProvider>
    </TooltipProvider>
  );
}
