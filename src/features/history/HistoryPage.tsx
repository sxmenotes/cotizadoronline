import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  FileText,
  Layout,
  Download,
  Copy,
  GitBranch,
  Trash2,
  Calendar,
  ExternalLink,
  X,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import {
  Button,
  Card,
  Input,
  Select,
  Badge,
  EmptyState,
  ConfirmDialog,
  toast,
} from '../../ui';
import { useQuotesStore } from '../../store/quotesStore';
import { useSkeletonStore } from '../../store/skeletonStore';
import { calculatePricing } from '../../domain/pricing';
import type { Quote, SkeletonDesign, ProjectType, CurrencyCode } from '../../domain/types';
import { QuoteDocument } from '../../pdf/QuoteDocument';
import { pdf } from '@react-pdf/renderer';
import {
  normalizeSearch,
  matchesAllWords,
  generateQuotePdfFilename,
  downloadBlob,
} from '../../lib/utils';

type SortOption = 'recent' | 'oldest' | 'client' | 'amount';

// Componente para resaltar coincidencias de texto de forma segura
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim() || !text) return <>{text}</>;

  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return <>{text}</>;

  // Construir regex escapada para los términos
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`(${escaped})`, 'gi');

  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) => {
        const isMatch = terms.some((t) => normalizeSearch(part) === t);
        return isMatch ? (
          <mark key={i} className="bg-brass-100 text-navy-950 font-semibold rounded-xs px-0.5">
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        );
      })}
    </>
  );
}

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    quotes,
    isHydrated: isQuotesHydrated,
    hydrate: hydrateQuotes,
    deleteQuote,
    undoDeleteQuote,
    duplicateQuote,
    createRevision,
  } = useQuotesStore();

  const {
    skeletons,
    isHydrated: isSkeletonsHydrated,
    hydrate: hydrateSkeletons,
    deleteSkeleton,
  } = useSkeletonStore();

  useEffect(() => {
    if (!isQuotesHydrated) void hydrateQuotes();
    if (!isSkeletonsHydrated) void hydrateSkeletons();
  }, [isQuotesHydrated, isSkeletonsHydrated, hydrateQuotes, hydrateSkeletons]);

  // Pestaña activa: 'quotes' | 'skeletons'
  const [activeTab, setActiveTab] = useState<'quotes' | 'skeletons'>('quotes');

  // Parámetros de búsqueda y filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [projectTypeFilter, setProjectTypeFilter] = useState<'all' | ProjectType>('all');
  const [currencyFilter, setCurrencyFilter] = useState<'all' | CurrencyCode>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  // Estado para diálogos
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  const [skeletonToDelete, setSkeletonToDelete] = useState<SkeletonDesign | null>(null);
  const [quoteForRevision, setQuoteForRevision] = useState<Quote | null>(null);
  const [revisionNote, setRevisionNote] = useState('');
  const [downloadingQuoteId, setDownloadingQuoteId] = useState<string | null>(null);

  // Debounce de 150ms para búsqueda instantánea
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filtrar y ordenar presupuestos
  const filteredQuotes = useMemo(() => {
    return quotes
      .filter((q) => {
        // Filtro por tipo de proyecto
        if (projectTypeFilter !== 'all' && q.projectType !== projectTypeFilter) {
          return false;
        }
        // Filtro por moneda
        if (currencyFilter !== 'all' && q.currency !== currencyFilter) {
          return false;
        }
        // Búsqueda AND en cliente, proyecto, detalle de revisión, URL del prototipo y nombre del plan
        if (debouncedQuery.trim()) {
          const planName = q.catalog.plans.find((p) => p.id === q.planId)?.name || '';
          const match = matchesAllWords(debouncedQuery, [
            q.client,
            q.project,
            q.versionNote,
            q.prototypeUrl,
            planName,
          ]);
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'recent') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'client') {
          return a.client.localeCompare(b.client, 'es');
        }
        if (sortBy === 'amount') {
          try {
            const pA = calculatePricing({
              projectType: a.projectType,
              planId: a.planId,
              extraPages: a.extraPages,
              subscriptionId: a.subscriptionId,
              hosting: a.hosting,
              currency: a.currency,
              exchangeRate: a.exchangeRate,
              catalog: a.catalog,
            });
            const pB = calculatePricing({
              projectType: b.projectType,
              planId: b.planId,
              extraPages: b.extraPages,
              subscriptionId: b.subscriptionId,
              hosting: b.hosting,
              currency: b.currency,
              exchangeRate: b.exchangeRate,
              catalog: b.catalog,
            });
            return pB.initialTotal - pA.initialTotal;
          } catch {
            return 0;
          }
        }
        return 0;
      });
  }, [quotes, projectTypeFilter, currencyFilter, debouncedQuery, sortBy]);

  // Filtrar y ordenar esqueletos
  const filteredSkeletons = useMemo(() => {
    return skeletons
      .filter((s) => {
        if (!debouncedQuery.trim()) return true;
        return matchesAllWords(debouncedQuery, [
          s.name,
          s.project.client,
          s.project.project,
          s.notes,
        ]);
      })
      .sort((a, b) => {
        if (sortBy === 'recent') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'client') {
          return a.project.client.localeCompare(b.project.client, 'es');
        }
        return 0;
      });
  }, [skeletons, debouncedQuery, sortBy]);

  // Manejar descarga de PDF vectorial de un presupuesto
  const handleDownloadPdf = async (quote: Quote) => {
    setDownloadingQuoteId(quote.id);
    try {
      const filename = generateQuotePdfFilename(quote.client, quote.project, quote.issuedOn);
      const doc = React.createElement(QuoteDocument, { quote }) as unknown as Parameters<typeof pdf>[0];
      const blob = await pdf(doc).toBlob();
      downloadBlob(blob, filename);
      toast.success('Descarga de PDF completada');
    } catch {
      toast.error('Error al generar el PDF');
    } finally {
      setDownloadingQuoteId(null);
    }
  };

  // Manejar duplicar presupuesto
  const handleDuplicateQuote = async (id: string) => {
    try {
      const dup = await duplicateQuote(id);
      toast.success('Presupuesto duplicado');
      navigate(`/presupuestos/${dup.id}`);
    } catch {
      toast.error('Error al duplicar');
    }
  };

  // Manejar crear revisión de presupuesto
  const handleConfirmRevision = async () => {
    if (!quoteForRevision || !revisionNote.trim()) return;
    try {
      const rev = await createRevision(quoteForRevision.id, revisionNote.trim());
      setQuoteForRevision(null);
      setRevisionNote('');
      toast.success('Nueva revisión creada');
      navigate(`/presupuestos/${rev.id}`);
    } catch {
      toast.error('Error al crear revisión');
    }
  };

  // Manejar eliminación con toast de 8 segundos para deshacer
  const handleConfirmDeleteQuote = async () => {
    if (!quoteToDelete) return;
    const clientName = quoteToDelete.client;
    await deleteQuote(quoteToDelete.id);
    setQuoteToDelete(null);

    toast(`Presupuesto para "${clientName}" eliminado`, {
      action: {
        label: 'Deshacer',
        onClick: () => {
          void undoDeleteQuote();
        },
      },
      duration: 8000,
    });
  };

  const handleConfirmDeleteSkeleton = async () => {
    if (!skeletonToDelete) return;
    const name = skeletonToDelete.name;
    await deleteSkeleton(skeletonToDelete.id);
    setSkeletonToDelete(null);
    toast.success(`Esqueleto "${name}" eliminado`);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setProjectTypeFilter('all');
    setCurrencyFilter('all');
    setSortBy('recent');
  };

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    projectTypeFilter !== 'all' ||
    currencyFilter !== 'all' ||
    sortBy !== 'recent';

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* Cabecera de Sección */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-hairline pb-4">
        <div>
          <span className="text-xs font-semibold tracking-wider text-brass uppercase font-sans">
            Archivo y Documentos
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy-900">
            Historial de Cotizaciones
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Gestiona, duplica y exporta propuestas comerciales y maquetas de wireframes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'quotes' ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/presupuestos/nuevo')}
              className="shadow-sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Nuevo Presupuesto
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/esqueletos/nuevo')}
              className="shadow-sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Nuevo Esqueleto
            </Button>
          )}
        </div>
      </div>

      {/* Pestañas de Navegación */}
      <div className="flex items-center gap-2 border-b border-hairline">
        <button
          type="button"
          onClick={() => setActiveTab('quotes')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'quotes'
              ? 'border-navy-900 text-navy-900 font-semibold'
              : 'border-transparent text-ink-muted hover:text-navy-900'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Presupuestos</span>
          <span className="rounded-full bg-paper-2 px-2 py-0.5 text-xs text-ink-muted">
            {quotes.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('skeletons')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'skeletons'
              ? 'border-navy-900 text-navy-900 font-semibold'
              : 'border-transparent text-ink-muted hover:text-navy-900'
          }`}
        >
          <Layout className="h-4 w-4" />
          <span>Esqueletos Web</span>
          <span className="rounded-full bg-paper-2 px-2 py-0.5 text-xs text-ink-muted">
            {skeletons.length}
          </span>
        </button>
      </div>

      {/* Barra de Búsqueda, Filtros y Ordenamiento */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12 items-center">
          {/* Campo de Búsqueda Instantánea con Debounce */}
          <div className="relative md:col-span-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
            <Input
              type="text"
              placeholder={
                activeTab === 'quotes'
                  ? 'Buscar por cliente, proyecto, plan o notas…'
                  : 'Buscar maquetas por nombre o cliente…'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink p-0.5 rounded-full"
                title="Limpiar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filtros específicos de Presupuestos */}
          {activeTab === 'quotes' ? (
            <>
              <div className="md:col-span-2">
                <Select
                  value={projectTypeFilter}
                  onChange={(e) => setProjectTypeFilter(e.target.value as 'all' | ProjectType)}
                  options={[
                    { value: 'all', label: 'Tipo: Todos' },
                    { value: 'construccion', label: 'Construcción' },
                    { value: 'venta', label: 'Venta código' },
                  ]}
                />
              </div>

              <div className="md:col-span-2">
                <Select
                  value={currencyFilter}
                  onChange={(e) => setCurrencyFilter(e.target.value as 'all' | CurrencyCode)}
                  options={[
                    { value: 'all', label: 'Moneda: Todas' },
                    { value: 'CLP', label: 'Pesos (CLP)' },
                    { value: 'USD', label: 'Dólares (USD)' },
                  ]}
                />
              </div>

              <div className="md:col-span-3">
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  options={[
                    { value: 'recent', label: 'Orden: Más recientes' },
                    { value: 'oldest', label: 'Orden: Más antiguos' },
                    { value: 'client', label: 'Orden: Cliente A–Z' },
                    { value: 'amount', label: 'Orden: Mayor monto' },
                  ]}
                />
              </div>
            </>
          ) : (
            <div className="md:col-span-7 flex justify-end">
              <div className="w-full md:w-64">
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  options={[
                    { value: 'recent', label: 'Orden: Más recientes' },
                    { value: 'oldest', label: 'Orden: Más antiguos' },
                    { value: 'client', label: 'Orden: Cliente A–Z' },
                  ]}
                />
              </div>
            </div>
          )}
        </div>

        {/* Resumen de Filtros Activos */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-hairline/60 text-xs">
            <span className="text-ink-muted flex items-center gap-1">
              <Filter className="h-3 w-3" /> Filtros aplicados:
            </span>
            {searchQuery && (
              <Badge variant="default" size="sm">
                "{searchQuery}"
              </Badge>
            )}
            {projectTypeFilter !== 'all' && (
              <Badge variant="navy" size="sm">
                {projectTypeFilter === 'construccion' ? 'Construcción' : 'Venta'}
              </Badge>
            )}
            {currencyFilter !== 'all' && (
              <Badge variant="default" size="sm">
                {currencyFilter}
              </Badge>
            )}
            {sortBy !== 'recent' && (
              <Badge variant="brass" size="sm">
                <ArrowUpDown className="h-2.5 w-2.5 mr-1" />
                {sortBy === 'oldest' ? 'Antiguos' : sortBy === 'client' ? 'A–Z' : 'Monto'}
              </Badge>
            )}
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-navy-700 hover:underline font-medium ml-auto"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </Card>

      {/* Contenido de la Pestaña Presupuestos */}
      {activeTab === 'quotes' && (
        <div className="space-y-4">
          {quotes.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-8 w-8 text-brass" />}
              title="Aún no hay presupuestos"
              description="Crea tu primera propuesta comercial paramétrica con cálculo de abonos e inversión en tiempo real."
              actionLabel="Crear nuevo presupuesto"
              onAction={() => navigate('/presupuestos/nuevo')}
            />
          ) : filteredQuotes.length === 0 ? (
            <EmptyState
              icon={<Search className="h-8 w-8 text-ink-muted" />}
              title="No se encontraron presupuestos"
              description="No hay propuestas que coincidan con los criterios de búsqueda y filtros seleccionados."
              actionLabel="Limpiar filtros"
              onAction={clearAllFilters}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredQuotes.map((quote) => {
                const plan = quote.catalog.plans.find((p) => p.id === quote.planId);
                const pricing = calculatePricing({
                  projectType: quote.projectType,
                  planId: quote.planId,
                  extraPages: quote.extraPages,
                  subscriptionId: quote.subscriptionId,
                  hosting: quote.hosting,
                  currency: quote.currency,
                  exchangeRate: quote.exchangeRate,
                  catalog: quote.catalog,
                });

                return (
                  <Card
                    key={quote.id}
                    className="p-5 hover:border-navy-300 transition-colors flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    {/* Información del Presupuesto */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-serif text-lg font-bold text-navy-900 truncate max-w-sm">
                          <Highlight text={quote.client} query={debouncedQuery} />
                        </span>
                        <span className="text-ink-muted">·</span>
                        <span className="text-sm font-medium text-ink-muted truncate max-w-xs">
                          <Highlight text={quote.project} query={debouncedQuery} />
                        </span>

                        <Badge
                          variant={
                            quote.versionType === 'first'
                              ? 'navy'
                              : quote.versionType === 'revision'
                              ? 'warning'
                              : 'success'
                          }
                          size="sm"
                        >
                          {quote.versionType === 'first'
                            ? 'Primera versión'
                            : quote.versionType === 'revision'
                            ? `Revisión: ${quote.versionNote || ''}`
                            : 'Versión final'}
                        </Badge>

                        {quote.currency === 'USD' && (
                          <Badge variant="default" size="sm">
                            USD
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {quote.issuedOn}
                        </span>
                        <span>
                          Plan: <strong className="text-navy-900">{plan?.name || quote.planId}</strong>
                        </span>
                        {quote.extraPages > 0 && (
                          <span>+{quote.extraPages} pág. extra</span>
                        )}
                        <span>
                          Modalidad:{' '}
                          <strong className="text-navy-900">
                            {quote.projectType === 'construccion' ? 'Construcción' : 'Venta código'}
                          </strong>
                        </span>
                        {quote.prototypeUrl && (
                          <a
                            href={quote.prototypeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-navy-700 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" /> Prototipo
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Resumen Financiero y Acciones */}
                    <div className="flex flex-wrap items-center justify-between gap-4 lg:justify-end border-t lg:border-t-0 border-hairline/60 pt-3 lg:pt-0">
                      <div className="text-left lg:text-right">
                        <div className="text-xs text-ink-muted">Total Inicial</div>
                        <div className="font-serif text-lg font-bold text-navy-900">
                          {pricing.formatted.initialTotal}
                        </div>
                        <div className="text-[11px] text-ink-muted">
                          Abono: {pricing.formatted.deposit}
                        </div>
                      </div>

                      {/* Botones de Acción */}
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDownloadPdf(quote)}
                          disabled={downloadingQuoteId === quote.id}
                          title="Descargar PDF vectorial"
                        >
                          <Download className="h-3.5 w-3.5 mr-1 text-ink-muted" />
                          {downloadingQuoteId === quote.id ? 'PDF…' : 'PDF'}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicateQuote(quote.id)}
                          title="Duplicar como nueva cotización"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setQuoteForRevision(quote);
                            setRevisionNote('');
                          }}
                          title="Crear nueva revisión formal"
                        >
                          <GitBranch className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-danger hover:bg-danger/10 hover:text-danger"
                          onClick={() => setQuoteToDelete(quote)}
                          title="Eliminar cotización"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/presupuestos/${quote.id}`)}
                        >
                          Abrir
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Contenido de la Pestaña Esqueletos */}
      {activeTab === 'skeletons' && (
        <div className="space-y-4">
          {skeletons.length === 0 ? (
            <EmptyState
              icon={<Layout className="h-8 w-8 text-brass" />}
              title="Aún no hay maquetas de esqueleto"
              description="Diseña la estructura de tu web sección por sección con wireframes interactivos y paletas de contraste."
              actionLabel="Crear nuevo esqueleto"
              onAction={() => navigate('/esqueletos/nuevo')}
            />
          ) : filteredSkeletons.length === 0 ? (
            <EmptyState
              icon={<Search className="h-8 w-8 text-ink-muted" />}
              title="No se encontraron esqueletos"
              description="No hay maquetas que coincidan con la búsqueda."
              actionLabel="Limpiar búsqueda"
              onAction={() => setSearchQuery('')}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSkeletons.map((skel) => {
                const totalSections = skel.pages.reduce((acc, p) => acc + p.sections.length, 0);

                return (
                  <Card
                    key={skel.id}
                    className="p-5 hover:border-navy-300 transition-colors flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="navy" size="sm">
                          {skel.pages.length} {skel.pages.length === 1 ? 'página' : 'páginas'}
                        </Badge>
                        <span className="text-xs text-ink-muted">
                          {new Date(skel.updatedAt).toLocaleDateString('es-CL')}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-serif text-base font-bold text-navy-900 truncate">
                          <Highlight text={skel.name} query={debouncedQuery} />
                        </h3>
                        <p className="text-xs text-ink-muted truncate">
                          Cliente:{' '}
                          <strong>
                            <Highlight text={skel.project.client} query={debouncedQuery} />
                          </strong>
                        </p>
                      </div>

                      {/* Muestra de la paleta de colores */}
                      <div className="flex items-center gap-1.5 pt-2">
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-black/10"
                          style={{ backgroundColor: skel.palette.primary }}
                          title={`Color primario: ${skel.palette.primary}`}
                        />
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-black/10"
                          style={{ backgroundColor: skel.palette.secondary }}
                          title={`Color secundario: ${skel.palette.secondary}`}
                        />
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-black/10"
                          style={{ backgroundColor: skel.palette.accent }}
                          title={`Color acento: ${skel.palette.accent}`}
                        />
                        <span className="text-[11px] text-ink-muted ml-2">
                          {totalSections} bloques en total
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-hairline/60">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger hover:bg-danger/10 hover:text-danger"
                        onClick={() => setSkeletonToDelete(skel)}
                        title="Eliminar esqueleto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/esqueletos/${skel.id}`)}
                      >
                        Abrir Editor
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Diálogo de Confirmación para Eliminar Presupuesto */}
      <ConfirmDialog
        open={Boolean(quoteToDelete)}
        onOpenChange={(open) => !open && setQuoteToDelete(null)}
        title="¿Eliminar presupuesto?"
        description={`Se eliminará la cotización para "${quoteToDelete?.client}". Podrás deshacer esta acción durante 8 segundos.`}
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={handleConfirmDeleteQuote}
      />

      {/* Diálogo de Confirmación para Eliminar Esqueleto */}
      <ConfirmDialog
        open={Boolean(skeletonToDelete)}
        onOpenChange={(open) => !open && setSkeletonToDelete(null)}
        title="¿Eliminar esqueleto web?"
        description={`Se eliminará la maqueta "${skeletonToDelete?.name}". Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={handleConfirmDeleteSkeleton}
      />

      {/* Diálogo para Crear Nueva Revisión desde el Historial */}
      {quoteForRevision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/40 backdrop-blur-xs p-4 animate-in fade-in">
          <Card className="w-full max-w-md p-6 bg-white shadow-xl space-y-4">
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-bold text-navy-900">
                Crear Revisión de {quoteForRevision.project}
              </h3>
              <p className="text-xs text-ink-muted">
                Se duplicará el presupuesto para {quoteForRevision.client} incrementando la versión a "Revisión".
              </p>
            </div>

            <Input
              label="Detalle o justificación de la revisión *"
              placeholder="Ej: Incorporación de 2 páginas adicionales e integración Webpay"
              maxLength={120}
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setQuoteForRevision(null);
                  setRevisionNote('');
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmRevision}
                disabled={!revisionNote.trim()}
              >
                Crear Revisión
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
