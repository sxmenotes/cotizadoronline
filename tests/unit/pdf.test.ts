// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import React from 'react';
import { pdf } from '@react-pdf/renderer';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { QuoteDocument } from '../../src/pdf/QuoteDocument';
import { registerPdfFonts } from '../../src/pdf/fonts';
import { catalogSeed, termsSeed, issuerSeed } from '../../src/data/seeds';
import type { Quote } from '../../src/domain/types';

describe('Documento PDF del Presupuesto (Sección 9.4)', () => {
  beforeAll(() => {
    registerPdfFonts();
  });

  const makeQuote = (overrides: Partial<Quote> = {}): Quote => ({
    id: 'quote-test-1',
    createdAt: '2026-09-20T12:00:00.000Z',
    updatedAt: '2026-09-20T12:00:00.000Z',
    issuedOn: '2026-09-20',
    client: 'Sociedad Gastronómica El Roble SpA',
    project: 'Sitio Web Corporativo y Carta Online',
    prototypeUrl: 'https://figma.com/proto/test',
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

  // Helper para extraer todo el texto y posiciones de un PDF
  async function extractPdfData(docElement: React.ReactElement) {
    const blob = await pdf(docElement).toBlob();
    const arrayBuffer = await blob.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdfDoc = await loadingTask.promise;

    const allPagesText: string[] = [];
    const allItems: { text: string; x: number; y: number; page: number }[] = [];

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const pageStrings: string[] = [];

      for (const item of textContent.items) {
        if ('str' in item && typeof item.str === 'string') {
          pageStrings.push(item.str);
          // item.transform contiene la matriz [scaleX, skewY, skewX, scaleY, tx, ty]
          const x = item.transform[4] ?? 0;
          const y = item.transform[5] ?? 0;
          allItems.push({ text: item.str, x, y, page: i });
        }
      }
      allPagesText.push(pageStrings.join(' '));
    }

    return {
      numPages: pdfDoc.numPages,
      allPagesText,
      fullText: allPagesText.join('\n\n'),
      allItems,
      blob,
    };
  }

  it('Caso 1: Construcción con extras, suscripción y hosting en CLP', async () => {
    const quote = makeQuote();
    const doc = React.createElement(QuoteDocument, { quote });
    const { numPages, allPagesText, fullText, allItems, blob } = await extractPdfData(doc);

    expect(blob.size).toBeGreaterThan(10000);
    expect(numPages).toBeGreaterThanOrEqual(4);

    // Texto contiene cliente y proyecto
    expect(fullText).toContain('Sociedad Gastronómica El Roble SpA');
    expect(fullText).toContain('Sitio Web Corporativo y Carta Online');

    // Totales calculados presentes (Total inicial 150.000, Abono 75.000, Saldo 135.000)
    expect(fullText).toContain('$150.000');
    expect(fullText).toContain('$75.000');
    expect(fullText).toContain('$135.000');

    // Sin caracteres de sustitución ni tokens sin resolver
    expect(fullText).not.toContain('\ufffd');
    expect(fullText).not.toMatch(/\{\{[^}]+\}\}/);

    // Páginas interiores contienen numeración coherente "Página X de N"
    for (let p = 2; p <= numPages; p++) {
      const pageText = allPagesText[p - 1]!;
      expect(pageText).toContain(`Página ${p} de ${numPages}`);
    }

    // Ningún texto queda fuera de las coordenadas de la hoja A4 (595.28 x 841.89 pt)
    for (const item of allItems) {
      expect(item.x).toBeGreaterThanOrEqual(-5);
      expect(item.x).toBeLessThanOrEqual(610);
      expect(item.y).toBeGreaterThanOrEqual(-5);
      expect(item.y).toBeLessThanOrEqual(855);
    }
  });

  it('Caso 2: Construcción sin suscripción (none) y sin hosting', async () => {
    const quote = makeQuote({
      planId: 'landing',
      extraPages: 0,
      subscriptionId: 'none',
      hosting: false,
    });
    const doc = React.createElement(QuoteDocument, { quote });
    const { fullText } = await extractPdfData(doc);

    // Total inicial 100.000, Abono 50.000, Saldo 50.000
    expect(fullText).toContain('$100.000');
    expect(fullText).toContain('$50.000');
    expect(fullText).not.toMatch(/\{\{[^}]+\}\}/);
  });

  it('Caso 3: Modalidad Venta con código fuente', async () => {
    const quote = makeQuote({
      projectType: 'venta',
      planId: 'landingFull',
      extraPages: 1,
      subscriptionId: 'premium', // Debe ser ignorada
      hosting: true,             // Debe ser ignorada
    });
    const doc = React.createElement(QuoteDocument, { quote });
    const { fullText } = await extractPdfData(doc);

    expect(fullText).toContain('Venta con código fuente');
    // Total inicial 230.000 + 15.000 = 245.000, Abono 122.500, Saldo 122.500
    expect(fullText).toContain('$245.000');
    expect(fullText).toContain('$122.500');

    // Sin suscripción en tabla de inversión inicial
    expect(fullText).not.toContain('Soporte mensual y alojamiento');
    expect(fullText).not.toMatch(/\{\{[^}]+\}\}/);
  });

  it('Caso 4: Moneda USD con tipo de cambio e información de referencia', async () => {
    const quote = makeQuote({
      currency: 'USD',
      exchangeRate: 950,
      exchangeNote: 'Observado Banco Central de Chile.',
    });
    const doc = React.createElement(QuoteDocument, { quote });
    const { fullText } = await extractPdfData(doc);

    // Valores en USD
    expect(fullText).toContain('US$');
    expect(fullText).toContain('950');
    expect(fullText).toContain('Valores expresados en USD al tipo de cambio de referencia');
    expect(fullText).not.toMatch(/\{\{[^}]+\}\}/);
  });

  it('Caso 5: Cliente con nombre muy largo no rompe maquetación', async () => {
    const quote = makeQuote({
      client: 'Empresa Internacional de Servicios Mineros y Metalúrgicos del Cono Sur de América SpA Limitada',
      project: 'Plataforma Web Corporativa Multi-Sede con Integración ERP y Portal de Proveedores',
    });
    const doc = React.createElement(QuoteDocument, { quote });
    const { fullText, numPages } = await extractPdfData(doc);

    expect(numPages).toBeGreaterThanOrEqual(4);
    expect(fullText).toContain('Empresa Internacional de Servicios Mineros');
    expect(fullText).not.toMatch(/\{\{[^}]+\}\}/);
  });

  it('Caso 6: Presupuesto Personalizado a Medida (Nombre personalizado, valor y abono)', async () => {
    const quote = makeQuote({
      quoteMode: 'custom',
      customConfig: {
        itemName: 'Desarrollo de Aplicación Móvil iOS/Android',
        description: 'App nativa con sincronización en tiempo real y notificaciones push',
        price: 750000,
        isOneTimePayment: true,
        paymentType: 'unique',
        requiresDeposit: true,
        depositPercent: 50,
        deliveryDays: 15,
      },
    });
    const doc = React.createElement(QuoteDocument, { quote });
    const { fullText, numPages } = await extractPdfData(doc);

    expect(numPages).toBeGreaterThanOrEqual(4);
    expect(fullText).toContain('Desarrollo de Aplicación Móvil iOS/Android');
    expect(fullText).toContain('App nativa con sincronización en tiempo real');
    expect(fullText).toContain('Presupuesto Personalizado (A medida)');
    expect(fullText).toContain('750.000');
    expect(fullText).toContain('375.000'); // 50% abono
    expect(fullText).not.toMatch(/\{\{[^}]+\}\}/);
  });

  it('Caso 7: Presupuesto Personalizado sin abono con pago 100% anticipado', async () => {
    const quote = makeQuote({
      quoteMode: 'custom',
      customConfig: {
        itemName: 'Auditoría de Ciberseguridad Web',
        description: 'Análisis de vulnerabilidades OWASP Top 10',
        price: 450000,
        isOneTimePayment: true,
        paymentType: 'unique',
        requiresDeposit: false,
        noDepositTiming: 'upfront',
        depositOption: 'upfront',
        deliveryDays: 5,
      },
    });
    const doc = React.createElement(QuoteDocument, { quote });
    const { fullText, numPages } = await extractPdfData(doc);

    expect(numPages).toBeGreaterThanOrEqual(4);
    expect(fullText).toContain('Auditoría de Ciberseguridad Web');
    expect(fullText).toContain('Pago 100% anticipado');
    expect(fullText).toContain('450.000');
    expect(fullText).not.toMatch(/\{\{[^}]+\}\}/);
  });
});
