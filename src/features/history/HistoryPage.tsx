import React from 'react';
import { SectionHeader, Card } from '../../ui';
import { FileText } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        eyebrow="Propuestas & Diseños"
        title="Historial de Documentos"
        description="Consulta, duplica y administra presupuestos y maquetas creadas."
      />
      <Card className="p-6">
        <div className="flex items-center gap-3 text-ink-muted">
          <FileText className="h-5 w-5 text-navy-600" />
          <p className="text-sm">Módulo de Historial en inicialización (Fase 7)</p>
        </div>
      </Card>
    </div>
  );
};

export default HistoryPage;
