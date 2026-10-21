import { describe, it, expect } from 'vitest';
import { calculatePricing, PricingError } from '../../src/domain/pricing';
import { validateTokens, resolveTokens } from '../../src/domain/tokens';
import { migrate, MigrationError } from '../../src/domain/migrations';
import { catalogSeed, termsSeed } from '../../src/data/seeds';
import { QuoteSchema, SkeletonDesignSchema } from '../../src/domain/schemas';
import { createDefaultSkeleton } from '../../src/store/skeletonStore';

describe('Motor de Cálculo de Precios (Sección 6.3)', () => {
  it('Caso 1: Construcción con extras y hosting', () => {
    const res = calculatePricing({
      projectType: 'construccion',
      planId: 'landingPlus',
      extraPages: 2,
      subscriptionId: 'full',
      hosting: true,
      currency: 'CLP',
      catalog: catalogSeed,
    });

    expect(res.baseAmount).toBe(120000);
    expect(res.extraAmount).toBe(30000);
    expect(res.initialTotal).toBe(150000);
    expect(res.deposit).toBe(75000);
    expect(res.remainingDeposit).toBe(75000);
    expect(res.subscriptionAmount).toBe(50000);
    expect(res.hostingAmount).toBe(10000);
    expect(res.monthlyTotal).toBe(60000);
    expect(res.balance).toBe(135000);
    expect(res.deposit + res.remainingDeposit).toBe(res.initialTotal);
  });

  it('Caso 2: Venta completa (suscripción y hosting ignorados)', () => {
    const res = calculatePricing({
      projectType: 'venta',
      planId: 'landingFull',
      extraPages: 1,
      subscriptionId: 'premium',
      hosting: true,
      currency: 'CLP',
      catalog: catalogSeed,
    });

    expect(res.baseAmount).toBe(230000);
    expect(res.extraAmount).toBe(15000);
    expect(res.initialTotal).toBe(245000);
    expect(res.deposit).toBe(122500);
    expect(res.remainingDeposit).toBe(122500);
    expect(res.subscriptionAmount).toBe(0);
    expect(res.hostingAmount).toBe(0);
    expect(res.monthlyTotal).toBe(0);
    expect(res.balance).toBe(122500);
    expect(res.deposit + res.remainingDeposit).toBe(res.initialTotal);
  });

  it('Caso 3: Sin suscripción ni hosting', () => {
    const res = calculatePricing({
      projectType: 'construccion',
      planId: 'landing',
      extraPages: 0,
      subscriptionId: 'none',
      hosting: false,
      currency: 'CLP',
      catalog: catalogSeed,
    });

    expect(res.baseAmount).toBe(100000);
    expect(res.extraAmount).toBe(0);
    expect(res.initialTotal).toBe(100000);
    expect(res.deposit).toBe(50000);
    expect(res.remainingDeposit).toBe(50000);
    expect(res.subscriptionAmount).toBe(0);
    expect(res.hostingAmount).toBe(0);
    expect(res.monthlyTotal).toBe(0);
    expect(res.balance).toBe(50000);
    expect(res.deposit + res.remainingDeposit).toBe(res.initialTotal);
  });

  it('Caso 4: USD con tasa de cambio 950 (centavos exactos)', () => {
    const res = calculatePricing({
      projectType: 'construccion',
      planId: 'landingPlus',
      extraPages: 2,
      subscriptionId: 'full',
      hosting: true,
      currency: 'USD',
      exchangeRate: 950,
      catalog: catalogSeed,
    });

    // En centavos:
    // base: round(120000 / 950 * 100) = 12632
    // extras: round(30000 / 950 * 100) = 3158
    // subscription: round(50000 / 950 * 100) = 5263
    // hosting: round(10000 / 950 * 100) = 1053
    expect(res.baseAmount).toBe(12632);
    expect(res.extraAmount).toBe(3158);
    expect(res.initialTotal).toBe(15790); // 12632 + 3158
    expect(res.deposit).toBe(7895); // round(15790 * 0.5)
    expect(res.remainingDeposit).toBe(7895);
    expect(res.subscriptionAmount).toBe(5263);
    expect(res.hostingAmount).toBe(1053);
    expect(res.monthlyTotal).toBe(6316); // 5263 + 1053
    expect(res.balance).toBe(14211); // 7895 + 6316
    expect(res.deposit + res.remainingDeposit).toBe(res.initialTotal);
  });

  it('Rechaza extraPages no entero o negativo', () => {
    expect(() =>
      calculatePricing({
        projectType: 'construccion',
        planId: 'landing',
        extraPages: -1,
        subscriptionId: 'none',
        hosting: false,
        currency: 'CLP',
        catalog: catalogSeed,
      })
    ).toThrow(PricingError);

    expect(() =>
      calculatePricing({
        projectType: 'construccion',
        planId: 'landing',
        extraPages: 1.5,
        subscriptionId: 'none',
        hosting: false,
        currency: 'CLP',
        catalog: catalogSeed,
      })
    ).toThrow(PricingError);
  });

  it('Rechaza plan o suscripción inexistente', () => {
    expect(() =>
      calculatePricing({
        projectType: 'construccion',
        planId: 'plan_fantasma',
        extraPages: 0,
        subscriptionId: 'none',
        hosting: false,
        currency: 'CLP',
        catalog: catalogSeed,
      })
    ).toThrow(PricingError);
  });
});

describe('Gramática de Tokens y Validación (Sección 6.4)', () => {
  it('Valida tokens existentes y detecta tokens inválidos', () => {
    const valid = 'Plan {{build:landingPlus}} con abono del {{deposit%}}';
    expect(validateTokens(valid, catalogSeed).isValid).toBe(true);

    const invalid = 'Plan {{build:no_existe}} con token {{invalido}}';
    const res = validateTokens(invalid, catalogSeed);
    expect(res.isValid).toBe(false);
    expect(res.errors.length).toBe(2);
  });

  it('Resuelve tokens a montos formateados en CLP y USD', () => {
    const text = 'Base: {{build:landingPlus}}, Hosting: {{hosting}}, Días: {{days}}';
    const clp = resolveTokens(text, { catalog: catalogSeed, currency: 'CLP' });
    expect(clp).toContain('$120.000');
    expect(clp).toContain('$10.000');
    expect(clp).toContain('8');

    const usd = resolveTokens(text, { catalog: catalogSeed, currency: 'USD', exchangeRate: 950 });
    expect(usd).toContain('US$');
  });

  it('Prueba obligatoria: Ningún texto en termsSeed contiene montos literales ($ o US$ con dígitos)', () => {
    const literalMoneyRegex = /(?:\$|US\$)\s*\d+(?:\.\d+)?/g;

    const allTexts: string[] = [];
    termsSeed.pages.forEach((page) => {
      page.sections.forEach((sec) => {
        sec.blocks.forEach((block) => {
          if (block.type === 'paragraph' || block.type === 'callout') {
            allTexts.push(block.content);
          } else if (block.type === 'list') {
            allTexts.push(...block.items);
          } else if (block.type === 'table') {
            block.rows.forEach((r) => allTexts.push(...r));
          } else if (block.type === 'tags') {
            allTexts.push(...block.tags);
          }
        });
      });
    });

    const violations: string[] = [];
    allTexts.forEach((t) => {
      const matches = t.match(literalMoneyRegex);
      if (matches) {
        violations.push(`${t} -> encontrado: ${matches.join(', ')}`);
      }
    });

    expect(violations).toEqual([]);
  });
});

describe('Migraciones y Esquemas Zod (Sección 5)', () => {
  it('Migra datos con versión válida y rechaza versión superior', () => {
    const data = { schemaVersion: 1, foo: 'bar' };
    expect(migrate(data).schemaVersion).toBe(1);

    expect(() => migrate({ schemaVersion: 99 })).toThrow(MigrationError);
  });

  it('Valida esquema SkeletonDesign por defecto', () => {
    const sk = createDefaultSkeleton();
    const parsed = SkeletonDesignSchema.safeParse(sk);
    expect(parsed.success).toBe(true);
  });

  it('Valida esquema Quote con presupuesto válido', () => {
    const validQuote = {
      id: 'quote-123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      issuedOn: '2026-09-20',
      client: 'Cliente Test',
      project: 'Proyecto Test',
      versionType: 'first' as const,
      projectType: 'construccion' as const,
      planId: 'landing',
      extraPages: 0,
      subscriptionId: 'none',
      hosting: false,
      currency: 'CLP' as const,
      catalog: catalogSeed,
      terms: termsSeed,
      issuer: {
        name: 'SAMUEL VALENZUELA',
        brandSubtitle: 'PROPUESTA COMERCIAL',
        documentTag: 'PROPUESTA DE SERVICIOS WEB',
        serviceTagline: 'Tagline',
        footerBrand: 'Footer',
        bankDetails: ['Datos'],
        contact: ['+569'],
      },
    };
    const parsed = QuoteSchema.safeParse(validQuote);
    expect(parsed.success).toBe(true);
  });

  describe('Presupuestos Personalizados (A Medida)', () => {
    it('Caso Personalizado 1: Pago único con abono (50%) en CLP', () => {
      const res = calculatePricing({
        projectType: 'construccion',
        planId: 'landing',
        extraPages: 0,
        subscriptionId: 'none',
        hosting: false,
        currency: 'CLP',
        catalog: catalogSeed,
        quoteMode: 'custom',
        customConfig: {
          itemName: 'Desarrollo de App Móvil iOS y Android',
          description: 'Desarrollo completo en Flutter con pasarela de pagos',
          price: 800000,
          isOneTimePayment: true,
          paymentType: 'unique',
          requiresDeposit: true,
          depositOption: 'percent',
          depositPercent: 50,
          deliveryDays: 20,
        },
      });

      expect(res.baseAmount).toBe(800000);
      expect(res.initialTotal).toBe(800000);
      expect(res.deposit).toBe(400000);
      expect(res.remainingDeposit).toBe(400000);
      expect(res.monthlyTotal).toBe(0);
      expect(res.balance).toBe(400000);
      expect(res.lineItems[0]!.name).toBe('Desarrollo de App Móvil iOS y Android');
    });

    it('Caso Personalizado 2: Pago único sin abono (100% contraentrega)', () => {
      const res = calculatePricing({
        projectType: 'venta',
        planId: 'landing',
        extraPages: 0,
        subscriptionId: 'none',
        hosting: false,
        currency: 'CLP',
        catalog: catalogSeed,
        quoteMode: 'custom',
        customConfig: {
          itemName: 'Diseño de Marca y Manual de Identidad',
          price: 350000,
          isOneTimePayment: true,
          paymentType: 'unique',
          requiresDeposit: false,
          depositOption: 'none',
          deliveryDays: 10,
        },
      });

      expect(res.baseAmount).toBe(350000);
      expect(res.initialTotal).toBe(350000);
      expect(res.deposit).toBe(0);
      expect(res.remainingDeposit).toBe(350000);
      expect(res.balance).toBe(350000);
    });

    it('Caso Personalizado 3: Pago único sin abono pero 100% anticipado (CLP)', () => {
      const res = calculatePricing({
        projectType: 'venta',
        planId: 'landing',
        extraPages: 0,
        subscriptionId: 'none',
        hosting: false,
        currency: 'CLP',
        catalog: catalogSeed,
        quoteMode: 'custom',
        customConfig: {
          itemName: 'Auditoría de Ciberseguridad y Pentesting',
          price: 500000,
          isOneTimePayment: true,
          paymentType: 'unique',
          requiresDeposit: false,
          noDepositTiming: 'upfront',
          depositOption: 'upfront',
          deliveryDays: 5,
        },
      });

      expect(res.baseAmount).toBe(500000);
      expect(res.initialTotal).toBe(500000);
      expect(res.deposit).toBe(500000); // 100% anticipado
      expect(res.remainingDeposit).toBe(0);
      expect(res.balance).toBe(0); // Sin saldo pendiente
    });

    it('Caso Personalizado 4: Pago único sin abono pero 100% anticipado (USD)', () => {
      const res = calculatePricing({
        projectType: 'venta',
        planId: 'landing',
        extraPages: 0,
        subscriptionId: 'none',
        hosting: false,
        currency: 'USD',
        exchangeRate: 1000,
        catalog: catalogSeed,
        quoteMode: 'custom',
        customConfig: {
          itemName: 'Setup Cloud Infrastructure AWS',
          price: 400000, // 400 USD -> 40000 cents
          isOneTimePayment: true,
          paymentType: 'unique',
          requiresDeposit: false,
          noDepositTiming: 'upfront',
          depositOption: 'upfront',
          deliveryDays: 5,
        },
      });

      expect(res.baseAmount).toBe(40000); // 400 USD
      expect(res.initialTotal).toBe(40000);
      expect(res.deposit).toBe(40000); // 100% anticipado en centavos
      expect(res.remainingDeposit).toBe(0);
      expect(res.balance).toBe(0);
    });

    it('Caso Personalizado 5: Recurrente mensual con abono inicial en USD', () => {
      const res = calculatePricing({
        projectType: 'construccion',
        planId: 'landing',
        extraPages: 0,
        subscriptionId: 'none',
        hosting: false,
        currency: 'USD',
        exchangeRate: 950,
        catalog: catalogSeed,
        quoteMode: 'custom',
        customConfig: {
          itemName: 'Consultoría y DevOps Continuo',
          price: 475000, // 475000 / 950 = 500 USD (50000 cents)
          isOneTimePayment: false,
          paymentType: 'recurring',
          billingPeriod: 'monthly',
          requiresDeposit: true,
          depositPercent: 50, // 250 USD deposit
        },
      });

      expect(res.baseAmount).toBe(50000); // centavos
      expect(res.deposit).toBe(25000); // 250 USD
      expect(res.monthlyTotal).toBe(50000); // 500 USD/mes
      expect(res.formatted.baseAmount).toContain('500');
    });

    it('Valida esquema Quote con configuración personalizada válida', () => {
      const customQuote = {
        id: 'quote-custom-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        issuedOn: '2026-09-20',
        client: 'Cliente Personalizado',
        project: 'Integración Pasarela Webpay',
        versionType: 'first' as const,
        projectType: 'venta' as const,
        planId: 'landing',
        extraPages: 0,
        subscriptionId: 'none',
        hosting: false,
        currency: 'CLP' as const,
        catalog: catalogSeed,
        terms: termsSeed,
        issuer: {
          name: 'SAMUEL VALENZUELA',
          brandSubtitle: 'PROPUESTA COMERCIAL',
          documentTag: 'PROPUESTA DE SERVICIOS',
          serviceTagline: 'Tagline',
          footerBrand: 'Footer',
          bankDetails: ['Datos'],
          contact: ['+569'],
        },
        quoteMode: 'custom' as const,
        customConfig: {
          itemName: 'Integración Webpay Plus API',
          description: 'Implementación de checkout seguro',
          price: 300000,
          isOneTimePayment: true,
          paymentType: 'unique' as const,
          requiresDeposit: true,
          depositPercent: 50,
          deliveryDays: 7,
        },
      };
      const parsed = QuoteSchema.safeParse(customQuote);
      expect(parsed.success).toBe(true);
    });
  });
});
