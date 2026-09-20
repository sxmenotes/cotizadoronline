import React from 'react';
import { SectionHeader, Card } from '../../ui';
import { Calculator } from 'lucide-react';

export const QuoteEditorPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        eyebrow="Propuesta Comercial"
        title="Editor de Presupuesto"
        description="Generación paramétrica con cálculo de abonos e inversión en tiempo real."
      />
      <Card className="p-6">
        <div className="flex items-center gap-3 text-ink-muted">
          <Calculator className="h-5 w-5 text-navy-600" />
          <p className="text-sm">Editor de Presupuesto en inicialización (Fases 3, 6 y 7)</p>
        </div>
      </Card>
    </div>
  );
};

export default QuoteEditorPage;
