import React from 'react';
import { SectionHeader, Card } from '../../ui';
import { Layout } from 'lucide-react';

export const SkeletonEditorPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        eyebrow="Arquitectura Web"
        title="Esqueleto del Sitio"
        description="Maquetación estructural y referencial del sitio web con exportación A4."
      />
      <Card className="p-6">
        <div className="flex items-center gap-3 text-ink-muted">
          <Layout className="h-5 w-5 text-navy-600" />
          <p className="text-sm">Editor de Esqueleto en inicialización (Fase 8)</p>
        </div>
      </Card>
    </div>
  );
};

export default SkeletonEditorPage;
