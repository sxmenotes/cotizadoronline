import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Download,
  Copy,
  Trash2,
  ArrowLeft,
  Undo2,
  Redo2,
  Monitor,
  Smartphone,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  ArrowUp,
  ArrowDown,
  GripVertical,
  HelpCircle,
  AlertTriangle,
  Upload,
  FileJson,
  Check,
  ChevronRight,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import {
  Button,
  Card,
  Input,
  Select,
  Switch,
  SegmentedControl,
  Badge,
  ConfirmDialog,
  toast,
} from '../../ui';
import { useSkeletonStore } from '../../store/skeletonStore';
import { useQuotesStore } from '../../store/quotesStore';
import type { SkeletonDesign, SkeletonSection, SectionType, SkeletonPage } from '../../domain/types';
import { SkeletonDesignSchema } from '../../domain/schemas';
import {
  PALETTE_PRESETS,
  FONT_PAIR_PRESETS,
  CURATED_FONTS,
  calculateContrastRatio,
  getWcagEvaluation,
  getInitialStructure,
} from './wireframe/presets';
import { BLOCK_METAS, getWireframeBlockTree, getGlobalNavbarTree, getGlobalFooterTree } from './wireframe/blocks';
import { DomWireframeRenderer } from './wireframe/renderers/dom';
import { SkeletonDocument } from './wireframe/SkeletonDocument';
import { pdf } from '@react-pdf/renderer';
import { sanitizeFilename, downloadBlob } from '../../lib/utils';
import { registerDynamicFont } from '../../pdf/fonts';

// Elemento individual ordenable con @dnd-kit
interface SortableSectionItemProps {
  section: SkeletonSection;
  index: number;
  total: number;
  isSelected: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const SortableSectionItem: React.FC<SortableSectionItemProps> = ({
  section,
  index,
  total,
  isSelected,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const meta = BLOCK_METAS[section.type] || BLOCK_METAS.hero;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between p-2.5 rounded-lg border transition-all ${
        isSelected
          ? 'bg-navy-50/80 border-navy-500 shadow-xs'
          : 'bg-white border-hairline hover:border-navy-300'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Handle de arrastre */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-ink-subtle hover:text-navy-900 rounded"
          title="Arrastrar para reordenar"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Información y selección */}
        <button
          type="button"
          onClick={onSelect}
          className="flex flex-col text-left min-w-0 flex-1 focus:outline-none"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-navy-900 truncate">
              {section.label || meta.name}
            </span>
            <span className="text-[10px] text-ink-muted bg-paper-2 px-1.5 py-0.2 rounded">
              v{section.variant + 1}
            </span>
          </div>
          <span className="text-[11px] text-ink-muted truncate">
            {meta.name}
          </span>
        </button>
      </div>

      {/* Acciones directas */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          className="p-1 text-ink-muted hover:text-navy-900 disabled:opacity-20 disabled:hover:text-ink-muted rounded"
          title="Mover arriba"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="p-1 text-ink-muted hover:text-navy-900 disabled:opacity-20 disabled:hover:text-ink-muted rounded"
          title="Mover abajo"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          className="p-1 text-ink-muted hover:text-navy-900 rounded"
          title="Duplicar sección"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1 text-ink-muted hover:text-danger rounded"
          title="Eliminar sección"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export const SkeletonEditorPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    current,
    activePageIndex,
    selectedSectionId,
    isHydrated,
    hydrate,
    saveCurrent,
    loadSkeleton,
    setCurrent,
    updateCurrent,
    setActivePageIndex,
    setSelectedSectionId,
    addPage,
    removePage,
    renamePage,
    addSection,
    removeSection,
    reorderSections,
    updateSection,
    duplicateSection,
    deleteSkeleton,
  } = useSkeletonStore();

  const { quotes, isHydrated: isQuotesHydrated, hydrate: hydrateQuotes } = useQuotesStore();

  useEffect(() => {
    if (!isHydrated) void hydrate();
    if (!isQuotesHydrated) void hydrateQuotes();
  }, [isHydrated, isQuotesHydrated, hydrate, hydrateQuotes]);

  // Cargar esqueleto existente o inicializar nuevo
  useEffect(() => {
    if (!isHydrated) return;

    if (id) {
      loadSkeleton(id);
    } else {
      // Parámetros opcionales desde presupuesto (?fromQuote=...)
      const fromQuoteId = searchParams.get('fromQuote');
      const clientParam = searchParams.get('client');
      const projectParam = searchParams.get('project');

      if (fromQuoteId) {
        const linkedQuote = quotes.find((q) => q.id === fromQuoteId);
        const plan = linkedQuote?.catalog.plans.find((p) => p.id === linkedQuote.planId);
        const limit = plan ? plan.pages + (linkedQuote?.extraPages || 0) : 3;

        const initial = getInitialStructure(
          'landing',
          clientParam || linkedQuote?.client || 'Cliente',
          projectParam || linkedQuote?.project || 'Sitio Web',
          limit
        );
        initial.project.linkedQuoteId = fromQuoteId;
        setCurrent(initial);
      } else {
        // Nuevo diseño estándar
        const initial = getInitialStructure('landing', 'Cliente', 'Sitio Web Corporativo', 3);
        setCurrent(initial);
      }
    }
  }, [id, isHydrated, searchParams, quotes, loadSkeleton, setCurrent]);

  // Pestaña izquierda: 'structure' | 'style' | 'project'
  const [leftTab, setLeftTab] = useState<'structure' | 'style' | 'project'>('structure');

  // Modo de visualización: Escritorio (1200px) o Móvil (390px)
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Escala y zoom del lienzo
  const [zoomMode, setZoomMode] = useState<'fit' | number>('fit');
  const [containerWidth, setContainerWidth] = useState(800);
  const containerRef = useRef<HTMLDivElement>(null);

  // Modo didáctico para el cliente (muestra explicaciones de cada sección)
  const [showDidactics, setShowDidactics] = useState(true);

  // Estado de guardado y exportación
  const [saveStatus, setSaveStatus] = useState<string>('Guardado ✓');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingPageName, setEditingPageName] = useState<string | null>(null);

  // Botón manual de guardado
  const handleSave = async () => {
    setSaveStatus('Guardando…');
    await saveCurrent();
    const timeStr = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    setSaveStatus(`Guardado ✓ ${timeStr}`);
    toast.success('Esqueleto guardado correctamente');
  };

  // Inyectar fuentes de Google Fonts dinámicamente para el DOM
  useEffect(() => {
    const { headingFont, bodyFont } = current.typography;
    const fontId = `google-font-${headingFont}-${bodyFont}`.replace(/\s+/g, '-');
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${headingFont.replace(/\s+/g, '+')}:wght@400;600;700&family=${bodyFont.replace(/\s+/g, '+')}:wght@400;500;600&display=swap`;
      document.head.appendChild(link);
    }
  }, [current.typography.headingFont, current.typography.bodyFont]);

  // Registrar fuentes para PDF de react-pdf (previene fallas en la exportación)
  useEffect(() => {
    if (current) {
      registerDynamicFont(current.typography.headingFont);
      registerDynamicFont(current.typography.bodyFont);
    }
  }, [current?.typography.headingFont, current?.typography.bodyFont]);

  // Medición no recursiva del contenedor para el ajuste de escala
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Cálculo seguro del factor de escala del lienzo
  const currentScale = useMemo(() => {
    const targetWidth = viewMode === 'desktop' ? 1200 : 390;
    if (zoomMode === 'fit') {
      const available = Math.max(containerWidth - 48, 200);
      return Math.max(0.25, Math.min(available / targetWidth, 1.0));
    }
    return Math.max(0.3, Math.min(zoomMode, 1.5));
  }, [viewMode, zoomMode, containerWidth]);

  // Página activa actual con fallback seguro
  const fallbackPage: SkeletonPage = { id: 'fallback', name: 'Inicio', sections: [] };
  const currentPage: SkeletonPage = current.pages[activePageIndex] ?? current.pages[0] ?? fallbackPage;

  // Cálculo del límite de páginas
  const linkedQuote = useMemo(() => {
    if (!current.project.linkedQuoteId) return null;
    return quotes.find((q) => q.id === current.project.linkedQuoteId) || null;
  }, [current.project.linkedQuoteId, quotes]);

  const maxAllowedPages = useMemo(() => {
    if (linkedQuote) {
      const plan = linkedQuote.catalog.plans.find((p) => p.id === linkedQuote.planId);
      return (plan?.pages || 1) + (linkedQuote.extraPages || 0);
    }
    return current.project.manualPageLimit || 3;
  }, [linkedQuote, current.project.manualPageLimit]);

  const isPageLimitExceeded = current.pages.length > maxAllowedPages;
  const isAtPageLimit = current.pages.length >= maxAllowedPages;

  // Sección seleccionada actualmente
  const selectedSection = useMemo(() => {
    if (!currentPage || !selectedSectionId) return null;
    return currentPage.sections.find((s) => s.id === selectedSectionId) || null;
  }, [currentPage, selectedSectionId]);

  // Sensores para Drag & Drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = currentPage.sections.findIndex((s) => s.id === active.id);
      const newIndex = currentPage.sections.findIndex((s) => s.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(currentPage.sections, oldIndex, newIndex);
        reorderSections(activePageIndex, reordered);
      }
    }
  };

  // Exportar PDF vectorial
  const handleExportPdf = async () => {
    if (isPageLimitExceeded) {
      toast.error(`Excedes el límite de ${maxAllowedPages} páginas. Ajusta el sitio antes de exportar.`);
      return;
    }

    setIsExportingPdf(true);
    try {
      const filename = `Esqueleto_Web_${sanitizeFilename(current.project.client)}_${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;

      const doc = React.createElement(SkeletonDocument, { design: current }) as unknown as Parameters<typeof pdf>[0];
      const blob = await pdf(doc).toBlob();
      downloadBlob(blob, filename);
      toast.success('PDF vectorial del esqueleto generado exitosamente');
    } catch (err: unknown) {
      console.error('Error al generar PDF del esqueleto:', err);
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al generar el PDF del esqueleto: ${msg}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Exportar JSON validado
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(current, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    downloadBlob(blob, `Esqueleto_${sanitizeFilename(current.name)}.json`);
    toast.success('Archivo JSON exportado');
  };

  // Importar JSON con validación Zod
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target?.result as string);
        const validated = SkeletonDesignSchema.parse(raw);
        setCurrent(validated);
        toast.success('Diseño de esqueleto importado correctamente');
      } catch (err: unknown) {
        toast.error(
          err instanceof Error
            ? `Archivo JSON incompatible o inválido: ${err.message}`
            : 'Error al importar JSON'
        );
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Deshacer y Rehacer vía Zundo
  const handleUndo = useCallback(() => {
    useSkeletonStore.temporal.getState().undo();
  }, []);

  const handleRedo = useCallback(() => {
    useSkeletonStore.temporal.getState().redo();
  }, []);

  // Atajos de teclado para Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Evaluaciones WCAG
  const textContrast = calculateContrastRatio(current.palette.text, current.palette.background);
  const textWcag = getWcagEvaluation(textContrast, false);

  const buttonContrast = calculateContrastRatio(current.palette.primary, current.palette.background);
  const buttonWcag = getWcagEvaluation(buttonContrast, true);

  return (
    <div className="flex flex-col gap-4 pb-12">
      {/* Barra de Cabecera Superior del Editor */}
      <div className="flex flex-col gap-3 border-b border-hairline pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/historial"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-hairline bg-white text-ink-muted hover:bg-paper-2 hover:text-navy-900 transition-colors"
            title="Volver al historial"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wider text-brass uppercase font-sans">
                Esqueleto Web
              </span>
              <span className="text-xs text-ink-muted font-mono">{saveStatus}</span>
            </div>
            <input
              type="text"
              value={current.name}
              onChange={(e) => updateCurrent({ name: e.target.value })}
              className="font-serif text-xl sm:text-2xl font-bold text-navy-900 bg-transparent border-b border-transparent hover:border-hairline focus:border-navy-500 focus:outline-none transition-colors"
              placeholder="Nombre del diseño…"
            />
          </div>
        </div>

        {/* Acciones de la barra superior */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Botones de Deshacer / Rehacer */}
          <div className="flex items-center border border-hairline rounded-lg bg-white overflow-hidden">
            <button
              type="button"
              onClick={handleUndo}
              className="p-2 text-ink-muted hover:text-navy-900 hover:bg-paper-2 transition-colors"
              title="Deshacer (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <div className="w-[1px] h-4 bg-hairline" />
            <button
              type="button"
              onClick={handleRedo}
              className="p-2 text-ink-muted hover:text-navy-900 hover:bg-paper-2 transition-colors"
              title="Rehacer (Ctrl+Shift+Z)"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>

          {/* Menú de Importar/Exportar JSON */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJson}
            accept=".json,application/json"
            className="hidden"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            title="Importar archivo JSON"
          >
            <Upload className="h-4 w-4 mr-1 text-ink-muted" />
            Importar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportJson}
            title="Exportar archivo JSON"
          >
            <FileJson className="h-4 w-4 mr-1 text-ink-muted" />
            Exportar JSON
          </Button>

          {/* Botón Eliminar */}
          <Button
            variant="ghost"
            size="sm"
            className="text-danger hover:bg-danger/10 hover:text-danger"
            onClick={() => setShowDeleteConfirm(true)}
            title="Eliminar este esqueleto"
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          {/* Botón Guardar */}
          <Button
            variant="secondary"
            size="md"
            onClick={handleSave}
            className="shadow-sm"
          >
            <Check className="h-4 w-4 mr-1.5" />
            Guardar
          </Button>

          {/* Exportar PDF Vectorial */}
          <Button
            variant="primary"
            size="md"
            onClick={handleExportPdf}
            disabled={isExportingPdf || isPageLimitExceeded}
            className="shadow-sm"
          >
            <Download className="h-4 w-4 mr-1.5" />
            {isExportingPdf ? 'Generando…' : 'Exportar PDF'}
          </Button>
        </div>
      </div>

      {/* Alerta si se excede el límite de páginas */}
      {isPageLimitExceeded && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/15 border border-warning/30 text-warning text-sm font-medium">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>
            Excedes lo cotizado por {current.pages.length - maxAllowedPages} página(s). Tienes{' '}
            {current.pages.length} de {maxAllowedPages} permitidas. La exportación a PDF está
            bloqueada hasta eliminar las páginas sobrantes.
          </span>
        </div>
      )}

      {/* CUADRÍCULA PRINCIPAL DE TRES PANELES: Izquierda (Inspector) · Centro (Lienzo) · Derecha (Inspector Sección) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* PANEL IZQUIERDO: Estructura · Estilo · Proyecto (3 columnas) */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          {/* Selector de Pestañas Izquierdas */}
          <div className="flex rounded-lg border border-hairline bg-paper-1 p-1">
            <button
              type="button"
              onClick={() => setLeftTab('structure')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                leftTab === 'structure'
                  ? 'bg-white text-navy-900 shadow-xs'
                  : 'text-ink-muted hover:text-navy-900'
              }`}
            >
              Estructura
            </button>
            <button
              type="button"
              onClick={() => setLeftTab('style')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                leftTab === 'style'
                  ? 'bg-white text-navy-900 shadow-xs'
                  : 'text-ink-muted hover:text-navy-900'
              }`}
            >
              Estilo
            </button>
            <button
              type="button"
              onClick={() => setLeftTab('project')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                leftTab === 'project'
                  ? 'bg-white text-navy-900 shadow-xs'
                  : 'text-ink-muted hover:text-navy-900'
              }`}
            >
              Proyecto
            </button>
          </div>

          {/* CONTENIDO PESTAÑA: ESTRUCTURA */}
          {leftTab === 'structure' && (
            <Card className="p-4 space-y-4">
              {/* Páginas del Sitio */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-navy-900">
                      Páginas
                    </span>
                    <Badge variant={isPageLimitExceeded ? 'danger' : 'navy'} size="sm">
                      {current.pages.length} de {maxAllowedPages}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addPage(`Página ${current.pages.length + 1}`)}
                    disabled={isAtPageLimit}
                    title={isAtPageLimit ? `Límite alcanzado (${maxAllowedPages} pág.)` : 'Agregar página'}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Nueva
                  </Button>
                </div>

                {/* Lista de páginas con selector */}
                <div className="flex flex-col gap-1">
                  {current.pages.map((p, idx) => (
                    <div
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setActivePageIndex(idx);
                        }
                      }}
                      className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                        activePageIndex === idx
                          ? 'bg-navy-900 text-white'
                          : 'bg-paper-1 hover:bg-paper-2 text-navy-900'
                      }`}
                      onClick={() => setActivePageIndex(idx)}
                    >
                      {editingPageName === p.id ? (
                        <input
                          type="text"
                          defaultValue={p.name}
                          maxLength={24}
                          onBlur={(e) => {
                            renamePage(idx, e.target.value.trim() || p.name);
                            setEditingPageName(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              renamePage(idx, e.currentTarget.value.trim() || p.name);
                              setEditingPageName(null);
                            }
                          }}
                          className="text-xs px-1 py-0.5 rounded bg-white text-navy-900 w-32 focus:outline-none"
                        />
                      ) : (
                        <span
                          onDoubleClick={() => setEditingPageName(p.id)}
                          title="Doble clic para renombrar"
                        >
                          {p.name} ({p.sections.length} bloques)
                        </span>
                      )}

                      {current.pages.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removePage(idx);
                          }}
                          className={`p-1 rounded hover:bg-white/20 ${
                            activePageIndex === idx ? 'text-white' : 'text-danger'
                          }`}
                          title="Eliminar página"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Elementos Globales: Navbar */}
              <div className="p-2.5 rounded-lg border border-hairline bg-paper-1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-navy-900">Barra de Navegación</span>
                  <Switch
                    checked={current.global.navbar.enabled}
                    onCheckedChange={(checked) =>
                      updateCurrent({
                        global: {
                          ...current.global,
                          navbar: { ...current.global.navbar, enabled: checked },
                        },
                      })
                    }
                  />
                </div>
                {current.global.navbar.enabled && (
                  <SegmentedControl
                    options={[
                      { value: '0', label: 'Logo izquierda' },
                      { value: '1', label: 'Logo centro' },
                    ]}
                    value={current.global.navbar.variant.toString()}
                    onChange={(val) =>
                      updateCurrent({
                        global: {
                          ...current.global,
                          navbar: { ...current.global.navbar, variant: parseInt(val, 10) },
                        },
                      })
                    }
                  />
                )}
              </div>

              {/* Secciones de la Página Activa (Lista ordenable) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-navy-900">
                    Secciones de {currentPage.name}
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowAddSectionModal(true)}
                    disabled={currentPage.sections.length >= 10}
                    title={
                      currentPage.sections.length >= 10
                        ? 'Máximo 10 secciones por página'
                        : 'Agregar sección'
                    }
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Sección
                  </Button>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={currentPage.sections.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-1.5 max-h-[380px] overflow-y-auto pr-1">
                      {currentPage.sections.map((section, idx) => (
                        <SortableSectionItem
                          key={section.id}
                          section={section}
                          index={idx}
                          total={currentPage.sections.length}
                          isSelected={selectedSectionId === section.id}
                          onSelect={() => setSelectedSectionId(section.id)}
                          onMoveUp={() => {
                            if (idx > 0) {
                              const reordered = arrayMove(currentPage.sections, idx, idx - 1);
                              reorderSections(activePageIndex, reordered);
                            }
                          }}
                          onMoveDown={() => {
                            if (idx < currentPage.sections.length - 1) {
                              const reordered = arrayMove(currentPage.sections, idx, idx + 1);
                              reorderSections(activePageIndex, reordered);
                            }
                          }}
                          onDuplicate={() => duplicateSection(activePageIndex, section.id)}
                          onDelete={() => removeSection(activePageIndex, section.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>

              {/* Elementos Globales: Footer */}
              <div className="p-2.5 rounded-lg border border-hairline bg-paper-1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-navy-900">Pie de Página (Footer)</span>
                  <Switch
                    checked={current.global.footer.enabled}
                    onCheckedChange={(checked) =>
                      updateCurrent({
                        global: {
                          ...current.global,
                          footer: { ...current.global.footer, enabled: checked },
                        },
                      })
                    }
                  />
                </div>
                {current.global.footer.enabled && (
                  <SegmentedControl
                    options={[
                      { value: '0', label: 'Simple' },
                      { value: '1', label: '3 Columnas' },
                    ]}
                    value={current.global.footer.variant.toString()}
                    onChange={(val) =>
                      updateCurrent({
                        global: {
                          ...current.global,
                          footer: { ...current.global.footer, variant: parseInt(val, 10) },
                        },
                      })
                    }
                  />
                )}
              </div>
            </Card>
          )}

          {/* CONTENIDO PESTAÑA: ESTILO */}
          {leftTab === 'style' && (
            <Card className="p-4 space-y-4">
              {/* Paletas Prediseñadas */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-navy-900">
                  Paletas Prediseñadas
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {PALETTE_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        updateCurrent({
                          palette: {
                            primary: p.primary,
                            secondary: p.secondary,
                            background: p.background,
                            text: p.text,
                            accent: p.accent,
                            presetId: p.presetId,
                          },
                        })
                      }
                      className={`flex flex-col p-2 rounded-lg border text-left transition-all ${
                        current.palette.presetId === p.presetId
                          ? 'border-navy-600 ring-2 ring-navy-600/20 bg-paper-2'
                          : 'border-hairline hover:border-navy-300 bg-white'
                      }`}
                    >
                      <span className="text-xs font-medium text-navy-900 truncate mb-1.5">
                        {p.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <span
                          className="h-3 w-3 rounded-full border border-black/10"
                          style={{ backgroundColor: p.primary }}
                        />
                        <span
                          className="h-3 w-3 rounded-full border border-black/10"
                          style={{ backgroundColor: p.secondary }}
                        />
                        <span
                          className="h-3 w-3 rounded-full border border-black/10"
                          style={{ backgroundColor: p.background }}
                        />
                        <span
                          className="h-3 w-3 rounded-full border border-black/10"
                          style={{ backgroundColor: p.text }}
                        />
                        <span
                          className="h-3 w-3 rounded-full border border-black/10"
                          style={{ backgroundColor: p.accent }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Colores Individuales con Input Color */}
              <div className="space-y-2 pt-2 border-t border-hairline/60">
                <span className="text-xs font-bold uppercase tracking-wider text-navy-900">
                  Ajuste de Colores
                </span>
                <div className="space-y-2 text-xs">
                  {[
                    { key: 'primary', label: 'Primario' },
                    { key: 'secondary', label: 'Secundario' },
                    { key: 'background', label: 'Fondo' },
                    { key: 'text', label: 'Texto' },
                    { key: 'accent', label: 'Acento' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="font-medium text-ink">{label}:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={current.palette[key as keyof typeof current.palette]}
                          onChange={(e) =>
                            updateCurrent({
                              palette: {
                                ...current.palette,
                                [key]: e.target.value,
                                presetId: 'personalizada',
                              },
                            })
                          }
                          className="h-6 w-8 rounded cursor-pointer border border-hairline p-0 bg-transparent"
                        />
                        <input
                          type="text"
                          maxLength={7}
                          value={current.palette[key as keyof typeof current.palette]}
                          onChange={(e) =>
                            updateCurrent({
                              palette: {
                                ...current.palette,
                                [key]: e.target.value,
                                presetId: 'personalizada',
                              },
                            })
                          }
                          className="w-16 px-1 py-0.5 font-mono text-[11px] rounded border border-hairline text-center uppercase"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Comprobación de Contraste WCAG */}
                <div className="p-2.5 rounded-lg bg-paper-1 border border-hairline space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">Texto vs Fondo:</span>
                    <Badge variant={textWcag.passes ? 'success' : 'danger'} size="sm">
                      {textWcag.description}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">Botón vs Fondo:</span>
                    <Badge variant={buttonWcag.passes ? 'success' : 'warning'} size="sm">
                      {buttonWcag.description}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Pares Tipográficos */}
              <div className="space-y-2 pt-2 border-t border-hairline/60">
                <span className="text-xs font-bold uppercase tracking-wider text-navy-900">
                  Pares Tipográficos
                </span>
                <Select
                  options={FONT_PAIR_PRESETS.map((pair) => ({
                    value: pair.id,
                    label: `${pair.name}: ${pair.headingFont} / ${pair.bodyFont}`,
                  }))}
                  value={
                    FONT_PAIR_PRESETS.find(
                      (p) =>
                        p.headingFont === current.typography.headingFont &&
                        p.bodyFont === current.typography.bodyFont
                    )?.id || 'personalizada'
                  }
                  onChange={(e) => {
                    const found = FONT_PAIR_PRESETS.find((p) => p.id === e.target.value);
                    if (found) {
                      updateCurrent({
                        typography: {
                          ...current.typography,
                          headingFont: found.headingFont,
                          bodyFont: found.bodyFont,
                        },
                      });
                    }
                  }}
                />

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Select
                    label="Títulos"
                    options={CURATED_FONTS.map((f) => ({ value: f, label: f }))}
                    value={current.typography.headingFont}
                    onChange={(e) =>
                      updateCurrent({
                        typography: { ...current.typography, headingFont: e.target.value },
                      })
                    }
                  />
                  <Select
                    label="Cuerpo"
                    options={CURATED_FONTS.map((f) => ({ value: f, label: f }))}
                    value={current.typography.bodyFont}
                    onChange={(e) =>
                      updateCurrent({
                        typography: { ...current.typography, bodyFont: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              {/* Configuración de Estilo y Esquinas */}
              <div className="space-y-2 pt-2 border-t border-hairline/60">
                <span className="text-xs font-bold uppercase tracking-wider text-navy-900">
                  Esquinas y Espaciado
                </span>
                <div className="space-y-2">
                  <span className="text-xs text-ink-muted">Radio de Esquinas:</span>
                  <SegmentedControl
                    options={[
                      { value: 'square', label: 'Rectas' },
                      { value: 'soft', label: 'Suaves' },
                      { value: 'round', label: 'Redondas' },
                    ]}
                    value={current.style.radius}
                    onChange={(val) =>
                      updateCurrent({
                        style: {
                          ...current.style,
                          radius: val as SkeletonDesign['style']['radius'],
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-xs text-ink-muted">Densidad de Espaciado:</span>
                  <SegmentedControl
                    options={[
                      { value: 'compact', label: 'Compacto' },
                      { value: 'normal', label: 'Normal' },
                      { value: 'wide', label: 'Amplio' },
                    ]}
                    value={current.style.density}
                    onChange={(val) =>
                      updateCurrent({
                        style: {
                          ...current.style,
                          density: val as SkeletonDesign['style']['density'],
                        },
                      })
                    }
                  />
                </div>
              </div>
            </Card>
          )}

          {/* CONTENIDO PESTAÑA: PROYECTO */}
          {leftTab === 'project' && (
            <Card className="p-4 space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-navy-900">
                  Vínculo con Presupuesto
                </span>
                <Select
                  options={[
                    { value: '', label: 'Ninguno (Modo manual)' },
                    ...quotes.map((q) => ({
                      value: q.id,
                      label: `${q.client} · ${q.project}`,
                    })),
                  ]}
                  value={current.project.linkedQuoteId || ''}
                  onChange={(e) => {
                    const qId = e.target.value;
                    if (qId) {
                      const q = quotes.find((quote) => quote.id === qId);
                      if (q) {
                        const plan = q.catalog.plans.find((p) => p.id === q.planId);
                        const limit = plan ? plan.pages + (q.extraPages || 0) : 3;
                        updateCurrent({
                          project: {
                            client: q.client,
                            project: q.project,
                            linkedQuoteId: q.id,
                            manualPageLimit: limit,
                          },
                        });
                        toast.success('Vinculado al presupuesto');
                        return;
                      }
                    }
                    updateCurrent({
                      project: { ...current.project, linkedQuoteId: undefined },
                    });
                  }}
                />
                {linkedQuote && (
                  <Badge variant="navy" size="sm" className="w-full justify-center">
                    Vinculado a: {linkedQuote.client} ({maxAllowedPages} pág.)
                  </Badge>
                )}
              </div>

              <div className="space-y-3 pt-2 border-t border-hairline/60">
                <Input
                  label="Cliente / Razón Social"
                  maxLength={80}
                  value={current.project.client}
                  onChange={(e) =>
                    updateCurrent({
                      project: { ...current.project, client: e.target.value },
                    })
                  }
                  disabled={Boolean(current.project.linkedQuoteId)}
                  helperText={current.project.linkedQuoteId ? 'Heredado del presupuesto' : undefined}
                />
                <Input
                  label="Nombre del Proyecto"
                  maxLength={80}
                  value={current.project.project}
                  onChange={(e) =>
                    updateCurrent({
                      project: { ...current.project, project: e.target.value },
                    })
                  }
                  disabled={Boolean(current.project.linkedQuoteId)}
                />

                {!current.project.linkedQuoteId && (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-ink-muted uppercase">
                      Límite de páginas manual (1–12)
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={current.project.manualPageLimit}
                      onChange={(e) =>
                        updateCurrent({
                          project: {
                            ...current.project,
                            manualPageLimit: Math.max(1, Math.min(12, parseInt(e.target.value, 10) || 1)),
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-md border border-hairline text-sm"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-hairline/60 space-y-1">
                <span className="text-xs font-semibold text-ink-muted uppercase">
                  Notas para el Cliente (PDF)
                </span>
                <textarea
                  rows={4}
                  maxLength={400}
                  value={current.notes}
                  onChange={(e) => updateCurrent({ notes: e.target.value })}
                  placeholder="Consideraciones técnicas o aclaraciones sobre la maqueta…"
                  className="w-full px-3 py-2 rounded-md border border-hairline text-xs resize-none focus:outline-none focus:border-navy-500"
                />
              </div>
            </Card>
          )}
        </div>

        {/* PANEL CENTRAL: LIENZO DE LA MAQUETA EN VIVO (6 columnas) */}
        <div className="flex flex-col gap-3 lg:col-span-6" ref={containerRef}>
          {/* Barra de Controles del Lienzo */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg border border-hairline bg-white shadow-xs">
            {/* Alternador Escritorio / Móvil */}
            <div className="flex items-center gap-1 bg-paper-1 p-0.5 rounded-md border border-hairline">
              <button
                type="button"
                onClick={() => setViewMode('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded transition-colors ${
                  viewMode === 'desktop'
                    ? 'bg-white text-navy-900 shadow-xs'
                    : 'text-ink-muted hover:text-navy-900'
                }`}
              >
                <Monitor className="h-3.5 w-3.5" />
                <span>Escritorio</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded transition-colors ${
                  viewMode === 'mobile'
                    ? 'bg-white text-navy-900 shadow-xs'
                    : 'text-ink-muted hover:text-navy-900'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Móvil</span>
              </button>
            </div>

            {/* Controles de Zoom (con Ajustar que calcula escala sin bucles) */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoomMode('fit')}
                className={`px-2 py-1 text-xs font-medium rounded border transition-colors flex items-center gap-1 ${
                  zoomMode === 'fit'
                    ? 'bg-navy-900 text-white border-navy-900'
                    : 'border-hairline text-ink-muted hover:bg-paper-2'
                }`}
                title="Ajustar al ancho de la pantalla"
              >
                <Maximize2 className="h-3 w-3" />
                Ajustar
              </button>

              <button
                type="button"
                onClick={() =>
                  setZoomMode((prev) => Math.max(0.3, (typeof prev === 'number' ? prev : currentScale) - 0.1))
                }
                className="p-1 rounded border border-hairline text-ink-muted hover:bg-paper-2"
                title="Reducir zoom (-)"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>

              <span className="text-xs font-mono text-ink-muted w-12 text-center">
                {Math.round(currentScale * 100)}%
              </span>

              <button
                type="button"
                onClick={() =>
                  setZoomMode((prev) => Math.min(1.5, (typeof prev === 'number' ? prev : currentScale) + 0.1))
                }
                className="p-1 rounded border border-hairline text-ink-muted hover:bg-paper-2"
                title="Aumentar zoom (+)"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Toggle de Modo Didáctico */}
            <button
              type="button"
              onClick={() => setShowDidactics((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                showDidactics
                  ? 'bg-brass-100 text-navy-950 border-amber-300'
                  : 'bg-white text-ink-muted border-hairline hover:bg-paper-2'
              }`}
              title="Activar/desactivar explicaciones didácticas en cada bloque"
            >
              <Sparkles className="h-3 w-3 text-brass" />
              <span>Simulador Didáctico</span>
            </button>
          </div>

          {/* Lienzo del Simulador con escala segura */}
          <div className="w-full flex flex-col items-center justify-start overflow-x-auto min-h-[600px] p-4 bg-paper-2 rounded-xl border border-hairline shadow-inner">
            {/* Banner Didáctico Superior */}
            {showDidactics && (
              <div className="w-full max-w-2xl mb-4 p-3 rounded-lg bg-white border border-amber-200/80 shadow-xs flex items-center gap-2.5 text-xs text-navy-900">
                <Info className="h-4 w-4 text-brass shrink-0" />
                <p>
                  <strong>Simulador Didáctico Activo:</strong> Todos los elementos y bloques mostrados son representaciones
                  referenciales para convenir el orden y jerarquía del sitio web antes de programar.
                </p>
              </div>
            )}

            {/* Marco del Dispositivo */}
            <div
              style={{
                width: viewMode === 'desktop' ? '1200px' : '390px',
                transform: `scale(${currentScale})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
                backgroundColor: current.palette.background,
                borderRadius: viewMode === 'desktop' ? '12px' : '24px',
                border: '1px solid #CBD5E1',
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                overflow: 'hidden',
              }}
            >
              {/* Barra superior simulada del navegador/dispositivo */}
              <div className="px-4 py-2 bg-paper-2 border-b border-hairline flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 mx-4 px-3 py-0.5 rounded bg-white border border-hairline text-[10px] text-ink-muted truncate font-mono text-center">
                  https://www.{sanitizeFilename(current.project.client).toLowerCase()}.cl/{currentPage.name.toLowerCase()}
                </div>
              </div>

              {/* Navbar global si está habilitada */}
              {current.global.navbar.enabled && (
                <div className="relative border-b border-black/5">
                  {showDidactics && (
                    <div className="bg-navy-900 text-white text-[9px] font-semibold px-2 py-0.5 tracking-wider uppercase flex items-center gap-1">
                      <span>🏷️ Barra de Navegación (Header)</span>
                    </div>
                  )}
                  <DomWireframeRenderer
                    node={getGlobalNavbarTree(current.global.navbar.variant)}
                    design={current}
                  />
                </div>
              )}

              {/* Bloques de la página activa */}
              <div className="flex flex-col">
                {currentPage.sections.map((section, idx) => {
                  const tree = getWireframeBlockTree(section.type, section.variant, section.label);
                  const isSelected = selectedSectionId === section.id;
                  const meta = BLOCK_METAS[section.type];

                  return (
                    <div
                      key={section.id}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setSelectedSectionId(section.id);
                        }
                      }}
                      onClick={() => setSelectedSectionId(section.id)}
                      className={`relative cursor-pointer transition-all ${
                        isSelected
                          ? 'ring-2 ring-navy-600 ring-inset'
                          : 'hover:outline-1 hover:outline-dashed hover:outline-navy-400'
                      }`}
                    >
                      {/* Badge Didáctico flotante sobre la sección */}
                      {showDidactics && (
                        <div className="bg-navy-950/90 text-white text-[9px] font-medium px-2.5 py-0.5 flex items-center justify-between">
                          <span className="font-semibold">
                            {idx + 1}. {section.label || meta.name}
                          </span>
                          <span className="opacity-80 text-[8px] max-w-sm truncate ml-2">
                            {meta.didacticExplanation}
                          </span>
                        </div>
                      )}

                      <DomWireframeRenderer node={tree} design={current} />
                    </div>
                  );
                })}
              </div>

              {/* Footer global si está habilitado */}
              {current.global.footer.enabled && (
                <div className="relative border-t border-black/5">
                  {showDidactics && (
                    <div className="bg-navy-900 text-white text-[9px] font-semibold px-2 py-0.5 tracking-wider uppercase">
                      <span>🏷️ Pie de Página (Footer)</span>
                    </div>
                  )}
                  <DomWireframeRenderer
                    node={getGlobalFooterTree(current.global.footer.variant)}
                    design={current}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: INSPECTOR DE LA SECCIÓN SELECCIONADA (3 columnas) */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          {selectedSection ? (
            <Card className="p-4 space-y-4">
              {/* Encabezado del Inspector */}
              <div className="flex items-center justify-between border-b border-hairline pb-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-brass">
                    Inspector
                  </span>
                  <h3 className="font-serif text-base font-bold text-navy-900">
                    {BLOCK_METAS[selectedSection.type].name}
                  </h3>
                </div>
                <Badge variant="navy" size="sm">
                  v{selectedSection.variant + 1}
                </Badge>
              </div>

              {/* Explicación Didáctica para el Cliente */}
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200/60 text-xs space-y-1">
                <span className="font-bold text-amber-900 flex items-center gap-1">
                  <HelpCircle className="h-3.5 w-3.5 text-amber-700" />
                  ¿Para qué sirve este bloque?
                </span>
                <p className="text-amber-800 leading-relaxed">
                  {BLOCK_METAS[selectedSection.type].didacticExplanation}
                </p>
                <p className="text-[11px] text-amber-700 font-medium pt-1 border-t border-amber-200/50">
                  <strong>Objetivo comercial:</strong> {BLOCK_METAS[selectedSection.type].clientPurpose}
                </p>
              </div>

              {/* Etiqueta / Nombre Personalizado */}
              <Input
                label="Nombre / Título del Bloque"
                maxLength={40}
                value={selectedSection.label}
                onChange={(e) =>
                  updateSection(activePageIndex, selectedSection.id, { label: e.target.value })
                }
                helperText="Nombre que verá el cliente en el esquema"
              />

              {/* Selector de Variantes de Diseño */}
              <div className="space-y-2 pt-2 border-t border-hairline/60">
                <span className="text-xs font-bold uppercase tracking-wider text-navy-900">
                  Variante de Maqueta
                </span>
                <div className="flex flex-col gap-2">
                  {BLOCK_METAS[selectedSection.type].variants.map((v) => (
                    <button
                      key={v.variantIndex}
                      type="button"
                      onClick={() =>
                        updateSection(activePageIndex, selectedSection.id, {
                          variant: v.variantIndex,
                        })
                      }
                      className={`flex flex-col p-2.5 rounded-lg border text-left transition-all ${
                        selectedSection.variant === v.variantIndex
                          ? 'border-navy-600 bg-navy-50/70 ring-1 ring-navy-600'
                          : 'border-hairline bg-white hover:border-navy-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-navy-900">{v.name}</span>
                        {selectedSection.variant === v.variantIndex && (
                          <Check className="h-3.5 w-3.5 text-navy-700" />
                        )}
                      </div>
                      <span className="text-[11px] text-ink-muted mt-0.5 leading-snug">
                        {v.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Acciones de la sección */}
              <div className="pt-3 border-t border-hairline/60 flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => duplicateSection(activePageIndex, selectedSection.id)}
                  className="flex-1"
                >
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Duplicar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => removeSection(activePageIndex, selectedSection.id)}
                  className="flex-1"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Eliminar
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center text-ink-muted space-y-2 border-dashed">
              <HelpCircle className="h-6 w-6 mx-auto text-ink-subtle" />
              <h4 className="font-serif text-sm font-semibold text-navy-900">
                Ningún bloque seleccionado
              </h4>
              <p className="text-xs">
                Haz clic en cualquier sección de la maqueta o de la lista de estructura para inspeccionar sus opciones y cambiar su variante.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* MODAL PARA AGREGAR NUEVA SECCIÓN (Categorizada con explicaciones didácticas) */}
      {showAddSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/40 backdrop-blur-xs p-4 animate-in fade-in">
          <Card className="w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 bg-white shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-2">
              <div>
                <h3 className="font-serif text-lg font-bold text-navy-900">
                  Biblioteca de Bloques para {currentPage.name}
                </h3>
                <p className="text-xs text-ink-muted">
                  Selecciona la sección que deseas incorporar a la maqueta interactiva.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddSectionModal(false)}
              >
                Cerrar
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(BLOCK_METAS) as SectionType[])
                .filter((t) => t !== 'navbar' && t !== 'footer')
                .map((type) => {
                  const meta = BLOCK_METAS[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        const newSec: SkeletonSection = {
                          id: crypto.randomUUID(),
                          type,
                          variant: 0,
                          label: meta.name,
                        };
                        addSection(activePageIndex, newSec, selectedSectionId || undefined);
                        setSelectedSectionId(newSec.id);
                        setShowAddSectionModal(false);
                      }}
                      className="flex flex-col p-3 rounded-lg border border-hairline bg-white hover:border-navy-500 hover:bg-navy-50/40 text-left transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-navy-900 group-hover:text-navy-700">
                          {meta.name}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-ink-subtle group-hover:text-navy-700" />
                      </div>
                      <p className="text-[11px] text-ink-muted mt-1 line-clamp-2">
                        {meta.didacticExplanation}
                      </p>
                    </button>
                  );
                })}
            </div>
          </Card>
        </div>
      )}

      {/* DIÁLOGO DE CONFIRMACIÓN PARA ELIMINAR ESQUELETO */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="¿Eliminar este esqueleto web?"
        description={`Se eliminará permanentemente la maqueta "${current.name}".`}
        confirmLabel="Eliminar Esqueleto"
        variant="danger"
        onConfirm={async () => {
          await deleteSkeleton(current.id);
          setShowDeleteConfirm(false);
          toast.success('Esqueleto eliminado');
          navigate('/historial');
        }}
      />
    </div>
  );
};

export default SkeletonEditorPage;
