import React, { useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { useQuotesStore } from '../../store/quotesStore';
import {
  Button,
  Input,
  Textarea,
  Card,
  SectionHeader,
  ConfirmDialog,
  toast,
} from '../../ui';
import { Plus, Trash2, Edit3 } from 'lucide-react';
import type { PlanDef, SubscriptionDef } from '../../domain/types';

export const CatalogTab: React.FC = () => {
  const { catalog, updateCatalog } = useSettingsStore();
  const { quotes } = useQuotesStore();

  // Estados de edición de plan
  const [editingPlan, setEditingPlan] = useState<PlanDef | null>(null);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  // Estados de edición de suscripción
  const [editingSub, setEditingSub] = useState<SubscriptionDef | null>(null);
  const [subToDelete, setSubToDelete] = useState<string | null>(null);

  // Parámetros generales
  const [extraPagePrice, setExtraPagePrice] = useState(catalog.extraPagePrice);
  const [hostingPrice, setHostingPrice] = useState(catalog.hosting.monthlyPrice);
  const [depositPercent, setDepositPercent] = useState(catalog.depositPercent);
  const [deliveryDays, setDeliveryDays] = useState(catalog.deliveryBusinessDays);

  React.useEffect(() => {
    setExtraPagePrice(catalog.extraPagePrice);
    setHostingPrice(catalog.hosting.monthlyPrice);
    setDepositPercent(catalog.depositPercent);
    setDeliveryDays(catalog.deliveryBusinessDays);
  }, [
    catalog.extraPagePrice,
    catalog.hosting.monthlyPrice,
    catalog.depositPercent,
    catalog.deliveryBusinessDays,
  ]);

  const handleSaveGeneral = async () => {
    await updateCatalog({
      ...catalog,
      extraPagePrice: Number(extraPagePrice) || 0,
      hosting: { ...catalog.hosting, monthlyPrice: Number(hostingPrice) || 0 },
      depositPercent: Number(depositPercent) || 0,
      deliveryBusinessDays: Number(deliveryDays) || 1,
    });
    toast.success('Parámetros comerciales guardados');
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return false;
    if (!editingPlan.id || !editingPlan.name.trim()) {
      toast.error('Nombre e ID son obligatorios');
      return false;
    }

    const plans = [...catalog.plans];
    const index = plans.findIndex((p) => p.id === editingPlan.id);
    if (index >= 0) {
      plans[index] = editingPlan;
    } else {
      plans.push(editingPlan);
    }

    await updateCatalog({ ...catalog, plans });
    setEditingPlan(null);
    toast.success('Plan guardado exitosamente');
    return true;
  };

  const handleDeletePlan = async (id: string) => {
    if (catalog.plans.length <= 1) {
      toast.error('Debe existir al menos un plan');
      return;
    }
    const filtered = catalog.plans.filter((p) => p.id !== id);
    await updateCatalog({ ...catalog, plans: filtered });
    setPlanToDelete(null);
    toast.success('Plan eliminado del catálogo');
  };

  const handleSaveSub = async () => {
    if (!editingSub) return false;
    if (!editingSub.id || !editingSub.name.trim()) {
      toast.error('Nombre e ID son obligatorios');
      return false;
    }
    const subs = [...catalog.subscriptions];
    const index = subs.findIndex((s) => s.id === editingSub.id);
    if (index >= 0) {
      subs[index] = editingSub;
    } else {
      subs.push(editingSub);
    }

    await updateCatalog({ ...catalog, subscriptions: subs });
    setEditingSub(null);
    toast.success('Suscripción guardada');
    return true;
  };

  const handleDeleteSub = async (id: string) => {
    if (id === 'none') {
      toast.error('La opción "none" (Ninguno) no se puede eliminar');
      return;
    }
    const filtered = catalog.subscriptions.filter((s) => s.id !== id);
    await updateCatalog({ ...catalog, subscriptions: filtered });
    setSubToDelete(null);
    toast.success('Suscripción eliminada');
  };

  const isPlanUsedInHistory = (planId: string) => {
    return quotes.some((q) => q.planId === planId);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Planes */}
      <section className="flex flex-col gap-4">
        <SectionHeader
          eyebrow="Estructura Comercial"
          title="Planes de Desarrollo"
          description="Valores base para construcción y venta con código fuente."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setEditingPlan({
                  id: `plan_${Date.now()}`,
                  name: 'Nuevo Plan',
                  pages: 1,
                  build: { price: 100000, desc: '1 página' },
                  sale: { price: 150000, desc: '1 página + código' },
                })
              }
            >
              <Plus className="mr-1.5 h-4 w-4" />
              <span>Agregar Plan</span>
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.plans.map((p) => {
            return (
              <Card key={p.id} className="flex flex-col justify-between p-5">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs text-ink-muted uppercase">
                        ID: {p.id}
                      </span>
                      <h3 className="font-serif text-lg font-semibold text-navy-900">
                        {p.name}
                      </h3>
                      <p className="text-xs text-ink-muted">
                        Páginas incluidas: <strong>{p.pages}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-hairline pt-3 text-xs">
                    <div>
                      <span className="font-semibold text-navy-700">Construcción:</span>{' '}
                      ${p.build.price.toLocaleString('es-CL')} CLP
                      <p className="text-ink-muted">{p.build.desc}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-navy-700">Venta:</span>{' '}
                      ${p.sale.price.toLocaleString('es-CL')} CLP
                      <p className="text-ink-muted">{p.sale.desc}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2 border-t border-hairline pt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditingPlan({ ...p })}
                  >
                    <Edit3 className="mr-1 h-3.5 w-3.5" />
                    <span>Editar</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPlanToDelete(p.id)}
                    className="text-danger hover:bg-red-50 hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 2. Suscripciones Mensuales */}
      <section className="flex flex-col gap-4">
        <SectionHeader
          eyebrow="Mantención Web"
          title="Suscripciones Mensuales"
          description="Planes de soporte recurrente para clientes en modalidad construcción."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setEditingSub({
                  id: `sub_${Date.now()}`,
                  name: 'Nuevo Nivel',
                  price: 30000,
                  desc: 'Descripción del soporte',
                })
              }
            >
              <Plus className="mr-1.5 h-4 w-4" />
              <span>Agregar Suscripción</span>
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {catalog.subscriptions.map((s) => (
            <Card key={s.id} className="flex flex-col justify-between p-4">
              <div>
                <span className="font-mono text-xs text-ink-muted uppercase">
                  ID: {s.id}
                </span>
                <h4 className="font-serif text-base font-semibold text-navy-900">
                  {s.name}
                </h4>
                <p className="mt-1 font-mono text-sm font-semibold text-navy-700">
                  ${s.price.toLocaleString('es-CL')} CLP/mes
                </p>
                <p className="mt-2 text-xs text-ink-muted leading-relaxed">
                  {s.desc}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-hairline pt-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingSub({ ...s })}
                >
                  <Edit3 className="mr-1 h-3.5 w-3.5" />
                  <span>Editar</span>
                </Button>
                {s.id !== 'none' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSubToDelete(s.id)}
                    className="text-danger hover:bg-red-50 hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 3. Parámetros Globales */}
      <section className="flex flex-col gap-4">
        <SectionHeader
          eyebrow="Tarifas & Plazos"
          title="Parámetros Comerciales"
          description="Precios de extras, alojamiento y políticas de pago."
        />

        <Card className="p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Página Adicional (CLP)"
              type="number"
              min={0}
              value={extraPagePrice === 0 ? '' : extraPagePrice}
              onChange={(e) => setExtraPagePrice(e.target.value === '' ? 0 : Number(e.target.value))}
            />
            <Input
              label="Hosting Mensual (CLP)"
              type="number"
              min={0}
              value={hostingPrice === 0 ? '' : hostingPrice}
              onChange={(e) => setHostingPrice(e.target.value === '' ? 0 : Number(e.target.value))}
            />
            <Input
              label="Abono Inicial (%)"
              type="number"
              min={0}
              max={100}
              value={depositPercent === 0 ? '' : depositPercent}
              onChange={(e) => setDepositPercent(e.target.value === '' ? 0 : Number(e.target.value))}
            />
            <Input
              label="Plazo Promedio (Días hábiles)"
              type="number"
              min={1}
              value={deliveryDays === 0 ? '' : deliveryDays}
              onChange={(e) => setDeliveryDays(e.target.value === '' ? 0 : Number(e.target.value))}
            />
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="primary" onClick={handleSaveGeneral}>
              Guardar Parámetros
            </Button>
          </div>
        </Card>
      </section>

      {/* Diálogo Editar Plan */}
      {editingPlan && (
        <ConfirmDialog
          open={Boolean(editingPlan)}
          onOpenChange={(open) => !open && setEditingPlan(null)}
          title="Editar Plan de Desarrollo"
          description="Modifica los precios y descripciones para cotizaciones futuras."
          confirmLabel="Guardar Cambios"
          variant="primary"
          onConfirm={handleSavePlan}
        >
          <div className="flex flex-col gap-4 py-2">
            <div className="flex items-center justify-between rounded bg-paper-2 px-3 py-1.5 text-xs text-ink-muted">
              <span>Identificador:</span>
              <span className="font-mono font-semibold text-navy-900">{editingPlan.id}</span>
            </div>
            <Input
              label="Nombre del Plan"
              value={editingPlan.name}
              onChange={(e) =>
                setEditingPlan({ ...editingPlan, name: e.target.value })
              }
            />
            <Input
              label="Páginas Incluidas"
              type="number"
              min={1}
              value={editingPlan.pages === 0 ? '' : editingPlan.pages}
              onChange={(e) =>
                setEditingPlan({ ...editingPlan, pages: e.target.value === '' ? 0 : Number(e.target.value) })
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Precio Construcción (CLP)"
                type="number"
                min={0}
                value={editingPlan.build.price === 0 ? '' : editingPlan.build.price}
                onChange={(e) =>
                  setEditingPlan({
                    ...editingPlan,
                    build: { ...editingPlan.build, price: e.target.value === '' ? 0 : Number(e.target.value) },
                  })
                }
              />
              <Input
                label="Precio Venta (CLP)"
                type="number"
                min={0}
                value={editingPlan.sale.price === 0 ? '' : editingPlan.sale.price}
                onChange={(e) =>
                  setEditingPlan({
                    ...editingPlan,
                    sale: { ...editingPlan.sale, price: e.target.value === '' ? 0 : Number(e.target.value) },
                  })
                }
              />
            </div>
            <Textarea
              label="Descripción Construcción"
              rows={2}
              value={editingPlan.build.desc}
              onChange={(e) =>
                setEditingPlan({
                  ...editingPlan,
                  build: { ...editingPlan.build, desc: e.target.value },
                })
              }
            />
            <Textarea
              label="Descripción Venta"
              rows={2}
              value={editingPlan.sale.desc}
              onChange={(e) =>
                setEditingPlan({
                  ...editingPlan,
                  sale: { ...editingPlan.sale, desc: e.target.value },
                })
              }
            />
          </div>
        </ConfirmDialog>
      )}

      {/* Diálogo Editar Suscripción */}
      {editingSub && (
        <ConfirmDialog
          open={Boolean(editingSub)}
          onOpenChange={(open) => !open && setEditingSub(null)}
          title="Editar Nivel de Suscripción"
          description="Configura el nombre, precio y alcance del soporte mensual."
          confirmLabel="Guardar Cambios"
          variant="primary"
          onConfirm={handleSaveSub}
        >
          <div className="flex flex-col gap-4 py-2">
            <div className="flex items-center justify-between rounded bg-paper-2 px-3 py-1.5 text-xs text-ink-muted">
              <span>Identificador:</span>
              <span className="font-mono font-semibold text-navy-900">{editingSub.id}</span>
            </div>
            <Input
              label="Nombre de la Suscripción"
              value={editingSub.name}
              onChange={(e) =>
                setEditingSub({ ...editingSub, name: e.target.value })
              }
            />
            <Input
              label="Precio Mensual (CLP)"
              type="number"
              min={0}
              value={editingSub.price === 0 ? '' : editingSub.price}
              disabled={editingSub.id === 'none'}
              onChange={(e) =>
                setEditingSub({ ...editingSub, price: e.target.value === '' ? 0 : Number(e.target.value) })
              }
            />
            <Textarea
              label="Descripción del Soporte"
              rows={2}
              value={editingSub.desc}
              onChange={(e) =>
                setEditingSub({ ...editingSub, desc: e.target.value })
              }
            />
          </div>
        </ConfirmDialog>
      )}

      {/* Diálogo Confirmar Eliminar Plan */}
      <ConfirmDialog
        open={Boolean(planToDelete)}
        onOpenChange={(open) => !open && setPlanToDelete(null)}
        title="¿Eliminar este plan del catálogo?"
        description={
          planToDelete && isPlanUsedInHistory(planToDelete)
            ? '⚠️ Advertencia: Este plan está en uso por presupuestos guardados en el Historial. Sus datos congelados no se alterarán, pero no podrás volver a cotizarlo.'
            : 'Esta acción removerá el plan para nuevos presupuestos.'
        }
        confirmLabel="Eliminar Plan"
        variant="danger"
        onConfirm={() => {
          if (planToDelete) handleDeletePlan(planToDelete);
        }}
      />

      {/* Diálogo Confirmar Eliminar Suscripción */}
      <ConfirmDialog
        open={Boolean(subToDelete)}
        onOpenChange={(open) => !open && setSubToDelete(null)}
        title="¿Eliminar esta suscripción?"
        description="Esta acción eliminará el nivel de suscripción del catálogo vigente."
        confirmLabel="Eliminar Suscripción"
        variant="danger"
        onConfirm={() => {
          if (subToDelete) handleDeleteSub(subToDelete);
        }}
      />
    </div>
  );
};
