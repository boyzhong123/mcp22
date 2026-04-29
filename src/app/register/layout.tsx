import type { ReactNode } from 'react';
import { AuthProvider } from '../dev-en/_lib/auth-context';
import { TooltipProvider } from '@/components/ui/tooltip';
import { HtmlLangSync } from '@/components/html-lang-sync';
import { DevEnLangToggle } from '../dev-en/_components/lang-toggle';

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
          <DevEnLangToggle />
        </div>
      </AuthProvider>
    </TooltipProvider>
  );
}
