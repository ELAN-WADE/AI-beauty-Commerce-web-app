import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineStatusBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      clearTimeout(timer);
      timer = setTimeout(() => setShowReconnected(false), 3200);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearTimeout(timer);
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
          <span>Connection restored. You can retry pending actions.</span>
        </>
      ) : (
        <>
          <WifiOff size={13} className="text-[#D4AF37] shrink-0" />
          <span>
            You are offline. Saved information may be out of date; reconnect before checking out.
          </span>
        </>
      )}
    </div>
  );
};
