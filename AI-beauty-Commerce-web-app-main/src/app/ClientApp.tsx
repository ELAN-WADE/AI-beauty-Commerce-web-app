'use client';

import type { StorefrontSeed } from '../../backend/src/lib/server-storefront';
import React, { useEffect } from 'react';
import { ViewportProvider } from '../context/ViewportContext';
import { AppProvider } from '../context/AppContext';
import { App } from '../App';
import { initErrorReporting } from '../lib/observe';
import type { ScreenId, Product } from '../types';

export default function ClientApp({ initialScreen, initialProduct, initialCatalogue, initialEditorial }: { initialScreen?: ScreenId; initialProduct?: Product; initialCatalogue?: Product[]; initialEditorial?: StorefrontSeed }) {
  useEffect(() => {
    initErrorReporting();
  }, []);

  return (
    <ViewportProvider>
      <AppProvider initialScreen={initialScreen} initialProduct={initialProduct} initialCatalogue={initialCatalogue} initialEditorial={initialEditorial}>
        <App privateAdminEntry={initialScreen === 'admin-console'} />
      </AppProvider>
    </ViewportProvider>
  );
}
