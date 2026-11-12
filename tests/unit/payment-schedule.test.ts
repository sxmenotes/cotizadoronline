import { describe, it, expect } from 'vitest';
import {
  buildPaymentPlan,
  shouldIncludeDisclaimer,
  shouldIncludeServices,
} from '../../src/domain/paymentSchedule';
import { calculatePricing, STATIC_PUBLICATION_SURCHARGE_CLP } from '../../src/domain/pricing';
import { catalogSeed, termsSeed, issuerSeed } from '../../src/data/seeds';
import type { Quote } from '../../src/domain/types';

const makeQuote = (overrides: Partial<Quote> = {}): Quote => ({
  id: 'q',
  createdAt: '2026-09-20T12:00:00.000Z',
  updatedAt: '2026-09-20T12:00:00.000Z',
  issuedOn: '2026-09-20',
  client: 'Cliente',
  project: 'Proyecto',
  versionType: 'first',
  projectType: 'construccion',
  planId: 'landingPlus',
  extraPages: 2,
  subscriptionId: 'full',
  hosting: true,
  currency: 'CLP',
  catalog: catalogSeed,
  terms: termsSeed,
  issuer: issuerSeed,
  ...overrides,
});

const plan = (q: Quote) =>
  buildPaymentPlan(
    q,
    calculatePricing({ ...q, quoteMode: q.quoteMode, customConfig: q.customConfig })
  );

describe('Esquema de pagos (buildPaymentPlan)', () => {
  it('Construcción: abono + saldo con primer mes y mensualidad posterior', () => {
    const p = plan(makeQuote());
    expect(p.totalAmount).toBe('$150.000');
    expect(p.steps).toHaveLength(2);
    expect(p.steps[0]!.amount).toBe('$75.000');
    expect(p.steps[0]!.isDeposit).toBe(true);
    expect(p.steps[1]!.amount).toBe('$135.000');
    expect(p.steps[1]!.breakdown).toContain('$60.000');
    expect(p.recurring?.amount).toBe('$60.000');
  });

  it('Venta: abono + saldo sin mensualidad', () => {
    const p = plan(makeQuote({ projectType: 'venta', planId: 'landingFull', extraPages: 1 }));
    expect(p.totalAmount).toBe('$245.000');
    expect(p.summaryTotalAmount).toBe('$245.000');
    expect(p.steps.map((s) => s.amount)).toEqual(['$122.500', '$122.500']);
    expect(p.recurring).toBeUndefined();
  });

  it('Publicación estática: suma $10.000 fijos al plan de construcción sin mensualidad', () => {
    const q = makeQuote({
      projectType: 'estatica',
      planId: 'landing',
      extraPages: 0,
      subscriptionId: 'premium', // se ignora en estática
      hosting: true,             // se ignora en estática
    });
    const pricing = calculatePricing({ ...q });
    // Plan Landing básico construcción ($100.000) + $10.000 fijos = $110.000
    expect(STATIC_PUBLICATION_SURCHARGE_CLP).toBe(10000);
    expect(pricing.initialTotal).toBe(110000);
    expect(pricing.monthlyTotal).toBe(0);
    expect(pricing.deposit).toBe(55000);
    expect(pricing.balance).toBe(55000);

    const p = buildPaymentPlan(q, pricing);
    expect(p.totalAmount).toBe('$110.000');
    expect(p.summaryTotalAmount).toBe('$110.000');
    expect(p.steps.map((s) => s.amount)).toEqual(['$55.000', '$55.000']);
    expect(p.recurring).toBeUndefined();
  });

  it('shouldIncludeDisclaimer: se activa solo en publicación estática y venta estándar', () => {
    expect(shouldIncludeDisclaimer({ projectType: 'construccion', quoteMode: 'standard' })).toBe(false);
    expect(shouldIncludeDisclaimer({ projectType: 'estatica', quoteMode: 'standard' })).toBe(true);
    expect(shouldIncludeDisclaimer({ projectType: 'venta', quoteMode: 'standard' })).toBe(true);
    expect(shouldIncludeDisclaimer({ projectType: 'estatica', quoteMode: 'custom' })).toBe(false);
  });

  it('Personalizado en cuotas: la última cuota absorbe el redondeo', () => {
    const p = plan(
      makeQuote({
        quoteMode: 'custom',
        customConfig: {
          itemName: 'X',
          price: 100000,
          isOneTimePayment: false,
          paymentType: 'installments',
          installmentsCount: 3,
          requiresDeposit: true,
        },
      })
    );
    expect(p.steps.map((s) => s.amount)).toEqual(['$33.333', '$33.333', '$33.334']);
    expect(p.steps[0]!.isDeposit).toBe(true);
  });

  it('Personalizado pago único contra entrega: un solo pago', () => {
    const p = plan(
      makeQuote({
        quoteMode: 'custom',
        customConfig: { itemName: 'X', price: 50000, isOneTimePayment: true, requiresDeposit: false },
      })
    );
    expect(p.steps).toHaveLength(1);
    expect(p.steps[0]!.title).toContain('contra entrega');
  });

  it('shouldIncludeServices: valor por defecto según modo', () => {
    expect(shouldIncludeServices({ quoteMode: 'standard' })).toBe(true);
    expect(shouldIncludeServices({ quoteMode: 'custom' })).toBe(false);
    expect(shouldIncludeServices({ quoteMode: 'custom', includeServicesInPdf: true })).toBe(true);
    expect(shouldIncludeServices({ quoteMode: 'standard', includeServicesInPdf: false })).toBe(false);
  });
});

