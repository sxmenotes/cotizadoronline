import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import '../styles/global.css';

// Shim para @react-pdf/renderer en navegador (evita advertencia de Buffer.isBuffer)
if (typeof window !== 'undefined' && !('Buffer' in window)) {
  (window as unknown as { Buffer: { isBuffer: (v: unknown) => boolean } }).Buffer = {
    isBuffer: (val: unknown): boolean =>
      Boolean(val && typeof val === 'object' && (val as { _isBuffer?: boolean })._isBuffer),
  };
}

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Elemento root no encontrado en el DOM');
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
