import React from 'react';

export const App: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper p-6 text-ink">
      <div className="w-full max-w-md rounded-lg border border-hairline bg-white p-8 text-center shadow-xs">
        <img
          src="/brand/isologo_black.png"
          alt="Samuel Valenzuela"
          className="mx-auto mb-4 h-12 w-auto"
        />
        <h1 className="font-serif text-2xl font-semibold text-navy-900">
          Samuel Valenzuela
        </h1>
        <p className="mt-1 text-xs tracking-widest text-ink-muted uppercase">
          Creador de Presupuestos & Esqueleto Web
        </p>
      </div>
    </div>
  );
};
