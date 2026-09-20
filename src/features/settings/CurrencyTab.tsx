import React, { useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { Button, Input, Textarea, Card, SectionHeader, toast } from '../../ui';

export const CurrencyTab: React.FC = () => {
  const { defaultExchangeRate, defaultExchangeNote, setExchangeRate } = useSettingsStore();

  const [rate, setRate] = useState<number>(defaultExchangeRate);
  const [note, setNote] = useState<string>(defaultExchangeNote);

  const handleSave = async () => {
    if (!rate || rate <= 0) {
      toast.error('El tipo de cambio debe ser un número positivo');
      return;
    }
    await setExchangeRate(rate, note);
    toast.success('Configuración de moneda guardada');
  };

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Divisas & Conversión"
        title="Tipo de Cambio (USD)"
        description="Parámetros de conversión para cotizaciones internacionales o presupuestos expresados en dólares estadounidenses."
      />

      <Card className="p-6 max-w-xl">
        <div className="flex flex-col gap-4">
          <Input
            label="Tipo de Cambio por Defecto (CLP por 1 USD)"
            type="number"
            min={1}
            step={0.5}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            helperText="Este valor se utilizará como sugerencia inicial al seleccionar USD en un presupuesto."
          />

          <Textarea
            label="Nota de Referencia (Pie del PDF en USD)"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            helperText="Aparece en el resumen de inversión para justificar la tasa utilizada al cliente."
          />

          <div className="mt-4 flex justify-end">
            <Button variant="primary" onClick={handleSave}>
              Guardar Tipo de Cambio
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
