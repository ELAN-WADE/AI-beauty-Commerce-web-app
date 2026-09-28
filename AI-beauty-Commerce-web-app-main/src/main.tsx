import React from 'react';
import ReactDOM from 'react-dom/client';
import { ViewportProvider } from './context/ViewportContext';
import { AppProvider } from './context/AppContext';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ViewportProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </ViewportProvider>
  </React.StrictMode>
);
