import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './AppShell';

// Carga perezosa (lazy loading) por ruta
const HistoryPage = lazy(() => import('../features/history/HistoryPage'));
const QuoteEditorPage = lazy(() => import('../features/quotes/QuoteEditorPage'));
const SkeletonEditorPage = lazy(() => import('../features/skeleton/SkeletonEditorPage'));
const SettingsPage = lazy(() => import('../features/settings/SettingsPage'));
const NotFoundPage = lazy(() => import('./NotFoundPage'));

const PageFallback: React.FC = () => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-navy-700 border-t-transparent" />
      <span className="text-xs font-medium text-ink-muted">Cargando vista...</span>
    </div>
  </div>
);

interface AppRouterProps {
  onLogout?: (() => void) | undefined;
}

export const AppRouter: React.FC<AppRouterProps> = ({ onLogout }) => {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell onLogout={onLogout} />}>
          <Route index element={<Navigate to="/historial" replace />} />
          <Route
            path="/historial"
            element={
              <Suspense fallback={<PageFallback />}>
                <HistoryPage />
              </Suspense>
            }
          />
          <Route
            path="/presupuestos/nuevo"
            element={
              <Suspense fallback={<PageFallback />}>
                <QuoteEditorPage />
              </Suspense>
            }
          />
          <Route
            path="/presupuestos/:id"
            element={
              <Suspense fallback={<PageFallback />}>
                <QuoteEditorPage />
              </Suspense>
            }
          />
          <Route
            path="/esqueletos/nuevo"
            element={
              <Suspense fallback={<PageFallback />}>
                <SkeletonEditorPage />
              </Suspense>
            }
          />
          <Route
            path="/esqueletos/:id"
            element={
              <Suspense fallback={<PageFallback />}>
                <SkeletonEditorPage />
              </Suspense>
            }
          />
          <Route
            path="/ajustes"
            element={
              <Suspense fallback={<PageFallback />}>
                <SettingsPage />
              </Suspense>
            }
          />
          <Route
            path="/ajustes/:tab"
            element={
              <Suspense fallback={<PageFallback />}>
                <SettingsPage />
              </Suspense>
            }
          />
          <Route
            path="*"
            element={
              <Suspense fallback={<PageFallback />}>
                <NotFoundPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </HashRouter>
  );
};
