import type { Catalog, CurrencyCode, ProjectType, QuoteMode, CustomQuoteConfig } from './types';

export interface PricingInput {
  projectType: ProjectType;
  planId: string;
  extraPages: number;
  subscriptionId: string;
  hosting: boolean;
  currency: CurrencyCode;
  exchangeRate?: number | undefined; // Requerido si currency === 'USD'
  catalog: Catalog;
  quoteMode?: QuoteMode | undefined;
  customConfig?: CustomQuoteConfig | undefined;
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
    quoteMode,
    customConfig,
  } = input;

  // Si es presupuesto personalizado
  if (quoteMode === 'custom' && customConfig) {
    if (currency === 'USD' && (!exchangeRate || exchangeRate <= 0)) {
      throw new PricingError('Se requiere un tipo de cambio válido mayor a 0 para moneda USD');
    }

    const basePriceCLP = customConfig.price || 0;
    const isOneTime = customConfig.isOneTimePayment;
    const reqDeposit = customConfig.requiresDeposit;
    const depPercent = reqDeposit ? (customConfig.depositPercent ?? 50) : 0;

    let initialTotalCLP = 0;
    let depositCLP = 0;
    let remainingDepositCLP = 0;
    let monthlyTotalCLP = 0;
    let balanceCLP = 0;

    const isUpfront =
      !reqDeposit &&
      (customConfig.noDepositTiming === 'upfront' ||
        customConfig.depositOption === 'upfront' ||
        customConfig.depositOption === 'full_upfront');

    if (isOneTime || customConfig.paymentType === 'unique') {
      initialTotalCLP = basePriceCLP;
      if (reqDeposit) {
        depositCLP = roundHalfUp((initialTotalCLP * depPercent) / 100);
        remainingDepositCLP = initialTotalCLP - depositCLP;
        balanceCLP = remainingDepositCLP;
      } else if (isUpfront) {
        depositCLP = initialTotalCLP;
        remainingDepositCLP = 0;
        balanceCLP = 0;
      } else {
        depositCLP = 0;
        remainingDepositCLP = initialTotalCLP;
        balanceCLP = remainingDepositCLP;
      }
      monthlyTotalCLP = 0;
    } else if (customConfig.paymentType === 'recurring') {
      monthlyTotalCLP = basePriceCLP;
      depositCLP = reqDeposit ? roundHalfUp((monthlyTotalCLP * depPercent) / 100) : 0;
      initialTotalCLP = depositCLP;
      remainingDepositCLP = 0;
      balanceCLP = monthlyTotalCLP;
    } else if (customConfig.paymentType === 'installments') {
      initialTotalCLP = basePriceCLP;
      const count = customConfig.installmentsCount || 2;
      const cuotaCLP = roundHalfUp(basePriceCLP / count);
      depositCLP = reqDeposit ? cuotaCLP : 0;
      remainingDepositCLP = initialTotalCLP - depositCLP;
      monthlyTotalCLP = cuotaCLP;
      balanceCLP = remainingDepositCLP;
    }

    const detailText = customConfig.description
      ? customConfig.description
      : isOneTime
      ? reqDeposit
        ? `Pago único (Abono ${depPercent}% + Saldo contraentrega)`
        : isUpfront
        ? 'Pago 100% anticipado (por adelantado)'
        : 'Pago 100% contraentrega (sin abono previo)'
      : customConfig.paymentType === 'recurring'
      ? `Servicio recurrente (${customConfig.billingPeriod === 'yearly' ? 'Anual' : 'Mensual'})`
      : `Pago en ${customConfig.installmentsCount || 2} cuotas`;

    if (currency === 'CLP') {
      const lineItems: PricingLineItem[] = [
        {
          name: customConfig.itemName || 'Presupuesto Personalizado',
          detail: detailText,
          amount: basePriceCLP,
          formatted: formatCurrency(basePriceCLP, 'CLP'),
        },
      ];

      return {
        currency: 'CLP',
        baseAmount: basePriceCLP,
        extraAmount: 0,
        initialTotal: initialTotalCLP,
        deposit: depositCLP,
        remainingDeposit: remainingDepositCLP,
        subscriptionAmount: monthlyTotalCLP,
        hostingAmount: 0,
        monthlyTotal: monthlyTotalCLP,
        balance: balanceCLP,
        formatted: {
          baseAmount: formatCurrency(basePriceCLP, 'CLP'),
          extraAmount: formatCurrency(0, 'CLP'),
          initialTotal: formatCurrency(initialTotalCLP, 'CLP'),
          deposit: formatCurrency(depositCLP, 'CLP'),
          remainingDeposit: formatCurrency(remainingDepositCLP, 'CLP'),
          subscriptionAmount: formatCurrency(monthlyTotalCLP, 'CLP'),
          hostingAmount: formatCurrency(0, 'CLP'),
          monthlyTotal: formatCurrency(monthlyTotalCLP, 'CLP'),
          balance: formatCurrency(balanceCLP, 'CLP'),
        },
        lineItems,
      };
    }

    // USD
    const rate = exchangeRate!;
    const toMinorUSD = (clp: number) => roundHalfUp((clp / rate) * 100);

    const baseMinor = toMinorUSD(basePriceCLP);
    let initialTotalMinor = 0;
    let depositMinor = 0;
    let remainingDepositMinor = 0;
    let monthlyMinor = 0;
    let balanceMinor = 0;

    if (isOneTime || customConfig.paymentType === 'unique') {
      initialTotalMinor = baseMinor;
      if (reqDeposit) {
        depositMinor = roundHalfUp((initialTotalMinor * depPercent) / 100);
        remainingDepositMinor = initialTotalMinor - depositMinor;
        balanceMinor = remainingDepositMinor;
      } else if (isUpfront) {
        depositMinor = initialTotalMinor;
        remainingDepositMinor = 0;
        balanceMinor = 0;
      } else {
        depositMinor = 0;
        remainingDepositMinor = initialTotalMinor;
        balanceMinor = remainingDepositMinor;
      }
      monthlyMinor = 0;
    } else if (customConfig.paymentType === 'recurring') {
      monthlyMinor = baseMinor;
      depositMinor = reqDeposit ? roundHalfUp((monthlyMinor * depPercent) / 100) : 0;
      initialTotalMinor = depositMinor;
      remainingDepositMinor = 0;
      balanceMinor = monthlyMinor;
    } else if (customConfig.paymentType === 'installments') {
      initialTotalMinor = baseMinor;
      const count = customConfig.installmentsCount || 2;
      const cuotaMinor = roundHalfUp(baseMinor / count);
      depositMinor = reqDeposit ? cuotaMinor : 0;
      remainingDepositMinor = initialTotalMinor - depositMinor;
      monthlyMinor = cuotaMinor;
      balanceMinor = remainingDepositMinor;
    }

    const lineItems: PricingLineItem[] = [
      {
        name: customConfig.itemName || 'Presupuesto Personalizado',
        detail: detailText,
        amount: baseMinor,
        formatted: formatCurrency(baseMinor, 'USD'),
      },
    ];

    return {
      currency: 'USD',
      exchangeRate: rate,
      baseAmount: baseMinor,
      extraAmount: 0,
      initialTotal: initialTotalMinor,
      deposit: depositMinor,
      remainingDeposit: remainingDepositMinor,
      subscriptionAmount: monthlyMinor,
      hostingAmount: 0,
      monthlyTotal: monthlyMinor,
      balance: balanceMinor,
      formatted: {
        baseAmount: formatCurrency(baseMinor, 'USD'),
        extraAmount: formatCurrency(0, 'USD'),
        initialTotal: formatCurrency(initialTotalMinor, 'USD'),
        deposit: formatCurrency(depositMinor, 'USD'),
        remainingDeposit: formatCurrency(remainingDepositMinor, 'USD'),
        subscriptionAmount: formatCurrency(monthlyMinor, 'USD'),
        hostingAmount: formatCurrency(0, 'USD'),
        monthlyTotal: formatCurrency(monthlyMinor, 'USD'),
        balance: formatCurrency(balanceMinor, 'USD'),
      },
      lineItems,
    };
  }

  // Validaciones modo estándar
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
