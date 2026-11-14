'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { WifiHigh, WifiSlash } from '@phosphor-icons/react';

type ConnectivityState = 'online' | 'offline' | 'reconnected';

export const OfflineStatusBanner: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const [status, setStatus] = useState<ConnectivityState>('online');
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!navigator.onLine) {
      wasOfflineRef.current = true;
      setStatus('offline');
    }

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const handleOffline = () => {
      clearReconnectTimer();
      wasOfflineRef.current = true;
      setStatus((prev) => (prev === 'offline' ? prev : 'offline'));
    };

    const handleOnline = () => {
      if (!wasOfflineRef.current) return;
      wasOfflineRef.current = false;
      clearReconnectTimer();
      setStatus('reconnected');
      reconnectTimerRef.current = setTimeout(() => {
        setStatus((prev) => (prev === 'reconnected' ? 'online' : prev));
        reconnectTimerRef.current = null;
      }, 3200);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      clearReconnectTimer();
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const visible = status === 'offline' || status === 'reconnected';
  const isOffline = status === 'offline';

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          key={status}
          role="status"
          aria-live={isOffline ? 'assertive' : 'polite'}
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: prefersReducedMotion ? 0.12 : 0.22, ease: [0.23, 1, 0.32, 1] }}
          className="fixed left-1/2 -translate-x-1/2 lg:left-auto lg:right-6 lg:translate-x-0 z-[75] bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] lg:bottom-6 pointer-events-auto"
        >
          <div className="flex items-center gap-2.5 rounded-full bg-[#0F0F10] text-white px-4 py-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.28)] max-w-[calc(100vw-2rem)]">
            {isOffline ? (
              <WifiSlash size={15} weight="fill" className="text-[#D4AF37] shrink-0" aria-hidden="true" />
            ) : (
              <WifiHigh size={15} weight="fill" className="text-emerald-400 shrink-0" aria-hidden="true" />
            )}
            <span className="text-xs font-medium tracking-[0.01em] whitespace-nowrap truncate">
              {isOffline
                ? 'Offline — browsing cached catalog'
                : 'Back online — synced'}
            </span>
            <button
              type="button"
              onClick={() => setStatus('online')}
              aria-label="Dismiss connectivity status"
              className="ml-1 text-[11px] font-medium text-white/60 hover:text-white transition-colors shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
