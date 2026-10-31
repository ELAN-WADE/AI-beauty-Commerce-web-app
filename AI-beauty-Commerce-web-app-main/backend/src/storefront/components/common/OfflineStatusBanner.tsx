import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineStatusBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3200);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full py-1.5 px-4 text-xs font-medium flex items-center justify-center gap-2 transition-all duration-300 z-50 select-none shadow-xs ${
        isOnline
          ? 'bg-[#0F4A38] text-white border-b border-emerald-400/30'
          : 'bg-[#0F0F10] text-[#D4AF37] border-b border-[#D4AF37]/40'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi size={13} className="text-emerald-300 shrink-0" />
          <span>Connection restored • Live inventory and telemetry synchronized</span>
        </>
      ) : (
        <>
          <WifiOff size={13} className="text-[#D4AF37] shrink-0" />
          <span>
            Offline Mode • Viewing cached formulations and orders. Changes will sync when reconnected.
          </span>
        </>
      )}
    </div>
  );
};
