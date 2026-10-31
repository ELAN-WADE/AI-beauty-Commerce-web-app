'use client';

import React, { useEffect } from 'react';
import { ViewportProvider } from '../context/ViewportContext';
import { AppProvider } from '../context/AppContext';
import { App } from '../App';
import { initErrorReporting } from '../lib/observe';
import type { ScreenId, Product } from '../types';

export default function ClientApp({ initialScreen, initialProduct }: { initialScreen?: ScreenId; initialProduct?: Product }) {
  useEffect(() => {
    initErrorReporting();
  }, []);

  return (
    <ViewportProvider>
      <AppProvider initialScreen={initialScreen} initialProduct={initialProduct}>
        <App privateAdminEntry={initialScreen === 'admin-console'} />
      </AppProvider>
    </ViewportProvider>
  );
}
