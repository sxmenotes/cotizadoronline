import React, { useEffect, useRef, useState, useCallback } from 'react';
import { pdf } from '@react-pdf/renderer';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { Quote } from '../domain/types';
import { QuoteDocument } from './QuoteDocument';
import { registerPdfFonts } from './fonts';
import { Button } from '../ui/Button';
import { RefreshCw, AlertCircle, Loader2 } from 'lucide-react';

// Configurar worker de pdfjs-dist una sola vez
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
registerPdfFonts();

export interface PdfPreviewProps {
  quote: Quote;
  className?: string;
  onBlobReady?: (blob: Blob) => void;
}

export const PdfPreview: React.FC<PdfPreviewProps> = ({ quote, className = '', onBlobReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pagesCanvas, setPagesCanvas] = useState<{ id: number; dataUrl: string; width: number; height: number }[]>([]);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [renderCount, setRenderCount] = useState<number>(0);

  const activeRenderId = useRef<number>(0);

  const generateAndRender = useCallback(async () => {
    const currentId = ++activeRenderId.current;
    setIsUpdating(true);
    setError(null);

    try {
      // 1. Generar blob vectorial con @react-pdf/renderer
      const doc = React.createElement(QuoteDocument, { quote }) as unknown as Parameters<typeof pdf>[0];
      const blob = await pdf(doc).toBlob();

      // Si otro render inició mientras generábamos este blob, cancelar
      if (currentId !== activeRenderId.current) return;

      if (onBlobReady) {
        onBlobReady(blob);
      }

      // 2. Cargar en pdfjs-dist
      const arrayBuffer = await blob.arrayBuffer();
      if (currentId !== activeRenderId.current) return;

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;

      if (currentId !== activeRenderId.current) return;

      const containerWidth = containerRef.current?.clientWidth || 700;
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const pagesData: { id: number; dataUrl: string; width: number; height: number }[] = [];

      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        if (currentId !== activeRenderId.current) return;

        const page = await pdfDoc.getPage(pageNum);
        const unscaledViewport = page.getViewport({ scale: 1 });
        // Escalar al ancho del contenedor (restando padding)
        const targetWidth = Math.max(containerWidth - 32, 280);
        const scale = targetWidth / unscaledViewport.width;
        const viewport = page.getViewport({ scale: scale * dpr });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) continue;

        const renderContext = {
          canvasContext: ctx,
          viewport,
        };

        await page.render(renderContext).promise;

        if (currentId !== activeRenderId.current) return;

        pagesData.push({
          id: pageNum,
          dataUrl: canvas.toDataURL('image/png'),
          width: targetWidth,
          height: unscaledViewport.height * scale,
        });
      }

      if (currentId === activeRenderId.current) {
        setPagesCanvas(pagesData);
        setIsUpdating(false);
      }
    } catch (err: unknown) {
      if (currentId === activeRenderId.current) {
        setError(err instanceof Error ? err.message : 'Error desconocido al procesar el PDF');
        setIsUpdating(false);
      }
    }
  }, [quote, onBlobReady]);

  // Debounce de 500ms al cambiar la cotización
  useEffect(() => {
    const timer = setTimeout(() => {
      void generateAndRender();
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [generateAndRender, renderCount]);

  return (
    <div className={`relative flex flex-col items-center w-full ${className}`}>
      {/* Indicador de actualización flotante */}
      {isUpdating && (
        <div className="sticky top-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-navy-900/90 text-white text-xs font-medium shadow-md backdrop-blur transition-opacity">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-brass" />
          <span>Actualizando vista previa…</span>
        </div>
      )}

      {/* Mensaje de error con reintento */}
      {error && (
        <div className="p-4 my-4 rounded-lg bg-danger/10 border border-danger/20 text-danger flex flex-col items-center gap-2 text-center max-w-md">
          <AlertCircle className="w-6 h-6" />
          <p className="text-sm font-medium">No se pudo generar la vista previa del documento.</p>
          <p className="text-xs opacity-80">{error}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setRenderCount((c) => c + 1)}
            className="mt-2"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Reintentar
          </Button>
        </div>
      )}

      {/* Contenedor de páginas renderizadas */}
      <div
        ref={containerRef}
        className="w-full flex flex-col items-center gap-6 py-4"
        style={{ minHeight: '500px' }}
      >
        {pagesCanvas.length > 0
          ? pagesCanvas.map((page) => (
              <div
                key={page.id}
                className="bg-white shadow-md border border-hairline rounded overflow-hidden transition-all duration-200"
                style={{ width: `${page.width}px`, height: `${page.height}px` }}
              >
                <img
                  src={page.dataUrl}
                  alt={`Página ${page.id}`}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  loading="lazy"
                />
              </div>
            ))
          : !error && (
              <div className="flex flex-col items-center justify-center h-80 text-ink-muted">
                <Loader2 className="w-8 h-8 animate-spin text-navy-600 mb-2" />
                <p className="text-sm">Generando documento...</p>
              </div>
            )}
      </div>
    </div>
  );
};

export default PdfPreview;
