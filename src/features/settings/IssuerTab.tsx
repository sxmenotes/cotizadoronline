import React, { useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { Button, Input, Textarea, Card, SectionHeader, toast } from '../../ui';
import { Plus, Trash2 } from 'lucide-react';

export const IssuerTab: React.FC = () => {
  const { issuer, updateIssuer } = useSettingsStore();

  const [name, setName] = useState(issuer.name);
  const [brandSubtitle, setBrandSubtitle] = useState(issuer.brandSubtitle);
  const [documentTag, setDocumentTag] = useState(issuer.documentTag);
  const [serviceTagline, setServiceTagline] = useState(issuer.serviceTagline);
  const [footerBrand, setFooterBrand] = useState(issuer.footerBrand);
  const [bankDetails, setBankDetails] = useState<string[]>([...issuer.bankDetails]);
  const [newBankLine, setNewBankLine] = useState('');

  React.useEffect(() => {
    setName(issuer.name);
    setBrandSubtitle(issuer.brandSubtitle);
    setDocumentTag(issuer.documentTag);
    setServiceTagline(issuer.serviceTagline);
    setFooterBrand(issuer.footerBrand);
    setBankDetails([...issuer.bankDetails]);
  }, [issuer]);

  const handleSave = async () => {
    await updateIssuer({
      ...issuer,
      name,
      brandSubtitle,
      documentTag,
      serviceTagline,
      footerBrand,
      bankDetails,
    });
    toast.success('Datos del emisor actualizados');
  };

  const handleAddBankLine = () => {
    if (!newBankLine.trim()) return;
    setBankDetails([...bankDetails, newBankLine.trim()]);
    setNewBankLine('');
  };

  const handleRemoveBankLine = (index: number) => {
    setBankDetails(bankDetails.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Identidad Institucional"
        title="Datos del Emisor & Marca"
        description="Información corporativa que aparece en las portadas, encabezados y pies de página de los PDF."
      />

      <Card className="p-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Input
            label="Nombre del Emisor"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Subtítulo de Marca (Portada)"
            value={brandSubtitle}
            onChange={(e) => setBrandSubtitle(e.target.value)}
          />
          <Input
            label="Etiqueta de Documento (Páginas 2 a N)"
            value={documentTag}
            onChange={(e) => setDocumentTag(e.target.value)}
          />
          <Input
            label="Pie de Página Institucional"
            value={footerBrand}
            onChange={(e) => setFooterBrand(e.target.value)}
          />
        </div>

        <div className="mt-6">
          <Textarea
            label="Descripción del Servicio (Portada)"
            rows={2}
            value={serviceTagline}
            onChange={(e) => setServiceTagline(e.target.value)}
          />
        </div>

        {/* Datos Bancarios / Transferencia */}
        <div className="mt-8 border-t border-hairline pt-6">
          <h4 className="font-serif text-base font-semibold text-navy-900 mb-2">
            Datos de Transferencia Bancaria
          </h4>
          <p className="text-xs text-ink-muted mb-4">
            Líneas informativas que aparecen en la sección de condiciones de pago de la cotización.
          </p>

          <div className="flex flex-col gap-2 mb-4">
            {bankDetails.map((line, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 rounded-md border border-hairline bg-paper p-3 text-sm"
              >
                <span>{line}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveBankLine(idx)}
                  className="text-danger hover:bg-red-50"
                  aria-label="Eliminar línea bancaria"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Ej: Banco Estado · Cuenta Corriente N° 12345678"
              value={newBankLine}
              onChange={(e) => setNewBankLine(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBankLine())}
            />
            <Button variant="secondary" onClick={handleAddBankLine}>
              <Plus className="h-4 w-4 mr-1" />
              <span>Agregar</span>
            </Button>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button variant="primary" onClick={handleSave}>
            Guardar Cambios de Emisor
          </Button>
        </div>
      </Card>
    </div>
  );
};
