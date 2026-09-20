import React, { useState, useEffect } from 'react';
import {
  verifyPassword,
  checkAuthStatus,
  saveAuthSession,
  clearAuthSession,
} from '../domain/auth';
import { Button, Input, Card } from '../ui';
import { Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react';

interface AuthGateProps {
  children: (onLogout: () => void) => React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember7Days, setRemember7Days] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Anti-fuerza bruta
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  useEffect(() => {
    // Comprobar si ya está autenticado al montar
    const authed = checkAuthStatus();
    if (authed) {
      setIsAuthenticated(true);
    }
  }, []);

  // Manejar cuenta regresiva de bloqueo
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  const calculateLockoutSeconds = (attempts: number) => {
    // Tras 5 intentos: 2s, 4s, 8s, 16s... hasta 60s
    if (attempts < 5) return 0;
    const exponent = attempts - 5;
    return Math.min(60, Math.pow(2, exponent + 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || lockoutTimer > 0 || isLoading) return;

    setIsLoading(true);
    setError(null);

    const isValid = await verifyPassword(password);
    setIsLoading(false);

    if (isValid) {
      saveAuthSession(remember7Days);
      setFailedAttempts(0);
      setIsAuthenticated(true);
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      const lockoutSecs = calculateLockoutSeconds(newAttempts);

      if (lockoutSecs > 0) {
        setLockoutTimer(lockoutSecs);
        setError(
          `Contraseña incorrecta. Demasiados intentos fallidos. Espera ${lockoutSecs} segundos para reintentar.`
        );
      } else {
        setError('Contraseña incorrecta. Verifica e intenta nuevamente.');
      }
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    setIsAuthenticated(false);
    setPassword('');
  };

  if (isAuthenticated) {
    return <>{children(handleLogout)}</>;
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-paper p-4 text-ink">
      <Card className="w-full max-w-sm p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <img
            src="/brand/isologo_black.png"
            alt="Samuel Valenzuela"
            className="h-12 w-auto object-contain"
          />
          <h1 className="mt-4 font-serif text-2xl font-semibold text-navy-900">
            Acceso Privado
          </h1>
          <p className="mt-1 text-xs tracking-widest text-ink-muted uppercase">
            Plataforma Samuel Valenzuela
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || lockoutTimer > 0}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[32px] text-ink-muted hover:text-ink focus-visible:outline-none"
              tabIndex={-1}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remember7Days"
              checked={remember7Days}
              onChange={(e) => setRemember7Days(e.target.checked)}
              className="h-4 w-4 rounded border-hairline text-navy-700 focus:ring-navy-500 cursor-pointer"
            />
            <label
              htmlFor="remember7Days"
              className="text-xs text-ink-muted cursor-pointer select-none"
            >
              Mantener sesión 7 días
            </label>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-xs text-danger">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {lockoutTimer > 0 && (
            <p className="text-center font-mono text-xs text-warning">
              Desbloqueo en {lockoutTimer}s
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={!password || lockoutTimer > 0}
            className="w-full mt-2"
          >
            <Lock className="mr-2 h-4 w-4" />
            <span>Entrar</span>
          </Button>
        </form>
      </Card>
    </div>
  );
};
