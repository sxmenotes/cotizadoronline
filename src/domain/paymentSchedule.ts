import type { Quote } from './types';
import { formatCurrency, type PricingResult } from './pricing';

/**
 * Esquema de pagos legible para el cliente, derivado de la cotización y su cálculo.
 * Se usa en la página 2 del PDF ("Resumen de la cotización") para mostrar con
 * claridad el total a gastar por el cliente y el monto de cada pago/cuota.
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
  /** Desglose explícito de qué cubre este pago */
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
  /** Etiqueta de la suma total a desembolsar en los pagos iniciales/cuotas */
  summaryTotalLabel: string;
  /** Monto total que suman los pasos de pago (igual a initialTotal, o initialTotal + 1er mes si aplica) */
  summaryTotalAmount: string;
  /** Fórmula explícita para que el cliente vea cómo suman los pagos */
  summaryFormula: string;
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
        const depPct = pct(pricing.deposit, total);
        const balPct = pct(pricing.balance, total);
        return {
          totalLabel: 'Total a pagar por el servicio',
          totalAmount: fmt(total),
          totalCaption: `Se divide en 2 pagos: ${depPct} (${fmt(pricing.deposit)}) para iniciar y ${balPct} (${fmt(pricing.balance)}) contra entrega.`,
          summaryTotalLabel: 'Total a pagar por el cliente (Pago 1 + Pago 2)',
          summaryTotalAmount: fmt(total),
          summaryFormula: `Pago 1 (${fmt(pricing.deposit)}) + Pago 2 (${fmt(pricing.balance)}) = ${fmt(total)}`,
          steps: [
            {
              title: 'Pago 1 · Abono inicial',
              when: 'Al aceptar la propuesta, para iniciar el trabajo',
              amount: fmt(pricing.deposit),
              percentLabel: `${depPct} · Para iniciar`,
              breakdown: `Cubre el ${depPct} inicial del total (${fmt(total)})`,
              isDeposit: true,
            },
            {
              title: 'Pago 2 · Saldo final',
              when: 'Contra entrega, con el trabajo terminado y aprobado',
              amount: fmt(pricing.balance),
              percentLabel: `${balPct} · Al finalizar`,
              breakdown: `Cubre el ${balPct} restante para completar el total`,
            },
          ],
        };
      }

      return {
        totalLabel: 'Total a pagar por el servicio',
        totalAmount: fmt(total),
        totalCaption: upfront
          ? 'Pago único del 100% por adelantado. Sin saldos ni cobros posteriores.'
          : 'Pago único del 100% contra entrega. No requiere abono previo.',
        summaryTotalLabel: 'Total único a pagar por el cliente',
        summaryTotalAmount: fmt(total),
        summaryFormula: upfront
          ? `1 pago anticipado del 100% = ${fmt(total)} (sin saldos pendientes)`
          : `1 pago contra entrega del 100% = ${fmt(total)} (sin abono inicial)`,
        steps: [
          {
            title: upfront ? 'Pago único · 100% anticipado' : 'Pago único · 100% contra entrega',
            when: upfront
              ? 'Al aceptar la propuesta, antes de iniciar el trabajo'
              : 'Al entregar el trabajo terminado y aprobado',
            amount: fmt(total),
            percentLabel: '100%',
            breakdown: 'Cubre el 100% del servicio cotizado',
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
        const rest = fee - pricing.deposit;
        steps.push(
          {
            title: 'Pago 1 · Abono inicial',
            when: 'Al aceptar la propuesta, para activar el servicio',
            amount: fmt(pricing.deposit),
            percentLabel: `${pct(pricing.deposit, fee)} del 1er ${periodWord}`,
            breakdown: `Anticipo del primer ${periodWord} (${fmt(fee)})`,
            isDeposit: true,
          },
          {
            title: `Pago 2 · Saldo del primer ${periodWord}`,
            when: 'Contra entrega / al iniciar el servicio',
            amount: fmt(rest),
            percentLabel: pct(rest, fee),
            breakdown: `Completa la tarifa del primer ${periodWord}`,
          }
        );
      } else {
        steps.push({
          title: `Primer cobro (${yearly ? 'año' : 'mes'} 1)`,
          when: upfront || custom.requiresDeposit
            ? 'Al aceptar la propuesta, antes de iniciar el servicio'
            : 'Al iniciar el servicio',
          amount: fmt(fee),
          percentLabel: `100% · 1er ${periodWord}`,
          breakdown: `Cubre el primer ${periodWord} completo de servicio`,
          isDeposit: upfront || custom.requiresDeposit,
        });
      }

      return {
        totalLabel: `Tarifa ${yearly ? 'anual' : 'mensual'} del servicio`,
        totalAmount: fmt(fee),
        totalSuffix: periodLabel,
        totalCaption: `Servicio recurrente con cobro ${yearly ? 'anual' : 'mensual'} de ${fmt(fee)}.`,
        summaryTotalLabel: `Total del primer ${periodWord}`,
        summaryTotalAmount: fmt(fee),
        summaryFormula:
          steps.length === 2
            ? `Pago 1 (${fmt(pricing.deposit)}) + Pago 2 (${fmt(fee - pricing.deposit)}) = ${fmt(fee)} el 1er ${periodWord}`
            : `1er ${periodWord}: ${fmt(fee)} · Luego ${fmt(fee)} ${periodLabel}`,
        steps,
        recurring: {
          label: `Tarifa periódica desde el 2º ${periodWord}`,
          amount: fmt(fee),
          periodLabel,
          detail: `Se cobra ${fmt(fee)} cada ${periodWord} mientras el servicio esté activo.`,
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
      const isFirstDeposit = i === 1 && (custom.requiresDeposit || upfront);
      let when: string;
      if (i === 1) {
        when = isFirstDeposit
          ? 'Al aceptar la propuesta (abono para iniciar)'
          : 'Primera cuota, según calendario acordado';
      } else if (i === count) {
        when = 'Última cuota, según calendario acordado';
      } else {
        when = `Cuota ${i}, según calendario acordado`;
      }
      steps.push({
        title: `Cuota ${i} de ${count}`,
        when,
        amount: fmt(amount),
        percentLabel: isFirstDeposit ? `Cuota 1/${count} · Abono` : `Cuota ${i}/${count}`,
        breakdown: isFirstDeposit
          ? `1ª cuota para iniciar el trabajo (de un total de ${fmt(total)})`
          : `Cuota ${i} de ${count} hasta completar ${fmt(total)}`,
        isDeposit: isFirstDeposit,
      });
    }

    return {
      totalLabel: 'Total a pagar por el servicio',
      totalAmount: fmt(total),
      totalCaption:
        lastCuota === cuota
          ? `Valor total de ${fmt(total)}, pagadero en ${count} cuotas iguales de ${fmt(cuota)} c/u.`
          : `Valor total de ${fmt(total)}, pagadero en ${count} cuotas: ${count - 1} de ${fmt(cuota)} y una última de ${fmt(lastCuota)}.`,
      summaryTotalLabel: `Total a pagar por el cliente (${count} cuotas)`,
      summaryTotalAmount: fmt(total),
      summaryFormula:
        lastCuota === cuota
          ? `${count} cuotas × ${fmt(cuota)} c/u = Total a pagar: ${fmt(total)}`
          : `${count - 1} cuotas de ${fmt(cuota)} + 1 cuota de ${fmt(lastCuota)} = Total a pagar: ${fmt(total)}`,
      steps,
    };
  }

  // ---------------------------------------------------------------------------
  // Plan estándar (catálogo web: 'construccion' | 'estatica' | 'venta')
  // ---------------------------------------------------------------------------
  const isBuild = quote.projectType === 'construccion';
  const isStatic = quote.projectType === 'estatica';
  const total = pricing.initialTotal;
  const monthly = isBuild ? pricing.monthlyTotal : 0;
  const steps: PaymentStep[] = [];

  const deliveryWhen = isBuild
    ? 'Al entregar el sitio terminado, antes de publicarlo'
    : isStatic
    ? 'Al entregar el sitio terminado, para su publicación definitiva'
    : 'Al entregar el sitio, junto al traspaso del código fuente';

  if (pricing.deposit > 0) {
    const depPct = pct(pricing.deposit, total);
    steps.push({
      title: 'Pago 1 · Abono inicial',
      when: 'Al aceptar la propuesta, para iniciar el desarrollo',
      amount: fmt(pricing.deposit),
      percentLabel: `${depPct} · Para iniciar`,
      breakdown: `Equivale al ${depPct} del desarrollo (${fmt(total)})`,
      isDeposit: true,
    });
  }

  if (pricing.remainingDeposit > 0 || monthly > 0) {
    const n = steps.length + 1;
    const includesFirstMonth = monthly > 0;
    const remPct = pct(pricing.remainingDeposit, total);
    steps.push({
      title: `Pago ${n} · ${pricing.remainingDeposit > 0 ? 'Saldo contra entrega' : 'Primer mes de mantención'}`,
      when: deliveryWhen,
      amount: fmt(pricing.remainingDeposit + monthly),
      percentLabel:
        pricing.remainingDeposit > 0
          ? `${remPct} saldo${includesFirstMonth ? ' + 1.er mes' : ' · Al entregar'}`
          : '1.er mes',
      breakdown:
        includesFirstMonth && pricing.remainingDeposit > 0
          ? `${fmt(pricing.remainingDeposit)} (${remPct} restante desarrollo) + ${fmt(monthly)} (1.er mes mantención/hosting)`
          : `Equivale al ${remPct} restante del desarrollo (${fmt(total)})`,
    });
  }

  let caption: string;
  if (pricing.deposit > 0 && pricing.remainingDeposit > 0) {
    caption = `Total único de desarrollo de ${fmt(total)}, dividido en 2 pagos: ${pct(pricing.deposit, total)} (${fmt(pricing.deposit)}) para iniciar y ${pct(pricing.remainingDeposit, total)} (${fmt(pricing.remainingDeposit)}) al entregar.`;
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
      label: 'Mensualidad desde el 2º mes en adelante',
      amount: fmt(monthly),
      periodLabel: '/ mes',
      detail: parts.join(' + '),
    };
  }

  const totalToPublish = total + monthly;

  return {
    totalLabel: isStatic
      ? 'Total a pagar (Desarrollo + Publicación estática)'
      : isBuild
      ? 'Total del desarrollo web (pago único)'
      : 'Total a pagar (Desarrollo + Código fuente)',
    totalAmount: fmt(total),
    totalCaption: caption,
    summaryTotalLabel:
      monthly > 0
        ? 'Total a desembolsar hasta dejar el sitio publicado (Pago 1 + Pago 2)'
        : 'Total a pagar por el cliente (Pago 1 + Pago 2 · Sin cobros mensuales)',
    summaryTotalAmount: fmt(totalToPublish),
    summaryFormula:
      monthly > 0
        ? `Pago 1 (${fmt(pricing.deposit)}) + Pago 2 (${fmt(pricing.remainingDeposit)} saldo + ${fmt(monthly)} 1.er mes) = ${fmt(totalToPublish)}`
        : `Pago 1 (${fmt(pricing.deposit)}) + Pago 2 (${fmt(pricing.remainingDeposit)}) = Total a pagar: ${fmt(total)}`,
    steps,
    recurring,
  };
}

/**
 * Determina si el PDF debe incluir la página de "Descargo de responsabilidad"
 * justo debajo del resumen de la cotización.
 * Se incluye cuando el cliente cotiza "Publicación estática" o "Venta con código fuente".
 */
export function shouldIncludeDisclaimer(quote: Pick<Quote, 'projectType' | 'quoteMode'>): boolean {
  return quote.quoteMode !== 'custom' && (quote.projectType === 'estatica' || quote.projectType === 'venta');
}

/**
 * Determina si el PDF debe incluir el anexo "Presentación de servicios".
 * Por defecto: sí para planes estándar del catálogo web, no para presupuestos personalizados.
 */
export function shouldIncludeServices(quote: Pick<Quote, 'includeServicesInPdf' | 'quoteMode'>): boolean {
  if (typeof quote.includeServicesInPdf === 'boolean') return quote.includeServicesInPdf;
  return quote.quoteMode !== 'custom';
}
