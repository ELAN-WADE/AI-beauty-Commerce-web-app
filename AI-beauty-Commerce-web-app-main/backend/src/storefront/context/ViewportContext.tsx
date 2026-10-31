import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';

export type ViewportMode = 'auto' | 'mobile' | 'desktop';

interface ViewportContextType {
  viewportMode: ViewportMode;
  isDesktop: boolean;
  setViewportMode: (mode: ViewportMode) => void;
  toggleViewportMode: () => void;
}

const ViewportContext = createContext<ViewportContextType | undefined>(undefined);

export const ViewportProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [viewportMode, setViewportMode] = useState<ViewportMode>('auto');
  const [isWindowDesktop, setIsWindowDesktop] = useState(true);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setIsWindowDesktop(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const isDesktop = viewportMode === 'auto' ? isWindowDesktop : viewportMode === 'desktop';

  const toggleViewportMode = useCallback(() => {
    setViewportMode((prev) => (prev === 'desktop' ? 'mobile' : 'desktop'));
  }, []);
  const value = useMemo(() => ({ viewportMode, isDesktop, setViewportMode, toggleViewportMode }), [viewportMode, isDesktop, toggleViewportMode]);

  return (
    <ViewportContext.Provider
      value={value}
    >
      {children}
    </ViewportContext.Provider>
  );
};

export const useViewport = () => {
  const context = useContext(ViewportContext);
  if (!context) {
    throw new Error('useViewport must be used within a ViewportProvider');
  }
  return context;
};
