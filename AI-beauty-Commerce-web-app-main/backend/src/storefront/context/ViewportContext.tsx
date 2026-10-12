import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
    const handleResize = () => {
      setIsWindowDesktop(window.innerWidth >= 1024);
    };
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDesktop = viewportMode === 'auto' ? isWindowDesktop : viewportMode === 'desktop';

  const toggleViewportMode = () => {
    setViewportMode((prev) => (prev === 'desktop' ? 'mobile' : 'desktop'));
  };

  return (
    <ViewportContext.Provider
      value={{
        viewportMode,
        isDesktop,
        setViewportMode,
        toggleViewportMode
      }}
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
