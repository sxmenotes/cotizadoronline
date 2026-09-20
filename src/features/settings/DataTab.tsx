import React, { useState, useRef } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { useQuotesStore } from '../../store/quotesStore';
import { useSkeletonStore } from '../../store/skeletonStore';
import {
  Button,
  Card,
  SectionHeader,
  ConfirmDialog,
  toast,
} from '../../ui';
import {
  exportBackupFile,
  parseAndValidateBackup,
  mergeItemsById,
  type FullBackupData,
} from '../../domain/backup';
import { Download, Upload, RotateCcw } from 'lucide-react';

export const DataTab: React.FC = () => {
  const { catalog, terms, issuer, defaultExchangeRate, defaultExchangeNote, updateCatalog, updateTerms, updateIssuer, setExchangeRate, resetToSeeds } = useSettingsStore();
  const { quotes, saveQuote } = useQuotesStore();
  const { skeletons, saveCurrent, setCurrent } = useSkeletonStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedData, setImportedData] = useState<FullBackupData | null>(null);
  const [resetSection, setResetSection] = useState<'catalog' | 'terms' | 'issuer' | 'all' | null>(null);

  // Recopilar respaldo actual
  const buildCurrentBackup = (): FullBackupData => {
    return {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      quotes,
      skeletons,
      settings: {
        catalog,
        terms,
        issuer,
        defaultExchangeRate,
        defaultExchangeNote,
      },
    };
  };

  const handleExportBackup = () => {
    const data = buildCurrentBackup();
    exportBackupFile(data);
    localStorage.setItem('sv_last_backup_date', new Date().toISOString());
    toast.success('Respaldo descargado con éxito');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const validated = parseAndValidateBackup(text);
        setImportedData(validated);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error desconocido al validar archivo';
        toast.error(msg);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 1. Restaurar: Reemplazar todo
  const handleConfirmReplace = async () => {
    if (!importedData) return;

    // Descarga de seguridad previa obligatoria
    toast.info('Generando copia de seguridad automática previa al reemplazo...');
    handleExportBackup();

    // Reemplazar ajustes
    await updateCatalog(importedData.settings.catalog);
    await updateTerms(importedData.settings.terms);
    await updateIssuer(importedData.settings.issuer);
    await setExchangeRate(
      importedData.settings.defaultExchangeRate,
      importedData.settings.defaultExchangeNote
    );

    // Reemplazar presupuestos
    for (const q of importedData.quotes) {
      await saveQuote(q);
    }

    // Reemplazar esqueletos
    if (importedData.skeletons.length > 0) {
      const first = importedData.skeletons[0];
      if (first) {
        setCurrent(first);
        await saveCurrent();
      }
    }

    setImportedData(null);
    toast.success('Base de datos restaurada completamente');
  };

  // 2. Restaurar: Combinar
  const handleConfirmMerge = async () => {
    if (!importedData) return;

    // Combinar presupuestos por ID
    const mergedQuotes = mergeItemsById(quotes, importedData.quotes);
    for (const q of mergedQuotes) {
      await saveQuote(q);
    }

    // Combinar esqueletos por ID
    const mergedSkeletons = mergeItemsById(skeletons, importedData.skeletons);
    if (mergedSkeletons.length > 0) {
      const first = mergedSkeletons[0];
      if (first) {
        setCurrent(first);
        await saveCurrent();
      }
    }

    setImportedData(null);
    toast.success('Datos combinados exitosamente');
  };

  const handleResetSeeds = async () => {
    if (!resetSection) return;
    await resetToSeeds(resetSection);
    setResetSection(null);
    toast.success('Valores originales restablecidos');
  };

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Base de Datos & Seguridad"
        title="Respaldo y Restauración"
        description="Esta plataforma almacena toda la información localmente en tu navegador. Realiza respaldos periódicos en formato JSON para no perder tus cotizaciones."
      />

      {/* 1. Respaldo y Restauración */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card className="flex flex-col justify-between p-6">
          <div>
            <div className="flex items-center gap-3 text-navy-900 mb-2">
              <Download className="h-5 w-5 text-navy-600" />
              <h3 className="font-serif text-lg font-semibold">Descargar Respaldo</h3>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              Exporta un archivo JSON completo que incluye todos los presupuestos guardados,
              los esqueletos de diseño web y la configuración vigente de catálogo y textos.
            </p>
          </div>

          <div className="mt-6">
            <Button variant="primary" onClick={handleExportBackup} className="w-full sm:w-auto">
              Exportar Respaldo (.json)
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-6">
          <div>
            <div className="flex items-center gap-3 text-navy-900 mb-2">
              <Upload className="h-5 w-5 text-navy-600" />
              <h3 className="font-serif text-lg font-semibold">Restaurar Respaldo</h3>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              Carga un archivo de respaldo previo para sincronizar tus cotizaciones en este u otro
              dispositivo. Puedes elegir entre reemplazar todo o combinar por fecha.
            </p>
          </div>

          <div className="mt-6">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto"
            >
              Cargar Archivo JSON
            </Button>
          </div>
        </Card>
      </div>

      {/* 2. Restablecer valores de fábrica */}
      <section className="flex flex-col gap-4 border-t border-hairline pt-6">
        <SectionHeader
          eyebrow="Valores Iniciales"
          title="Restablecer a Valores Originales"
          description="Restaura los catálogos o las cláusulas a los valores sembrados originalmente desde el proyecto legacy."
        />

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setResetSection('catalog')}>
            <RotateCcw className="mr-1.5 h-4 w-4 text-ink-muted" />
            <span>Restablecer Catálogo</span>
          </Button>

          <Button variant="secondary" onClick={() => setResetSection('terms')}>
            <RotateCcw className="mr-1.5 h-4 w-4 text-ink-muted" />
            <span>Restablecer Condiciones</span>
          </Button>

          <Button variant="secondary" onClick={() => setResetSection('issuer')}>
            <RotateCcw className="mr-1.5 h-4 w-4 text-ink-muted" />
            <span>Restablecer Emisor</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => setResetSection('all')}
            className="text-danger hover:bg-red-50"
          >
            <span>Restablecer Todo a Fábrica</span>
          </Button>
        </div>
      </section>

      {/* Diálogo de Restauración (Reemplazar vs Combinar) */}
      {importedData && (
        <ConfirmDialog
          open={Boolean(importedData)}
          onOpenChange={(open) => !open && setImportedData(null)}
          title="Archivo de Respaldo Válido"
          description={`Se detectaron ${importedData.quotes.length} presupuestos y ${importedData.skeletons.length} maquetas. Selecciona cómo deseas aplicar estos datos:`}
          confirmLabel="Reemplazar Todo"
          variant="danger"
          onConfirm={handleConfirmReplace}
        >
          <div className="flex flex-col gap-3 py-3 text-xs text-ink-muted">
            <div className="rounded-md bg-paper p-3 border border-hairline space-y-1">
              <p>• <strong>Fecha de exportación:</strong> {new Date(importedData.exportedAt).toLocaleString('es-CL')}</p>
              <p>• <strong>Presupuestos incluidos:</strong> {importedData.quotes.length}</p>
              <p>• <strong>Esqueletos incluidos:</strong> {importedData.skeletons.length}</p>
            </div>
            <p>
              💡 <em>Nota: Si eliges "Reemplazar Todo", se descargará automáticamente un respaldo de seguridad previo para garantizar que no pierdas nada.</em>
            </p>
            <div className="pt-2 flex justify-end">
              <Button variant="secondary" size="sm" onClick={handleConfirmMerge}>
                Combinar (conservar los más recientes)
              </Button>
            </div>
          </div>
        </ConfirmDialog>
      )}

      {/* Diálogo de Confirmación para Restablecer a Fábrica */}
      <ConfirmDialog
        open={Boolean(resetSection)}
        onOpenChange={(open) => !open && setResetSection(null)}
        title="¿Restablecer sección a valores iniciales?"
        description="Esta acción reemplazará los datos vigentes de la sección seleccionada por las semillas originales. Los presupuestos ya guardados en el historial no se verán alterados."
        confirmLabel="Restablecer"
        variant="danger"
        onConfirm={handleResetSeeds}
      />
    </div>
  );
};
