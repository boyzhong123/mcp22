'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ActionToastMessage = {
  id: number;
  title: string;
  description?: string;
};

const ACTION_TOAST_EVENT = 'dev-en:action-toast';

export function showActionToast(message: Omit<ActionToastMessage, 'id'>) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ActionToastMessage>(ACTION_TOAST_EVENT, {
    detail: { ...message, id: Date.now() },
  }));
}

export function ActionToastHost() {
  const [message, setMessage] = useState<ActionToastMessage | null>(null);

  useEffect(() => {
    const show = (event: Event) => {
      setMessage((event as CustomEvent<ActionToastMessage>).detail);
    };
    window.addEventListener(ACTION_TOAST_EVENT, show);
    return () => window.removeEventListener(ACTION_TOAST_EVENT, show);
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 3600);
    return () => window.clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[200] w-[min(360px,calc(100vw-2rem))] rounded-xl border border-border/80 bg-background p-4 shadow-xl"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{message.title}</div>
          {message.description ? (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {message.description}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="-mr-1 -mt-1 shrink-0 rounded-full text-muted-foreground"
          aria-label="Close notification"
          onClick={() => setMessage(null)}
        >
          <X />
        </Button>
      </div>
    </div>
  );
}
