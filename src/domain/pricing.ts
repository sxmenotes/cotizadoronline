import type { Catalog, CurrencyCode, ProjectType } from './types';

export interface PricingInput {
  projectType: ProjectType;
  planId: string;
  extraPages: number;
  subscriptionId: string;
  hosting: boolean;
  currency: CurrencyCode;
  exchangeRate?: number; // Requerido si currency === 'USD'
  catalog: Catalog;
}

export interface PricingLineItem {
  name: string;
  detail: string;
  amount: number; // En CLP enteros o en USD centavos si USD
  formatted: string;
}

export interface PricingResult {
  currency: CurrencyCode;
  exchangeRate?: number;
  // Montos brutos (CLP enteros o centavos si USD)
  baseAmount: number;
  extraAmount: number;
  initialTotal: number;
  deposit: number;
  remainingDeposit: number;
  subscriptionAmount: number;
  hostingAmount: number;
  monthlyTotal: number;
  balance: number;

  // Montos formateados con moneda ('$150.000' o 'US$157,90')
  formatted: {
    baseAmount: string;
    extraAmount: string;
    initialTotal: string;
    deposit: string;
    remainingDeposit: string;
    subscriptionAmount: string;
    hostingAmount: string;
    monthlyTotal: string;
    balance: string;
  };

  lineItems: PricingLineItem[];
}

export class PricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PricingError';
  }
}

// Redondeo half-up para enteros
export function roundHalfUp(num: number): number {
  return Math.round(num);
}

// Formateador de moneda estricto según especificación
export function formatCurrency(amount: number, currency: CurrencyCode): string {
  if (currency === 'CLP') {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // USD: amount viene en centavos
  const dollars = amount / 100;
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

export function calculatePricing(input: PricingInput): PricingResult {
  const {
    projectType,
    planId,
    extraPages,
    subscriptionId,
    hosting,
    currency,
    exchangeRate,
    catalog,
  } = input;

  // Validaciones
  if (!Number.isInteger(extraPages) || extraPages < 0) {
    throw new PricingError('extraPages debe ser un entero mayor o igual a 0');
  }

  const plan = catalog.plans.find((p) => p.id === planId);
  if (!plan) {
    throw new PricingError(`Plan no encontrado en el catálogo: ${planId}`);
  }

  const subscription = catalog.subscriptions.find((s) => s.id === subscriptionId);
  if (!subscription) {
    throw new PricingError(`Suscripción no encontrada en el catálogo: ${subscriptionId}`);
  }

  if (currency === 'USD' && (!exchangeRate || exchangeRate <= 0)) {
    throw new PricingError('Se requiere un tipo de cambio válido mayor a 0 para moneda USD');
  }

  // 1. Cálculo base en CLP
  const basePriceCLP =
    projectType === 'construccion' ? plan.build.price : plan.sale.price;
  const extraPriceCLP = extraPages * catalog.extraPagePrice;

  // Si projectType === 'venta', suscripción y hosting valen 0
  const isVenta = projectType === 'venta';
  const subPriceCLP = isVenta ? 0 : subscription.price;
  const hostingPriceCLP = isVenta || !hosting ? 0 : catalog.hosting.monthlyPrice;

  if (currency === 'CLP') {
    const initialTotal = basePriceCLP + extraPriceCLP;
    const deposit = roundHalfUp((initialTotal * catalog.depositPercent) / 100);
    const remainingDeposit = initialTotal - deposit;
    const monthlyTotal = subPriceCLP + hostingPriceCLP;
    const balance = remainingDeposit + monthlyTotal;

    const lineItems: PricingLineItem[] = [
      {
        name: plan.name,
        detail: projectType === 'construccion' ? plan.build.desc : plan.sale.desc,
        amount: basePriceCLP,
        formatted: formatCurrency(basePriceCLP, 'CLP'),
      },
    ];

    if (extraPages > 0) {
      lineItems.push({
        name: 'Páginas adicionales',
        detail: `${extraPages} página(s) extra(s) (${formatCurrency(catalog.extraPagePrice, 'CLP')} c/u)`,
        amount: extraPriceCLP,
        formatted: formatCurrency(extraPriceCLP, 'CLP'),
      });
    }

    return {
      currency: 'CLP',
      baseAmount: basePriceCLP,
      extraAmount: extraPriceCLP,
      initialTotal,
      deposit,
      remainingDeposit,
      subscriptionAmount: subPriceCLP,
      hostingAmount: hostingPriceCLP,
      monthlyTotal,
      balance,
      formatted: {
        baseAmount: formatCurrency(basePriceCLP, 'CLP'),
        extraAmount: formatCurrency(extraPriceCLP, 'CLP'),
        initialTotal: formatCurrency(initialTotal, 'CLP'),
        deposit: formatCurrency(deposit, 'CLP'),
        remainingDeposit: formatCurrency(remainingDeposit, 'CLP'),
        subscriptionAmount: formatCurrency(subPriceCLP, 'CLP'),
        hostingAmount: formatCurrency(hostingPriceCLP, 'CLP'),
        monthlyTotal: formatCurrency(monthlyTotal, 'CLP'),
        balance: formatCurrency(balance, 'CLP'),
      },
      lineItems,
    };
  }

  // 2. Moneda USD (Cálculo exacto por línea en centavos)
  const rate = exchangeRate!;
  const toMinorUSD = (clp: number) => roundHalfUp((clp / rate) * 100);

  const baseMinor = toMinorUSD(basePriceCLP);
  const extraMinor = toMinorUSD(extraPriceCLP);
  const initialTotalMinor = baseMinor + extraMinor;

  const depositMinor = roundHalfUp(
    (initialTotalMinor * catalog.depositPercent) / 100
  );
  const remainingDepositMinor = initialTotalMinor - depositMinor;

  const subMinor = isVenta ? 0 : toMinorUSD(subPriceCLP);
  const hostingMinor = isVenta || !hosting ? 0 : toMinorUSD(hostingPriceCLP);
  const monthlyMinor = subMinor + hostingMinor;
  const balanceMinor = remainingDepositMinor + monthlyMinor;

  const lineItems: PricingLineItem[] = [
    {
      name: plan.name,
      detail: projectType === 'construccion' ? plan.build.desc : plan.sale.desc,
      amount: baseMinor,
      formatted: formatCurrency(baseMinor, 'USD'),
    },
  ];

  if (extraPages > 0) {
    lineItems.push({
      name: 'Páginas adicionales',
      detail: `${extraPages} página(s) extra(s)`,
      amount: extraMinor,
      formatted: formatCurrency(extraMinor, 'USD'),
    });
  }

  return {
    currency: 'USD',
    exchangeRate: rate,
    baseAmount: baseMinor,
    extraAmount: extraMinor,
    initialTotal: initialTotalMinor,
    deposit: depositMinor,
    remainingDeposit: remainingDepositMinor,
    subscriptionAmount: subMinor,
    hostingAmount: hostingMinor,
    monthlyTotal: monthlyMinor,
    balance: balanceMinor,
    formatted: {
      baseAmount: formatCurrency(baseMinor, 'USD'),
      extraAmount: formatCurrency(extraMinor, 'USD'),
      initialTotal: formatCurrency(initialTotalMinor, 'USD'),
      deposit: formatCurrency(depositMinor, 'USD'),
      remainingDeposit: formatCurrency(remainingDepositMinor, 'USD'),
      subscriptionAmount: formatCurrency(subMinor, 'USD'),
      hostingAmount: formatCurrency(hostingMinor, 'USD'),
      monthlyTotal: formatCurrency(monthlyMinor, 'USD'),
      balance: formatCurrency(balanceMinor, 'USD'),
    },
    lineItems,
  };
}
