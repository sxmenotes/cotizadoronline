import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Save,
  Download,
  Copy,
  GitBranch,
  Layout,
  Trash2,
  ArrowLeft,
  Calendar,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  Button,
  Card,
  Input,
  Select,
  NumberStepper,
  Switch,
  SegmentedControl,
  Badge,
  ConfirmDialog,
  toast,
} from '../../ui';
import { useQuotesStore } from '../../store/quotesStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useSkeletonStore } from '../../store/skeletonStore';
import { calculatePricing, PricingResult } from '../../domain/pricing';
import type {
  Quote,
  QuoteVersionType,
  ProjectType,
  CurrencyCode,
  QuoteMode,
  CustomQuoteConfig,
  CustomPaymentType,
} from '../../domain/types';
import { PdfPreview } from '../../pdf/PdfPreview';
import { QuoteDocument } from '../../pdf/QuoteDocument';
import { pdf } from '@react-pdf/renderer';
import { generateQuotePdfFilename, downloadBlob } from '../../lib/utils';
import { registerDynamicFont } from '../../pdf/fonts';

export const QuoteEditorPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const {
    quotes,
    draft,
    isHydrated: isQuotesHydrated,
    hydrate: hydrateQuotes,
    saveQuote,
    deleteQuote,
    undoDeleteQuote,
    duplicateQuote,
    createRevision,
    setDraft,
    clearDraft,
  } = useQuotesStore();

  const {
    catalog,
    terms,
    issuer,
    defaultExchangeRate,
    defaultExchangeNote,
    isHydrated: isSettingsHydrated,
    hydrate: hydrateSettings,
  } = useSettingsStore();

  const { skeletons, isHydrated: isSkeletonsHydrated, hydrate: hydrateSkeletons } = useSkeletonStore();

  // Asegurar hidratación
  useEffect(() => {
    if (!isQuotesHydrated) void hydrateQuotes();
    if (!isSettingsHydrated) void hydrateSettings();
    if (!isSkeletonsHydrated) void hydrateSkeletons();
  }, [isQuotesHydrated, isSettingsHydrated, isSkeletonsHydrated, hydrateQuotes, hydrateSettings, hydrateSkeletons]);

  // Estado del formulario
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [newRevisionNote, setNewRevisionNote] = useState('');

  // Inicializar o cargar cotización
  const initializedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isQuotesHydrated || !isSettingsHydrated) return;

    const currentKey = id || 'new';
    if (initializedKeyRef.current === currentKey) return;
    initializedKeyRef.current = currentKey;

    if (id) {
      const found = quotes.find((q) => q.id === id);
      if (found) {
        setCurrentQuote(found);
      } else {
        toast.error('Presupuesto no encontrado');
        navigate('/historial', { replace: true });
      }
    } else {
      // Modo creación nuevo
      const today = new Date().toISOString().slice(0, 10);
      const defaultPlan = catalog.plans[0]?.id || 'landing';
      const defaultSub = catalog.subscriptions.find((s) => s.id === 'basico')?.id || 'none';

      if (draft && draft.client !== undefined) {
        // Restaurar borrador con datos ingresados, pero SIEMPRE con catálogo, términos y emisor actualizados de Ajustes
        const planExists = catalog.plans.some((p) => p.id === draft.planId);
        const subExists = catalog.subscriptions.some((s) => s.id === draft.subscriptionId);

        setCurrentQuote({
          id: draft.id || crypto.randomUUID(),
          createdAt: draft.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          issuedOn: draft.issuedOn || today,
          client: draft.client || '',
          project: draft.project || '',
          prototypeUrl: draft.prototypeUrl || '',
          versionType: draft.versionType || 'first',
          versionNote: draft.versionNote || '',
          projectType: draft.projectType || 'construccion',
          planId: planExists ? (draft.planId || defaultPlan) : defaultPlan,
          extraPages: typeof draft.extraPages === 'number' ? draft.extraPages : 0,
          subscriptionId: subExists ? (draft.subscriptionId || defaultSub) : defaultSub,
          hosting: draft.hosting !== undefined ? draft.hosting : true,
          currency: draft.currency || 'CLP',
          exchangeRate: draft.exchangeRate || defaultExchangeRate || 950,
          exchangeNote: draft.exchangeNote || defaultExchangeNote,
          catalog,
          terms,
          issuer,
          quoteMode: draft.quoteMode || 'standard',
          customConfig: draft.customConfig || undefined,
        });
      } else {
        // Inicializar nuevo
        setCurrentQuote({
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          issuedOn: today,
          client: '',
          project: '',
          prototypeUrl: '',
          versionType: 'first',
          versionNote: '',
          projectType: 'construccion',
          planId: defaultPlan,
          extraPages: 0,
          subscriptionId: defaultSub,
          hosting: true,
          currency: 'CLP',
          exchangeRate: defaultExchangeRate || 950,
          exchangeNote: defaultExchangeNote,
          catalog,
          terms,
          issuer,
          quoteMode: 'standard',
          customConfig: undefined,
        });
      }
    }
  }, [id, isQuotesHydrated, isSettingsHydrated, quotes, catalog, terms, issuer, defaultExchangeRate, defaultExchangeNote, draft, navigate]);

  // Sincronizar reactivamente catálogo, términos y emisor actualizados desde Ajustes para nuevas cotizaciones / borrador
  useEffect(() => {
    if (!id && isSettingsHydrated) {
      setCurrentQuote((prev) => {
        if (!prev) return prev;
        if (prev.catalog === catalog && prev.terms === terms && prev.issuer === issuer) {
          return prev;
        }
        const planExists = catalog.plans.some((p) => p.id === prev.planId);
        const nextPlanId = planExists ? prev.planId : (catalog.plans[0]?.id || 'landing');
        const subExists = catalog.subscriptions.some((s) => s.id === prev.subscriptionId);
        const nextSubId = subExists ? prev.subscriptionId : 'none';

        return {
          ...prev,
          planId: nextPlanId,
          subscriptionId: nextSubId,
          catalog,
          terms,
          issuer,
        };
      });
    }
  }, [id, isSettingsHydrated, catalog, terms, issuer]);

  // Detectar si una cotización histórica tiene tarifas desactualizadas respecto al catálogo de Ajustes
  const isCatalogOutdated = useMemo(() => {
    if (!currentQuote || !id) return false;
    return JSON.stringify(currentQuote.catalog) !== JSON.stringify(catalog);
  }, [currentQuote, id, catalog]);

  // Autoguardado de borrador (solo si es nuevo, debounce 400ms)
  const isDraftSavingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!id && currentQuote) {
      if (isDraftSavingRef.current) clearTimeout(isDraftSavingRef.current);
      isDraftSavingRef.current = setTimeout(() => {
        void setDraft(currentQuote);
      }, 400);
    }
    return () => {
      if (isDraftSavingRef.current) clearTimeout(isDraftSavingRef.current);
    };
  }, [id, currentQuote, setDraft]);

  // Registrar fuentes dinámicas del esqueleto vinculado (para evitar bugs de react-pdf en render)
  useEffect(() => {
    if (currentQuote?.includeSkeletonInPdf && currentQuote.linkedSkeletonId) {
      const skel = skeletons.find(s => s.id === currentQuote.linkedSkeletonId);
      if (skel) {
        registerDynamicFont(skel.typography.headingFont);
        registerDynamicFont(skel.typography.bodyFont);
      }
    }
  }, [currentQuote?.includeSkeletonInPdf, currentQuote?.linkedSkeletonId, skeletons]);

  // Validaciones
  const validationErrors = useMemo(() => {
    if (!currentQuote) return {};
    const errors: Record<string, string> = {};

    if (!currentQuote.client.trim()) {
      errors.client = 'El nombre o razón social del cliente es obligatorio';
    } else if (currentQuote.client.length > 80) {
      errors.client = 'Máximo 80 caracteres';
    }

    if (!currentQuote.project.trim()) {
      errors.project = 'El nombre del proyecto es obligatorio';
    } else if (currentQuote.project.length > 80) {
      errors.project = 'Máximo 80 caracteres';
    }

    if (currentQuote.prototypeUrl && currentQuote.prototypeUrl.trim().length > 0) {
      try {
        const parsed = new URL(currentQuote.prototypeUrl);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          errors.prototypeUrl = 'Debe comenzar con http:// o https://';
        }
      } catch {
        errors.prototypeUrl = 'Ingrese una URL válida (ej: https://figma.com/...)';
      }
    }

    if (currentQuote.versionType === 'revision') {
      if (!currentQuote.versionNote || !currentQuote.versionNote.trim()) {
        errors.versionNote = 'El detalle de la revisión es obligatorio';
      } else if (currentQuote.versionNote.length > 120) {
        errors.versionNote = 'Máximo 120 caracteres';
      }
    }

    if (currentQuote.currency === 'USD') {
      if (!currentQuote.exchangeRate || currentQuote.exchangeRate <= 0) {
        errors.exchangeRate = 'El tipo de cambio debe ser un número positivo mayor a 0';
      }
    }

    if (currentQuote.quoteMode === 'custom') {
      if (!currentQuote.customConfig?.itemName?.trim()) {
        errors.customItemName = 'El nombre o detalle de lo que se cotiza es obligatorio';
      } else if (currentQuote.customConfig.itemName.length > 120) {
        errors.customItemName = 'Máximo 120 caracteres';
      }

      if (!currentQuote.customConfig?.price || currentQuote.customConfig.price <= 0) {
        errors.customPrice = 'El valor monetario debe ser mayor a 0';
      }
    }

    return errors;
  }, [currentQuote]);

  const isCustomValid =
    currentQuote?.quoteMode !== 'custom' ||
    (Boolean(currentQuote?.customConfig?.itemName?.trim()) && (currentQuote?.customConfig?.price ?? 0) > 0);

  const isValid =
    Object.keys(validationErrors).length === 0 &&
    Boolean(currentQuote?.client.trim()) &&
    Boolean(currentQuote?.project.trim()) &&
    isCustomValid;

  // Cálculo en vivo de precios
  const pricingResult: PricingResult | null = useMemo(() => {
    if (!currentQuote) return null;
    try {
      return calculatePricing({
        projectType: currentQuote.projectType,
        planId: currentQuote.planId,
        extraPages: currentQuote.extraPages,
        subscriptionId: currentQuote.subscriptionId,
        hosting: currentQuote.hosting,
        currency: currentQuote.currency,
        exchangeRate: currentQuote.exchangeRate,
        catalog: currentQuote.catalog,
        quoteMode: currentQuote.quoteMode,
        customConfig: currentQuote.customConfig,
      });
    } catch {
      return null;
    }
  }, [currentQuote]);

  if (!currentQuote || !pricingResult) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-navy-700 border-t-transparent" />
          <span className="text-xs font-medium text-ink-muted">Cargando presupuesto…</span>
        </div>
      </div>
    );
  }

  // Manejadores de cambios
  const updateField = <K extends keyof Quote>(field: K, value: Quote[K]) => {
    setCurrentQuote((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const updateCustomConfig = (patch: Partial<CustomQuoteConfig>) => {
    setCurrentQuote((prev) => {
      if (!prev) return prev;
      const existing = prev.customConfig || {
        itemName: '',
        description: '',
        price: 150000,
        isOneTimePayment: true,
        paymentType: 'unique',
        requiresDeposit: true,
        depositOption: 'percent',
        depositPercent: 50,
        deliveryDays: prev.catalog?.deliveryBusinessDays || 10,
      };
      return {
        ...prev,
        customConfig: {
          ...existing,
          ...patch,
        },
      };
    });
  };

  // Guardar presupuesto
  const handleSave = async () => {
    if (!isValid) {
      toast.error('Por favor complete los campos obligatorios antes de guardar');
      return;
    }

    setIsSaving(true);
    try {
      const toSave: Quote = {
        ...currentQuote,
        updatedAt: new Date().toISOString(),
      };
      await saveQuote(toSave);
      if (!id) {
        await clearDraft();
        toast.success('Presupuesto creado con éxito');
        navigate(`/presupuestos/${toSave.id}`, { replace: true });
      } else {
        toast.success('Cambios guardados con éxito');
      }
    } catch {
      toast.error('Error al guardar el presupuesto');
    } finally {
      setIsSaving(false);
    }
  };

  // Descargar PDF vectorial
  const handleDownload = async () => {
    if (!isValid) {
      toast.error('Corrija las advertencias antes de exportar el PDF');
      return;
    }

    setIsDownloading(true);
    try {
      const filename = generateQuotePdfFilename(currentQuote.client, currentQuote.project, currentQuote.issuedOn);

      const linkedSkeleton = (currentQuote.includeSkeletonInPdf && currentQuote.linkedSkeletonId)
        ? skeletons.find(s => s.id === currentQuote.linkedSkeletonId)
        : undefined;

      let blobToUse = pdfBlob;
      if (!blobToUse) {
        // Generar blob bajo demanda si el de vista previa aún no está listo
        const doc = React.createElement(QuoteDocument, { quote: currentQuote, skeletonDesign: linkedSkeleton }) as unknown as Parameters<typeof pdf>[0];
        blobToUse = await pdf(doc).toBlob();
      }

      downloadBlob(blobToUse, filename);
      toast.success('Descarga de PDF iniciada');
    } catch {
      toast.error('Error al generar el PDF para descarga');
    } finally {
      setIsDownloading(false);
    }
  };

  // Duplicar
  const handleDuplicate = async () => {
    try {
      const dup = await duplicateQuote(currentQuote.id);
      toast.success('Presupuesto duplicado');
      navigate(`/presupuestos/${dup.id}`);
    } catch {
      toast.error('Error al duplicar el presupuesto');
    }
  };

  // Nueva revisión
  const handleCreateRevision = async () => {
    if (!newRevisionNote.trim()) {
      toast.error('Ingrese el detalle o motivo de la revisión');
      return;
    }

    try {
      const rev = await createRevision(currentQuote.id, newRevisionNote.trim());
      setShowRevisionDialog(false);
      setNewRevisionNote('');
      toast.success('Nueva revisión creada');
      navigate(`/presupuestos/${rev.id}`);
    } catch {
      toast.error('Error al crear la revisión');
    }
  };

  // Eliminar
  const handleDelete = async () => {
    const deletedId = currentQuote.id;
    await deleteQuote(deletedId);
    setShowDeleteConfirm(false);
    navigate('/historial');
    toast('Presupuesto eliminado', {
      action: {
        label: 'Deshacer',
        onClick: () => {
          void undoDeleteQuote();
        },
      },
      duration: 8000,
    });
  };

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* Barra de cabecera con navegación y acciones */}
      <div className="flex flex-col gap-4 border-b border-hairline pb-4 lg:flex-row lg:items-center lg:justify-between">
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
                Propuesta Comercial
              </span>
              <Badge
                variant={
                  currentQuote.versionType === 'first'
                    ? 'navy'
                    : currentQuote.versionType === 'revision'
                    ? 'warning'
                    : 'success'
                }
                size="sm"
              >
                {currentQuote.versionType === 'first'
                  ? 'Primera propuesta'
                  : currentQuote.versionType === 'revision'
                  ? 'Revisión'
                  : 'Versión final'}
              </Badge>
              {currentQuote.currency === 'USD' && (
                <Badge variant="default" size="sm">
                  USD
                </Badge>
              )}
            </div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-navy-900 truncate max-w-md sm:max-w-xl">
              {currentQuote.project || currentQuote.client
                ? `${currentQuote.project || 'Sin título'} · ${currentQuote.client || 'Cliente'}`
                : 'Nuevo Presupuesto'}
            </h1>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex flex-wrap items-center gap-2">
          {id && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDuplicate}
                title="Duplicar como nuevo presupuesto"
              >
                <Copy className="h-4 w-4 mr-1.5 text-ink-muted" />
                Duplicar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRevisionDialog(true)}
                title="Crear una revisión formal de este presupuesto"
              >
                <GitBranch className="h-4 w-4 mr-1.5 text-ink-muted" />
                Nueva revisión
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  navigate(
                    `/esqueletos/nuevo?fromQuote=${currentQuote.id}&client=${encodeURIComponent(
                      currentQuote.client
                    )}&project=${encodeURIComponent(currentQuote.project)}&planId=${currentQuote.planId}`
                  )
                }
                title="Crear un esqueleto wireframe asociado"
              >
                <Layout className="h-4 w-4 mr-1.5 text-navy-700" />
                Crear esqueleto
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-danger hover:bg-danger/10 hover:text-danger"
                onClick={() => setShowDeleteConfirm(true)}
                title="Eliminar este presupuesto"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Eliminar
              </Button>
            </>
          )}

          <Button
            variant="secondary"
            size="md"
            onClick={handleDownload}
            disabled={!isValid || isDownloading}
            className="shadow-xs"
          >
            <Download className="h-4 w-4 mr-1.5 text-ink-muted" />
            {isDownloading ? 'Generando…' : 'Descargar PDF'}
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={!isValid || isSaving}
            className="shadow-sm"
          >
            <Save className="h-4 w-4 mr-1.5" />
            {isSaving ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </div>

      {/* Aviso de tarifas congeladas para presupuestos existentes si el catálogo de Ajustes cambió */}
      {id && isCatalogOutdated && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-brass-300 bg-brass-50 p-4 text-xs text-navy-950">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brass-600 shrink-0" />
            <span>
              Este presupuesto histórico conserva las tarifas de su fecha de emisión. Hay valores actualizados en el Catálogo de Ajustes.
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setCurrentQuote((prev) => (prev ? { ...prev, catalog, terms, issuer } : prev));
              toast.success('Presupuesto actualizado con las tarifas y condiciones vigentes');
            }}
            className="shrink-0"
          >
            Actualizar a Tarifas Vigentes
          </Button>
        </div>
      )}

      {/* Cuadrícula de 2 columnas: Formulario & Resumen Financiero a la izquierda, PDF Preview a la derecha */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Columna Izquierda: Controles del Formulario (7 columnas) */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          {/* Tarjeta 1: Información Principal */}
          <Card className="p-5 sm:p-6 space-y-4">
            <h2 className="font-serif text-base font-semibold text-navy-900 border-b border-hairline pb-2 flex items-center justify-between">
              <span>Información del Cliente y Proyecto</span>
              <span className="text-xs font-normal text-ink-muted">* Campos obligatorios</span>
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Cliente / Razón Social *"
                maxLength={80}
                placeholder="Ej: Clínica San José SpA"
                value={currentQuote.client}
                onChange={(e) => updateField('client', e.target.value)}
                error={validationErrors.client}
              />
              <Input
                label="Nombre del Proyecto *"
                maxLength={80}
                placeholder="Ej: Sitio Web Corporativo 2026"
                value={currentQuote.project}
                onChange={(e) => updateField('project', e.target.value)}
                error={validationErrors.project}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Enlace al Prototipo (opcional)"
                placeholder="https://figma.com/@prototipo"
                value={currentQuote.prototypeUrl || ''}
                onChange={(e) => updateField('prototypeUrl', e.target.value)}
                error={validationErrors.prototypeUrl}
                helperText="Se incluirá como hipervínculo clicable en el PDF."
              />
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-ink-muted" />
                  <span className="text-xs font-semibold tracking-wider text-ink-muted uppercase">
                    Fecha de emisión
                  </span>
                </div>
                <Input
                  type="date"
                  value={currentQuote.issuedOn}
                  onChange={(e) => updateField('issuedOn', e.target.value)}
                />
              </div>
            </div>

            {/* Versión del documento */}
            <div className="pt-2 border-t border-hairline/60">
              <span className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">
                Versión del Presupuesto
              </span>
              <SegmentedControl
                options={[
                  { value: 'first', label: 'Primera propuesta' },
                  { value: 'revision', label: 'Revisión formal' },
                  { value: 'final', label: 'Versión final' },
                ]}
                value={currentQuote.versionType}
                onChange={(val) => updateField('versionType', val as QuoteVersionType)}
              />

              {currentQuote.versionType === 'revision' && (
                <div className="mt-3">
                  <Input
                    label="Detalle de la revisión *"
                    maxLength={120}
                    placeholder="Ej: Ajuste de alcance e incorporación de 2 páginas adicionales"
                    value={currentQuote.versionNote || ''}
                    onChange={(e) => updateField('versionNote', e.target.value)}
                    error={validationErrors.versionNote}
                    helperText="Aparece destacado en la segunda página del PDF."
                  />
                </div>
              )}
            </div>

            {/* Vinculación con Esqueleto */}
            <div className="pt-2 border-t border-hairline/60">
              <span className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">
                Esqueleto de Diseño Web
              </span>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="Vincular Esqueleto"
                  options={[
                    { value: '', label: 'Ninguno' },
                    ...skeletons.map((skel) => ({
                      value: skel.id,
                      label: `${skel.name} (${skel.project.client})`,
                    })),
                  ]}
                  value={currentQuote.linkedSkeletonId || ''}
                  onChange={(e) => {
                    updateField('linkedSkeletonId', e.target.value || undefined);
                    if (!e.target.value) {
                      updateField('includeSkeletonInPdf', false);
                    }
                  }}
                />
                
                {currentQuote.linkedSkeletonId && (
                  <div className="flex flex-col justify-center gap-1.5 rounded-lg border border-hairline bg-paper-1 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-navy-900">Adjuntar en PDF</p>
                        <p className="text-[11px] text-ink-muted leading-tight">
                          El esqueleto se añadirá como anexo al final del presupuesto.
                        </p>
                      </div>
                      <Switch
                        checked={!!currentQuote.includeSkeletonInPdf}
                        onCheckedChange={(checked) => updateField('includeSkeletonInPdf', checked)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Tarjeta 2: Modalidad, Moneda y Plan / Personalizado */}
          <Card className="p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-hairline pb-3 gap-2">
              <div>
                <h2 className="font-serif text-base font-semibold text-navy-900">
                  Alcance y Modalidad de Contratación
                </h2>
                <p className="text-xs text-ink-muted">
                  Selecciona un plan estándar de desarrollo web o crea una propuesta personalizada a medida.
                </p>
              </div>
              <Badge variant={currentQuote.quoteMode === 'custom' ? 'brass' : 'navy'} size="sm">
                {currentQuote.quoteMode === 'custom' ? '✨ Personalizado' : '🌐 Catálogo Web'}
              </Badge>
            </div>

            {/* Selector de Modo de Presupuesto */}
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">
                Tipo de Presupuesto
              </span>
              <SegmentedControl
                options={[
                  { value: 'standard', label: 'Plan Web Estándar (Catálogo)' },
                  { value: 'custom', label: '✨ Presupuesto Personalizado (A Medida)' },
                ]}
                value={currentQuote.quoteMode || 'standard'}
                onChange={(val) => {
                  const mode = val as QuoteMode;
                  updateField('quoteMode', mode);
                  if (mode === 'custom' && !currentQuote.customConfig) {
                    updateCustomConfig({
                      itemName: '',
                      description: '',
                      price: 250000,
                      isOneTimePayment: true,
                      paymentType: 'unique',
                      requiresDeposit: true,
                      depositOption: 'percent',
                      depositPercent: 50,
                      deliveryDays: currentQuote.catalog.deliveryBusinessDays || 10,
                    });
                  }
                }}
              />
            </div>

            {/* Moneda y Tipo de Cambio (común a ambos modos) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-hairline/60">
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">
                  Moneda de Facturación
                </span>
                <SegmentedControl
                  options={[
                    { value: 'CLP', label: 'Pesos (CLP)' },
                    { value: 'USD', label: 'Dólares (USD)' },
                  ]}
                  value={currentQuote.currency}
                  onChange={(val) => updateField('currency', val as CurrencyCode)}
                />
              </div>

              {currentQuote.currency === 'USD' ? (
                <Input
                  label="Tipo de cambio referencial (CLP/USD) *"
                  type="number"
                  step="0.01"
                  min="1"
                  value={currentQuote.exchangeRate?.toString() || '950'}
                  onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    updateField('exchangeRate', isNaN(parsed) ? 0 : parsed);
                  }}
                  error={validationErrors.exchangeRate}
                  helperText="Valor de 1 USD en CLP para el cálculo en centavos."
                />
              ) : (
                <div className="flex flex-col justify-center">
                  <span className="text-xs font-medium text-ink-muted">Moneda de cálculo</span>
                  <span className="text-sm font-semibold text-navy-900">Pesos Chilenos (CLP)</span>
                </div>
              )}
            </div>

            {/* MODO PERSONALIZADO */}
            {currentQuote.quoteMode === 'custom' ? (
              <div className="pt-2 border-t border-hairline/60 space-y-4">
                {/* 1. Nombre / Detalle de lo que se cotiza */}
                <Input
                  label="Nombre o Detalle de lo que se cotiza *"
                  placeholder="Ej: Desarrollo de App Móvil, Diseño de Marca, Integración API, Consultoría..."
                  value={currentQuote.customConfig?.itemName || ''}
                  onChange={(e) => updateCustomConfig({ itemName: e.target.value })}
                  error={validationErrors.customItemName}
                  helperText="Nombre principal que identifica el servicio o producto en la propuesta y PDF."
                />

                {/* 2. Descripción o alcance */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="custom-scope-desc" className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Alcance o especificaciones del trabajo (opcional)
                  </label>
                  <textarea
                    id="custom-scope-desc"
                    rows={2}
                    className="w-full rounded-lg border border-hairline bg-paper-1 px-3 py-2 text-sm text-ink focus:border-navy-500 focus:bg-white focus:outline-none transition-colors"
                    placeholder="Detalla los entregables, características clave, funcionalidades o requerimientos incluidos..."
                    value={currentQuote.customConfig?.description || ''}
                    onChange={(e) => updateCustomConfig({ description: e.target.value })}
                  />
                </div>

                {/* 3. Valor monetario */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={`Valor Monetario (${currentQuote.currency}) *`}
                    type="number"
                    min="1"
                    placeholder={currentQuote.currency === 'CLP' ? '250000' : '300'}
                    value={
                      currentQuote.currency === 'CLP'
                        ? currentQuote.customConfig?.price || ''
                        : Math.round(((currentQuote.customConfig?.price || 0) / (currentQuote.exchangeRate || 950)) * 100) / 100 || ''
                    }
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      if (currentQuote.currency === 'CLP') {
                        updateCustomConfig({ price: Math.max(0, Math.round(val)) });
                      } else {
                        updateCustomConfig({ price: Math.max(0, Math.round(val * (currentQuote.exchangeRate || 950))) });
                      }
                    }}
                    error={validationErrors.customPrice}
                    helperText={
                      currentQuote.currency === 'CLP'
                        ? currentQuote.exchangeRate && currentQuote.exchangeRate > 0
                          ? `≈ US$${((currentQuote.customConfig?.price || 0) / currentQuote.exchangeRate).toFixed(2)} USD (Tasa ${currentQuote.exchangeRate})`
                          : undefined
                        : `≈ $${(currentQuote.customConfig?.price || 0).toLocaleString('es-CL')} CLP`
                    }
                  />

                  {/* Plazo estimado */}
                  <NumberStepper
                    label="Plazo estimado (días hábiles)"
                    min={1}
                    max={180}
                    value={currentQuote.customConfig?.deliveryDays || currentQuote.catalog.deliveryBusinessDays || 10}
                    onChange={(val) => updateCustomConfig({ deliveryDays: val })}
                  />
                </div>

                {/* 4. Modalidad de Pago: Pago Único vs Recurrente vs Cuotas */}
                <div className="rounded-lg border border-hairline bg-paper-1 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-navy-900">
                      Modalidad y Frecuencia de Pago
                    </span>
                    <Badge variant="navy" size="sm">
                      {currentQuote.customConfig?.paymentType === 'recurring'
                        ? 'Suscripción / Recurrente'
                        : currentQuote.customConfig?.paymentType === 'installments'
                        ? 'Por Cuotas'
                        : 'Pago Único'}
                    </Badge>
                  </div>

                  <SegmentedControl
                    options={[
                      { value: 'unique', label: 'Pago Único' },
                      { value: 'recurring', label: 'Recurrente / Mensual' },
                      { value: 'installments', label: 'En Cuotas' },
                    ]}
                    value={currentQuote.customConfig?.paymentType || (currentQuote.customConfig?.isOneTimePayment ? 'unique' : 'recurring')}
                    onChange={(val) => {
                      const pType = val as CustomPaymentType;
                      updateCustomConfig({
                        paymentType: pType,
                        isOneTimePayment: pType === 'unique',
                        billingPeriod: pType === 'recurring' ? 'monthly' : undefined,
                        installmentsCount: pType === 'installments' ? (currentQuote.customConfig?.installmentsCount || 2) : undefined,
                      });
                    }}
                  />

                  {currentQuote.customConfig?.paymentType === 'recurring' && (
                    <div className="pt-2 flex items-center justify-between text-xs text-ink-muted">
                      <span>Frecuencia del cobro recurrente:</span>
                      <div className="w-48">
                        <SegmentedControl
                          options={[
                            { value: 'monthly', label: 'Mensual' },
                            { value: 'yearly', label: 'Anual' },
                          ]}
                          value={currentQuote.customConfig?.billingPeriod || 'monthly'}
                          onChange={(val) => updateCustomConfig({ billingPeriod: val as 'monthly' | 'yearly' })}
                        />
                      </div>
                    </div>
                  )}

                  {currentQuote.customConfig?.paymentType === 'installments' && (
                    <div className="pt-2 flex items-center justify-between">
                      <NumberStepper
                        label="Cantidad de Cuotas"
                        min={2}
                        max={12}
                        value={currentQuote.customConfig?.installmentsCount || 2}
                        onChange={(val) => updateCustomConfig({ installmentsCount: val })}
                      />
                      <div className="text-right text-xs text-ink-muted">
                        <span className="block font-medium text-navy-900">
                          {currentQuote.currency === 'USD'
                            ? `US$${(((currentQuote.customConfig?.price || 0) / (currentQuote.exchangeRate || 950)) / (currentQuote.customConfig?.installmentsCount || 2)).toFixed(2)} / cuota`
                            : `$${Math.round((currentQuote.customConfig?.price || 0) / (currentQuote.customConfig?.installmentsCount || 2)).toLocaleString('es-CL')} CLP / cuota`}
                        </span>
                        <span>{currentQuote.customConfig?.installmentsCount || 2} pagos iguales</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Condición de Abono */}
                <div className="rounded-lg border border-hairline bg-paper-1 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-navy-900 block">
                        Condición de Abono Inicial
                      </span>
                      <span className="text-[11px] text-ink-muted">
                        ¿Requiere pago anticipado para iniciar o es 100% contraentrega?
                      </span>
                    </div>
                    <Badge variant={currentQuote.customConfig?.requiresDeposit ? 'brass' : 'default'} size="sm">
                      {currentQuote.customConfig?.requiresDeposit
                        ? `Abono ${currentQuote.customConfig?.depositPercent ?? 50}%`
                        : currentQuote.customConfig?.noDepositTiming === 'upfront' ||
                          currentQuote.customConfig?.depositOption === 'upfront' ||
                          currentQuote.customConfig?.depositOption === 'full_upfront'
                        ? '100% Anticipado'
                        : '100% Contraentrega'}
                    </Badge>
                  </div>

                  <SegmentedControl
                    options={[
                      { value: 'deposit', label: 'Requiere Abono Inicial' },
                      { value: 'no_deposit', label: 'Sin Abono (Pago 100%)' },
                    ]}
                    value={currentQuote.customConfig?.requiresDeposit ? 'deposit' : 'no_deposit'}
                    onChange={(val) => {
                      const req = val === 'deposit';
                      const currentTiming = currentQuote.customConfig?.noDepositTiming || 'delivery';
                      updateCustomConfig({
                        requiresDeposit: req,
                        depositOption: req ? 'percent' : currentTiming,
                        depositPercent: req ? (currentQuote.customConfig?.depositPercent || 50) : 0,
                        noDepositTiming: req ? undefined : currentTiming,
                      });
                    }}
                  />

                  {currentQuote.customConfig?.requiresDeposit ? (
                    <div className="pt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-ink-muted">Porcentaje de abono inicial:</span>
                        <div className="flex items-center gap-1">
                          {[30, 50, 60, 70].map((pct) => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => updateCustomConfig({ depositPercent: pct })}
                              className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-colors ${
                                (currentQuote.customConfig?.depositPercent ?? 50) === pct
                                  ? 'bg-navy-900 text-white'
                                  : 'bg-white border border-hairline text-ink-muted hover:text-navy-900'
                              }`}
                            >
                              {pct}%
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Desglose en vivo de abono vs saldo */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-hairline/60 text-xs">
                        <div className="rounded-md bg-white p-2.5 border border-hairline">
                          <span className="block text-[11px] text-ink-muted">
                            Abono para iniciar ({currentQuote.customConfig?.depositPercent ?? 50}%):
                          </span>
                          <span className="font-bold text-navy-900 text-sm">
                            {pricingResult.formatted.deposit}
                          </span>
                        </div>
                        <div className="rounded-md bg-white p-2.5 border border-hairline">
                          <span className="block text-[11px] text-ink-muted">Saldo contraentrega:</span>
                          <span className="font-bold text-navy-900 text-sm">
                            {pricingResult.formatted.balance}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* CUANDO ES SIN ABONO (PAGO 100%) */
                    <div className="pt-2 space-y-3">
                      <div>
                        <span className="text-xs font-semibold text-navy-900 block mb-1.5">
                          Momento del pago 100%:
                        </span>
                        <SegmentedControl
                          options={[
                            { value: 'delivery', label: '🚚 100% Contraentrega' },
                            { value: 'upfront', label: '💳 100% Pago Anticipado' },
                          ]}
                          value={
                            currentQuote.customConfig?.noDepositTiming === 'upfront' ||
                            currentQuote.customConfig?.depositOption === 'upfront' ||
                            currentQuote.customConfig?.depositOption === 'full_upfront'
                              ? 'upfront'
                              : 'delivery'
                          }
                          onChange={(val) => {
                            const timing = val as 'delivery' | 'upfront';
                            updateCustomConfig({
                              noDepositTiming: timing,
                              depositOption: timing,
                            });
                          }}
                        />
                      </div>

                      {/* Desglose en vivo para pago 100% */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-hairline/60 text-xs">
                        <div className="rounded-md bg-white p-2.5 border border-hairline">
                          <span className="block text-[11px] text-ink-muted">
                            {currentQuote.customConfig?.noDepositTiming === 'upfront' ||
                            currentQuote.customConfig?.depositOption === 'upfront' ||
                            currentQuote.customConfig?.depositOption === 'full_upfront'
                              ? 'Pago anticipado (100%):'
                              : 'Abono inicial requerido:'}
                          </span>
                          <span className="font-bold text-navy-900 text-sm">
                            {pricingResult.formatted.deposit}
                          </span>
                        </div>
                        <div className="rounded-md bg-white p-2.5 border border-hairline">
                          <span className="block text-[11px] text-ink-muted">
                            {currentQuote.customConfig?.noDepositTiming === 'upfront' ||
                            currentQuote.customConfig?.depositOption === 'upfront' ||
                            currentQuote.customConfig?.depositOption === 'full_upfront'
                              ? 'Saldo al finalizar:'
                              : 'Total a pagar contraentrega:'}
                          </span>
                          <span className="font-bold text-navy-900 text-sm">
                            {pricingResult.formatted.balance}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2.5 rounded-md bg-white border border-hairline text-xs text-ink-muted">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>
                          {currentQuote.customConfig?.noDepositTiming === 'upfront' ||
                          currentQuote.customConfig?.depositOption === 'upfront' ||
                          currentQuote.customConfig?.depositOption === 'full_upfront'
                            ? `Pago 100% anticipado: El cliente abona el valor completo (${pricingResult.formatted.initialTotal}) por adelantado al inicio. No quedan saldos pendientes al entregar.`
                            : `Pago 100% contraentrega: Sin anticipo. El valor completo (${pricingResult.formatted.initialTotal}) se cancelará una vez finalizada y entregada la solución acordada.`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 6. Condiciones especiales opcionales */}
                <Input
                  label="Condiciones especiales de entrega o pago (opcional)"
                  placeholder="Ej: Traspaso de accesos tras validación, soporte por 30 días posteriores..."
                  value={currentQuote.customConfig?.deliveryConditions || ''}
                  onChange={(e) => updateCustomConfig({ deliveryConditions: e.target.value })}
                  helperText="Reemplazará las cláusulas por defecto de plazos en el documento PDF."
                />
              </div>
            ) : (
              /* MODO ESTÁNDAR (Planes Web de Catálogo) */
              <div className="space-y-5">
                {/* Tipo de proyecto */}
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">
                    Modalidad del Servicio
                  </span>
                  <SegmentedControl
                    options={[
                      { value: 'construccion', label: 'Construcción y mantención' },
                      { value: 'venta', label: 'Venta con código fuente' },
                    ]}
                    value={currentQuote.projectType}
                    onChange={(val) => updateField('projectType', val as ProjectType)}
                  />
                  <p className="mt-1.5 text-xs text-ink-muted">
                    {currentQuote.projectType === 'construccion'
                      ? 'Construcción completa con opción de suscripción mensual de mantenimiento y hosting.'
                      : 'Venta de la solución completa con entrega y cesión del código fuente sin suscripciones recurrentes.'}
                  </p>
                </div>

                {/* Selección de Plan y Páginas Extra */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-hairline/60">
                  <Select
                    label="Plan del Catálogo"
                    options={[
                      ...currentQuote.catalog.plans.map((p) => {
                        const rawPrice =
                          currentQuote.projectType === 'venta' ? p.sale.price : p.build.price;
                        const priceLabel =
                          currentQuote.currency === 'USD' && currentQuote.exchangeRate && currentQuote.exchangeRate > 0
                            ? `US$${(rawPrice / currentQuote.exchangeRate).toFixed(2)}`
                            : `$${rawPrice.toLocaleString('es-CL')} CLP`;

                        return {
                          value: p.id,
                          label: `${p.name} (${p.pages} pág.) · ${priceLabel}`,
                        };
                      }),
                      {
                        value: '__custom__',
                        label: '✨ Crear Presupuesto Personalizado...',
                      },
                    ]}
                    value={currentQuote.planId}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        updateField('quoteMode', 'custom');
                        if (!currentQuote.customConfig) {
                          updateCustomConfig({
                            itemName: '',
                            description: '',
                            price: 250000,
                            isOneTimePayment: true,
                            paymentType: 'unique',
                            requiresDeposit: true,
                            depositOption: 'percent',
                            depositPercent: 50,
                            deliveryDays: currentQuote.catalog.deliveryBusinessDays || 10,
                          });
                        }
                      } else {
                        updateField('planId', e.target.value);
                      }
                    }}
                  />

                  <div className="flex flex-col">
                    <NumberStepper
                      label="Páginas adicionales"
                      min={0}
                      max={50}
                      value={currentQuote.extraPages}
                      onChange={(val) => updateField('extraPages', val)}
                    />
                    <p className="mt-1 text-xs text-ink-muted">
                      +{currentQuote.catalog.extraPagePrice.toLocaleString('es-CL')} CLP c/u
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Tarjeta 3: Servicios Recurrentes (solo construcción en modo catálogo) */}
          {currentQuote.quoteMode !== 'custom' && currentQuote.projectType === 'construccion' && (
            <Card className="p-5 sm:p-6 space-y-4">
              <h2 className="font-serif text-base font-semibold text-navy-900 border-b border-hairline pb-2 flex items-center justify-between">
                <span>Servicios Recurrentes Mensuales</span>
                <Badge variant="navy" size="sm">
                  Construcción
                </Badge>
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="Plan de Suscripción"
                  options={currentQuote.catalog.subscriptions.map((s) => {
                    const priceLabel =
                      s.price === 0
                        ? 'Sin suscripción'
                        : currentQuote.currency === 'USD' && currentQuote.exchangeRate && currentQuote.exchangeRate > 0
                        ? `US$${(s.price / currentQuote.exchangeRate).toFixed(2)}/mes`
                        : `$${s.price.toLocaleString('es-CL')} CLP/mes`;

                    return {
                      value: s.id,
                      label: `${s.name} (${priceLabel})`,
                    };
                  })}
                  value={currentQuote.subscriptionId}
                  onChange={(e) => updateField('subscriptionId', e.target.value)}
                />

                <div className="flex flex-col justify-center gap-1.5 rounded-lg border border-hairline bg-paper-1 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-navy-900">Hosting y Servidor</p>
                      <p className="text-xs text-ink-muted">
                        Infraestructura en la nube (
                        {currentQuote.currency === 'USD' && currentQuote.exchangeRate && currentQuote.exchangeRate > 0
                          ? `US$${(currentQuote.catalog.hosting.monthlyPrice / currentQuote.exchangeRate).toFixed(2)}`
                          : `$${currentQuote.catalog.hosting.monthlyPrice.toLocaleString('es-CL')} CLP`}
                        /mes)
                      </p>
                    </div>
                    <Switch
                      checked={currentQuote.hosting}
                      onCheckedChange={(checked) => updateField('hosting', checked)}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Tarjeta 4: Resumen Financiero en Vivo */}
          <Card className="p-5 sm:p-6 bg-navy-900 text-white rounded-xl shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-brass" />
                <h3 className="font-serif text-lg font-semibold text-white">Resumen de Inversión</h3>
              </div>
              <span className="text-xs font-mono tracking-wider text-brass uppercase">
                {currentQuote.currency}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="flex flex-col">
                <span className="text-xs text-white/70">
                  {currentQuote.quoteMode === 'custom'
                    ? currentQuote.customConfig?.isOneTimePayment
                      ? 'Total Inversión'
                      : 'Total Inicial'
                    : 'Total Inicial'}
                </span>
                <span className="text-lg sm:text-xl font-bold font-sans text-white">
                  {pricingResult.formatted.initialTotal}
                </span>
                <span className="text-[11px] text-white/50 truncate max-w-[140px]">
                  {currentQuote.quoteMode === 'custom'
                    ? currentQuote.customConfig?.itemName || 'Servicio a medida'
                    : 'Plan + Páginas extra'}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-white/70">
                  {currentQuote.quoteMode === 'custom'
                    ? currentQuote.customConfig?.requiresDeposit
                      ? `Abono Inicial (${currentQuote.customConfig?.depositPercent ?? 50}%)`
                      : currentQuote.customConfig?.noDepositTiming === 'upfront' ||
                        currentQuote.customConfig?.depositOption === 'upfront' ||
                        currentQuote.customConfig?.depositOption === 'full_upfront'
                      ? 'Pago Anticipado (100%)'
                      : 'Abono Inicial (0%)'
                    : `Abono Inicial (${currentQuote.catalog.depositPercent}%)`}
                </span>
                <span className="text-lg sm:text-xl font-bold font-sans text-brass">
                  {pricingResult.formatted.deposit}
                </span>
                <span className="text-[11px] text-white/50">
                  {currentQuote.quoteMode === 'custom' && !currentQuote.customConfig?.requiresDeposit
                    ? currentQuote.customConfig?.noDepositTiming === 'upfront' ||
                      currentQuote.customConfig?.depositOption === 'upfront' ||
                      currentQuote.customConfig?.depositOption === 'full_upfront'
                      ? '100% por adelantado'
                      : 'Sin anticipo'
                    : 'Para inicio de obras'}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-white/70">
                  {currentQuote.quoteMode === 'custom' && !currentQuote.customConfig?.requiresDeposit
                    ? currentQuote.customConfig?.noDepositTiming === 'upfront' ||
                      currentQuote.customConfig?.depositOption === 'upfront' ||
                      currentQuote.customConfig?.depositOption === 'full_upfront'
                      ? 'Saldo al Finalizar'
                      : 'Total Contraentrega'
                    : 'Saldo Contraentrega'}
                </span>
                <span className="text-lg sm:text-xl font-bold font-sans text-white">
                  {pricingResult.formatted.balance}
                </span>
                <span className="text-[11px] text-white/50">
                  {currentQuote.quoteMode === 'custom'
                    ? currentQuote.customConfig?.requiresDeposit
                      ? 'Al entregar solución'
                      : currentQuote.customConfig?.noDepositTiming === 'upfront' ||
                        currentQuote.customConfig?.depositOption === 'upfront' ||
                        currentQuote.customConfig?.depositOption === 'full_upfront'
                      ? 'Sin saldo pendiente'
                      : '100% contraentrega'
                    : '50% + 1.er mes (si aplica)'}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-white/70">
                  {currentQuote.quoteMode === 'custom'
                    ? currentQuote.customConfig?.paymentType === 'recurring'
                      ? 'Tarifa Recurrente'
                      : currentQuote.customConfig?.paymentType === 'installments'
                      ? 'Valor Cuota'
                      : 'Cobro Periódico'
                    : 'Mensualidad'}
                </span>
                <span className="text-lg sm:text-xl font-bold font-sans text-white/90">
                  {currentQuote.quoteMode === 'custom'
                    ? currentQuote.customConfig?.isOneTimePayment
                      ? '—'
                      : pricingResult.formatted.monthlyTotal
                    : currentQuote.projectType === 'construccion'
                    ? pricingResult.formatted.monthlyTotal
                    : '—'}
                </span>
                <span className="text-[11px] text-white/50">
                  {currentQuote.quoteMode === 'custom'
                    ? currentQuote.customConfig?.isOneTimePayment
                      ? 'Pago único'
                      : currentQuote.customConfig?.paymentType === 'recurring'
                      ? (currentQuote.customConfig.billingPeriod === 'yearly' ? 'Cobro anual' : 'Cobro mensual')
                      : `${currentQuote.customConfig?.installmentsCount || 2} cuotas`
                    : currentQuote.projectType === 'construccion'
                    ? 'Mantención + Hosting'
                    : 'Venta única'}
                </span>
              </div>
            </div>

            {currentQuote.currency === 'USD' && currentQuote.exchangeRate && (
              <div className="pt-2 border-t border-white/10 text-xs text-white/60 flex items-center justify-between">
                <span>Tipo de cambio aplicado: 1 USD = ${currentQuote.exchangeRate.toLocaleString('es-CL')} CLP</span>
                <span>
                  Plazo:{' '}
                  {currentQuote.quoteMode === 'custom'
                    ? currentQuote.customConfig?.deliveryDays || currentQuote.catalog.deliveryBusinessDays
                    : currentQuote.catalog.deliveryBusinessDays}{' '}
                  días hábiles
                </span>
              </div>
            )}
          </Card>
        </div>

        {/* Columna Derecha: Vista Previa Real en Vivo del PDF (5 columnas, sticky) */}
        <div className="flex flex-col gap-3 lg:col-span-5 lg:sticky lg:top-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-navy-900 uppercase tracking-wider">
              <ExternalLink className="h-3.5 w-3.5 text-brass" />
              <span>Vista Previa PDF Vectorial</span>
            </div>
            <span className="text-xs text-ink-muted">A4 · @react-pdf/renderer</span>
          </div>

          <Card className="overflow-hidden border-hairline bg-paper-2 p-2 sm:p-4 shadow-inner max-h-[85vh] overflow-y-auto">
            <PdfPreview
              quote={currentQuote}
              skeletonDesign={(currentQuote.includeSkeletonInPdf && currentQuote.linkedSkeletonId) ? skeletons.find(s => s.id === currentQuote.linkedSkeletonId) : undefined}
              onBlobReady={(blob) => setPdfBlob(blob)}
            />
          </Card>
        </div>
      </div>

      {/* Diálogo de Confirmación para Eliminar */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="¿Eliminar presupuesto?"
        description={`Esta acción eliminará la propuesta para "${currentQuote.client}". Dispondrás de 8 segundos para deshacer esta acción.`}
        confirmLabel="Eliminar Presupuesto"
        variant="danger"
        onConfirm={handleDelete}
      />

      {/* Diálogo para Crear Nueva Revisión */}
      {showRevisionDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/40 backdrop-blur-xs p-4 animate-in fade-in">
          <Card className="w-full max-w-md p-6 bg-white shadow-xl space-y-4">
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-bold text-navy-900">Crear Nueva Revisión</h3>
              <p className="text-xs text-ink-muted">
                Se generará una copia de este presupuesto clasificada como revisión, preservando el original intacto.
              </p>
            </div>

            <Input
              label="Detalle o motivo de la revisión *"
              placeholder="Ej: Incorporación de catálogo interactivo y pasarela"
              maxLength={120}
              value={newRevisionNote}
              onChange={(e) => setNewRevisionNote(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowRevisionDialog(false);
                  setNewRevisionNote('');
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateRevision}
                disabled={!newRevisionNote.trim()}
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

export default QuoteEditorPage;
