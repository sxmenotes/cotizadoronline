import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <span className="font-mono text-5xl font-bold text-navy-600">404</span>
      <h1 className="mt-3 font-serif text-2xl font-semibold text-navy-900">
        Página no encontrada
      </h1>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        La ruta a la que intentas acceder no existe o fue movida.
      </p>
      <Link to="/historial" className="mt-6">
        <Button variant="primary" className="gap-2">
          <Home className="h-4 w-4" />
          <span>Volver al Historial</span>
        </Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;
