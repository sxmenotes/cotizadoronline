import React from 'react';
import { SectionHeader, Card } from '../../ui';
import { Sliders } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        eyebrow="Configuración"
        title="Ajustes de la Plataforma"
        description="Gestión de catálogo de precios, cláusulas, emisor y respaldo de base de datos."
      />
      <Card className="p-6">
        <div className="flex items-center gap-3 text-ink-muted">
          <Sliders className="h-5 w-5 text-navy-600" />
          <p className="text-sm">Panel de Ajustes en inicialización (Fase 5)</p>
        </div>
      </Card>
    </div>
  );
};

export default SettingsPage;
