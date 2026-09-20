import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  FileText,
  Calculator,
  Layout,
  Sliders,
  LogOut,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Toaster } from '../ui';

interface AppShellProps {
  onLogout?: (() => void) | undefined;
}

export const AppShell: React.FC<AppShellProps> = ({ onLogout }) => {
  const navItems = [
    { to: '/historial', label: 'Historial', icon: FileText },
    { to: '/presupuestos/nuevo', label: 'Presupuestos', icon: Calculator },
    { to: '/esqueletos/nuevo', label: 'Esqueleto', icon: Layout },
    { to: '/ajustes', label: 'Ajustes', icon: Sliders },
  ];

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper text-ink selection:bg-navy-100 selection:text-navy-900">
      <Toaster />

      {/* Barra superior institucional (Escritorio & Tablet) */}
      <header className="sticky top-0 z-40 border-b border-hairline bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Marca / Logotipo */}
          <NavLink
            to="/historial"
            className="flex items-center gap-3 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded-md"
          >
            <img
              src="/brand/isologo_black.png"
              alt="SV Logo"
              className="h-8 w-auto object-contain"
            />
            <div className="flex flex-col text-left">
              <span className="font-serif text-base font-semibold tracking-wide text-navy-900 leading-tight">
                SAMUEL VALENZUELA
              </span>
              <span className="text-[10px] font-semibold tracking-widest text-ink-muted uppercase">
                Propuestas & Maquetas Web
              </span>
            </div>
          </NavLink>

          {/* Navegación Desktop */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Navegación principal">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors select-none min-h-[44px]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500',
                      isActive
                        ? 'bg-navy-50 text-navy-700 font-semibold'
                        : 'text-ink-muted hover:bg-paper-2 hover:text-ink'
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            {/* Separador */}
            <div className="mx-2 h-6 w-[1px] bg-hairline" />

            {/* Botón Salir */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-red-50 hover:text-danger select-none min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span>Cerrar sesión</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Navegación inferior fija para dispositivos móviles (< 640px) */}
      <nav
        className="fixed bottom-0 left-0 z-40 flex w-full items-center justify-around border-t border-hairline bg-white/95 px-2 py-1 backdrop-blur-md md:hidden"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 6px)' }}
        aria-label="Navegación móvil"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors select-none min-h-[44px] min-w-[44px]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500',
                  isActive
                    ? 'text-navy-700 font-semibold'
                    : 'text-ink-muted hover:text-ink'
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[10px]">{item.label}</span>
            </NavLink>
          );
        })}

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="flex flex-col items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ink-muted transition-colors hover:text-danger select-none min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="text-[10px]">Salir</span>
          </button>
        )}
      </nav>
    </div>
  );
};

export default AppShell;
