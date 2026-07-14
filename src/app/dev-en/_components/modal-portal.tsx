'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders modal markup into `document.body`.
 *
 * Dashboard pages animate in via `.dev-page-enter`; any ancestor with a
 * transform becomes the containing block for `position: fixed`, so a modal
 * rendered in place gets its inset-0 scrim clipped to the content column
 * (the sidebar stays undimmed and the card drifts off-center). Portaling to
 * <body> keeps overlays truly full-viewport no matter where the modal is
 * mounted.
 */
export function ModalPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
