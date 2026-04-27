'use client';

import { CreditCard, MoreHorizontal, Plus, Shield, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import {
  formatDate,
  listPaymentMethods,
  removePaymentMethod,
  setDefaultPaymentMethod,
  type PaymentMethod,
} from '../_lib/mock-store';
import { useMockStore } from '../_lib/use-mock-store';
import { useLang } from '../_lib/use-lang';

interface ManageSavedCardsModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Account-level "saved cards" management, deliberately kept separate from the
 * main Billing view. New cards are never added here — they're added *during*
 * a top-up in the checkout modal (with "Save this card for future top-ups"
 * ticked). This modal only exists to let users see what's saved, promote a
 * default, or remove one.
 */
export function ManageSavedCardsModal({ open, onClose }: ManageSavedCardsModalProps) {
  if (!open) return null;
  return <OpenedManageSavedCardsModal onClose={onClose} />;
}

function OpenedManageSavedCardsModal({ onClose }: { onClose: () => void }) {
  const { t, tx } = useLang();
  const cards = useMockStore(listPaymentMethods, [] as PaymentMethod[]);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<PaymentMethod | null>(null);

  const handleRemove = (pm: PaymentMethod) => {
    removePaymentMethod(pm.id);
    setConfirmRemove(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      translate="no"
      lang="en"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[480px] max-h-[85vh] overflow-y-auto rounded-2xl bg-background border border-border shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <div>
              <div className="text-sm font-semibold">{tx('Saved cards')}</div>
              <div className="text-[11px] text-muted-foreground">
                {tx('Auto-filled at checkout. Add new cards during a top-up.')}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label={tx('Close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {cards.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-5 py-10 text-center">
              <div className="h-10 w-10 mx-auto rounded-full bg-muted/60 flex items-center justify-center mb-3">
                <Plus className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mb-1">{tx('No saved cards yet')}</p>
              <p className="text-xs text-muted-foreground max-w-[320px] mx-auto">
                {tx('Cards get saved when you add credits to a key and tick')}{' '}
                <em>&ldquo;{tx('Save this card for future top-ups')}&rdquo;</em>{tx('. Start a top-up from the Billing or API Keys page.')}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
              {cards.map((pm) => (
                <li key={pm.id} className="flex items-center gap-3 px-4 py-3 relative">
                  <div className="h-8 w-12 rounded border border-border bg-muted flex items-center justify-center text-[10px] font-bold tracking-wider">
                    {pm.brand.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {pm.brand.toUpperCase()} •••• {pm.last4}
                      {pm.isDefault && (
                        <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-foreground text-background">
                          {tx('Default')}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {pm.name} · {tx('Expires')} {String(pm.expMonth).padStart(2, '0')}/
                      {String(pm.expYear).slice(-2)} · {t('Added', '添加于')} {formatDate(pm.createdAt)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMenuFor(menuFor === pm.id ? null : pm.id)}
                    className="h-8 w-8 rounded-md border border-border hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label={tx('More actions')}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                  {menuFor === pm.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuFor(null)}
                      />
                      <div className="absolute right-3 top-12 z-20 w-40 rounded-lg border border-border bg-popover shadow-xl py-1 text-sm">
                        {!pm.isDefault && (
                          <button
                            type="button"
                            onClick={() => {
                              setDefaultPaymentMethod(pm.id);
                              setMenuFor(null);
                            }}
                            className="w-full px-3 py-1.5 text-left hover:bg-muted/50"
                          >
                            {tx('Make default')}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setMenuFor(null);
                            setConfirmRemove(pm);
                          }}
                          className="w-full px-3 py-1.5 text-left text-destructive hover:bg-destructive/10 inline-flex items-center gap-2"
                        >
                          <Trash2 className="h-3 w-3" /> {tx('Remove')}
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}

          <p className="text-[11px] text-muted-foreground leading-relaxed flex items-start gap-1.5">
            <Shield className="h-3 w-3 mt-0.5 shrink-0" />
            {tx('Card data is tokenised by Stripe; we only store the last 4 digits and brand.')}
          </p>
        </div>
      </div>

      {confirmRemove && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="dialog"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setConfirmRemove(null)}
          />
          <div className="relative w-full max-w-[400px] rounded-xl bg-background border border-border shadow-2xl p-5">
            <h3 className="text-sm font-semibold">{tx('Remove this card?')}</h3>
            <p className="text-sm text-muted-foreground mt-2">
              {tx("We'll remove")}{' '}
              <strong>
                {confirmRemove.brand.toUpperCase()} •••• {confirmRemove.last4}
              </strong>{' '}
              {tx('from your saved cards. Future top-ups will need to re-enter card details.')}
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setConfirmRemove(null)}
                className="h-9 px-4 rounded-lg border border-border bg-background hover:bg-muted/50 text-sm font-medium"
              >
                {tx('Cancel')}
              </button>
              <button
                type="button"
                onClick={() => handleRemove(confirmRemove)}
                className="h-9 px-4 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:brightness-110"
              >
                {tx('Remove')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
