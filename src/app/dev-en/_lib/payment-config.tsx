'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

interface PaymentConfig {
  paypalClientId: string;
  stripePublishableKey: string;
  loading: boolean;
}

const PaymentConfigCtx = createContext<PaymentConfig>({
  paypalClientId: '',
  stripePublishableKey: '',
  loading: true,
});

export function PaymentConfigProvider({ children }: { children: ReactNode }) {
  const [cfg, setCfg] = useState<PaymentConfig>({
    paypalClientId: '',
    stripePublishableKey: '',
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/config')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setCfg({
            paypalClientId: data.paypalClientId ?? '',
            stripePublishableKey: data.stripePublishableKey ?? '',
            loading: false,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setCfg((prev) => ({ ...prev, loading: false }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <PaymentConfigCtx value={cfg}>{children}</PaymentConfigCtx>;
}

export function usePaymentConfig() {
  return useContext(PaymentConfigCtx);
}
