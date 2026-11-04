import type { Quote } from './types';
import { formatCurrency, type PricingResult } from './pricing';

/**
 * Esquema de pagos legible para el cliente, derivado de la cotización y su cálculo.
 * Se usa en la página 2 del PDF ("Resumen de la cotización") para mostrar con
 * claridad el total y el monto de cada pago/cuota.
 */
export interface PaymentStep {
  /** Ej: "Pago 1 · Abono inicial" o "Cuota 2 de 3" */
  title: string;
  /** Momento en que se paga. Ej: "Al aceptar la propuesta" */
  when: string;
  /** Monto formateado con moneda */
  amount: string;
  /** Porcentaje del total, si aplica. Ej: "50%" */
  percentLabel?: string | undefined;
  /** Desglose del monto, si combina varios conceptos */
  breakdown?: string | undefined;
  /** Marca el pago que inicia el trabajo (abono) */
  isDeposit?: boolean | undefined;
}

export interface RecurringCharge {
  label: string;
  amount: string;
  periodLabel: string; // "/ mes" o "/ año"
  detail: string;
}

export interface PaymentPlan {
  totalLabel: string;
  totalAmount: string;
  totalSuffix?: string | undefined; // Ej: "/ mes" para servicios recurrentes
  totalCaption: string;
  steps: PaymentStep[];
  recurring?: RecurringCharge | undefined;
}

function isCustomUpfront(quote: Quote): boolean {
  const c = quote.customConfig;
  if (!c || c.requiresDeposit) return false;
  return (
    c.noDepositTiming === 'upfront' ||
    c.depositOption === 'upfront' ||
    c.depositOption === 'full_upfront'
  );
}

function pct(part: number, total: number): string {
  if (total <= 0) return '0%';
  return `${Math.round((part / total) * 100)}%`;
}

export function buildPaymentPlan(quote: Quote, pricing: PricingResult): PaymentPlan {
  const fmt = (n: number) => formatCurrency(n, pricing.currency);
  const custom = quote.quoteMode === 'custom' ? quote.customConfig : undefined;

  // ---------------------------------------------------------------------------
  // Presupuesto personalizado
  // ---------------------------------------------------------------------------
  if (custom) {
    const upfront = isCustomUpfront(quote);
    const isUnique = custom.isOneTimePayment || custom.paymentType === 'unique' || !custom.paymentType;

    if (isUnique) {
      const total = pricing.initialTotal;
      if (custom.requiresDeposit && pricing.deposit > 0 && pricing.balance > 0) {
        return {
          totalLabel: 'Valor total del servicio',
          totalAmount: fmt(total),
          totalCaption: `Se paga en 2 partes: ${pct(pricing.deposit, total)} para iniciar y ${pct(pricing.balance, total)} contra entrega.`,
          steps: [
            {
              title: 'Pago 1 · Abono inicial',
              when: 'Al aceptar la propuesta, para iniciar el trabajo',
              amount: fmt(pricing.deposit),
              percentLabel: pct(pricing.deposit, total),
              isDeposit: true,
            },
            {
              title: 'Pago 2 · Saldo final',
              when: 'Contra entrega, con el trabajo terminado y aprobado',
              amount: fmt(pricing.balance),
              percentLabel: pct(pricing.balance, total),
            },
          ],
        };
      }

      return {
        totalLabel: 'Valor total del servicio',
        totalAmount: fmt(total),
        totalCaption: upfront
          ? 'Pago único del 100% por adelantado. Sin saldos pendientes.'
          : 'Pago único del 100% contra entrega. No requiere abono previo.',
        steps: [
          {
            title: upfront ? 'Pago único · 100% anticipado' : 'Pago único · 100% contra entrega',
            when: upfront
              ? 'Al aceptar la propuesta, antes de iniciar el trabajo'
              : 'Al entregar el trabajo terminado y aprobado',
            amount: fmt(total),
            percentLabel: '100%',
            isDeposit: upfront,
          },
        ],
      };
    }

    if (custom.paymentType === 'recurring') {
      const yearly = custom.billingPeriod === 'yearly';
      const periodLabel = yearly ? '/ año' : '/ mes';
      const periodWord = yearly ? 'año' : 'mes';
      const fee = pricing.monthlyTotal;
      const steps: PaymentStep[] = [];

      if (custom.requiresDeposit && pricing.deposit > 0 && pricing.deposit < fee) {
        steps.push(
          {
            title: 'Pago 1 · Abono inicial',
            when: 'Al aceptar la propuesta, para activar el servicio',
            amount: fmt(pricing.deposit),
            percentLabel: `${pct(pricing.deposit, fee)} del 1er ${periodWord}`,
            isDeposit: true,
          },
          {
            title: `Pago 2 · Saldo del primer ${periodWord}`,
            when: 'Contra entrega / al iniciar el servicio',
            amount: fmt(fee - pricing.deposit),
            percentLabel: pct(fee - pricing.deposit, fee),
          }
        );
      } else {
        steps.push({
          title: `Primer cobro (${yearly ? 'año' : 'mes'} 1)`,
          when: upfront || custom.requiresDeposit
            ? 'Al aceptar la propuesta, antes de iniciar el servicio'
            : 'Al iniciar el servicio',
          amount: fmt(fee),
          isDeposit: upfront || custom.requiresDeposit,
        });
      }

      return {
        totalLabel: 'Valor del servicio',
        totalAmount: fmt(fee),
        totalSuffix: periodLabel,
        totalCaption: `Servicio recurrente con cobro ${yearly ? 'anual' : 'mensual'}.`,
        steps,
        recurring: {
          label: `Luego, cada ${periodWord}`,
          amount: fmt(fee),
          periodLabel,
          detail: `Cobro ${yearly ? 'anual' : 'mensual'} mientras el servicio esté activo.`,
        },
      };
    }

    // Cuotas
    const count = Math.max(2, custom.installmentsCount || 2);
    const total = pricing.initialTotal;
    const cuota = pricing.monthlyTotal;
    const lastCuota = total - cuota * (count - 1);
    const steps: PaymentStep[] = [];
    for (let i = 1; i <= count; i++) {
      const amount = i === count ? lastCuota : cuota;
      let when: string;
      if (i === 1) {
        when = custom.requiresDeposit || upfront
          ? 'Al aceptar la propuesta (abono para iniciar)'
          : 'Primera cuota, según calendario acordado';
      } else if (i === count) {
        when = 'Última cuota, según calendario acordado';
      } else {
        when = 'Según calendario acordado';
      }
      steps.push({
        title: `Cuota ${i} de ${count}`,
        when,
        amount: fmt(amount),
        isDeposit: i === 1 && (custom.requiresDeposit || upfront),
      });
    }

    return {
      totalLabel: 'Valor total del servicio',
      totalAmount: fmt(total),
      totalCaption:
        lastCuota === cuota
          ? `Se paga en ${count} cuotas iguales de ${fmt(cuota)}.`
          : `Se paga en ${count} cuotas: ${count - 1} de ${fmt(cuota)} y una última de ${fmt(lastCuota)}.`,
      steps,
    };
  }

  // ---------------------------------------------------------------------------
  // Plan estándar (catálogo web)
  // ---------------------------------------------------------------------------
  const isBuild = quote.projectType === 'construccion';
  const total = pricing.initialTotal;
  const monthly = isBuild ? pricing.monthlyTotal : 0;
  const steps: PaymentStep[] = [];

  const deliveryWhen = isBuild
    ? 'Al entregar el sitio terminado, antes de publicarlo'
    : 'Al entregar el sitio, junto al traspaso del código fuente';

  if (pricing.deposit > 0) {
    steps.push({
      title: 'Pago 1 · Abono inicial',
      when: 'Al aceptar la propuesta, para iniciar el desarrollo',
      amount: fmt(pricing.deposit),
      percentLabel: pct(pricing.deposit, total),
      isDeposit: true,
    });
  }

  if (pricing.remainingDeposit > 0 || monthly > 0) {
    const n = steps.length + 1;
    const includesFirstMonth = monthly > 0;
    steps.push({
      title: `Pago ${n} · ${pricing.remainingDeposit > 0 ? 'Saldo contra entrega' : 'Primer mes de mantención'}`,
      when: deliveryWhen,
      amount: fmt(pricing.remainingDeposit + monthly),
      percentLabel:
        pricing.remainingDeposit > 0
          ? `${pct(pricing.remainingDeposit, total)}${includesFirstMonth ? ' + 1er mes' : ''}`
          : undefined,
      breakdown:
        includesFirstMonth && pricing.remainingDeposit > 0
          ? `${fmt(pricing.remainingDeposit)} saldo del desarrollo + ${fmt(monthly)} primer mes de mantención`
          : undefined,
    });
  }

  let caption: string;
  if (pricing.deposit > 0 && pricing.remainingDeposit > 0) {
    caption = `Pago único por el desarrollo, dividido en ${pct(pricing.deposit, total)} para iniciar y ${pct(pricing.remainingDeposit, total)} contra entrega.`;
  } else if (pricing.deposit > 0) {
    caption = 'Pago único del 100% por adelantado.';
  } else {
    caption = 'Pago único del 100% contra entrega.';
  }

  let recurring: RecurringCharge | undefined;
  if (monthly > 0) {
    const sub = quote.catalog.subscriptions.find((s) => s.id === quote.subscriptionId);
    const parts: string[] = [];
    if (pricing.subscriptionAmount > 0 && sub) parts.push(`Mantención ${sub.name} ${fmt(pricing.subscriptionAmount)}`);
    if (pricing.hostingAmount > 0) parts.push(`Hosting ${fmt(pricing.hostingAmount)}`);
    recurring = {
      label: 'Mensualidad desde el 2º mes',
      amount: fmt(monthly),
      periodLabel: '/ mes',
      detail: parts.join(' + '),
    };
  }

  return {
    totalLabel: 'Valor total del desarrollo',
    totalAmount: fmt(total),
    totalCaption: caption,
    steps,
    recurring,
  };
}

/**
 * Determina si el PDF debe incluir el anexo "Presentación de servicios".
 * Por defecto: sí para planes estándar del catálogo web, no para presupuestos personalizados.
 */
export function shouldIncludeServices(quote: Pick<Quote, 'includeServicesInPdf' | 'quoteMode'>): boolean {
  if (typeof quote.includeServicesInPdf === 'boolean') return quote.includeServicesInPdf;
  return quote.quoteMode !== 'custom';
}
