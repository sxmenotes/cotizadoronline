import React from 'react';
import { Document, Page, View, Image, Link } from '@react-pdf/renderer';
import { PdfText as Text } from './PdfText';
import type { Quote, SkeletonDesign } from '../domain/types';
import { calculatePricing } from '../domain/pricing';
import { buildPaymentPlan, shouldIncludeServices, type PaymentStep } from '../domain/paymentSchedule';
import { registerPdfFonts } from './fonts';
import { pdfStyles, pdfColors } from './styles';
import { ISOLOGO_WHITE_BASE64 } from './brandLogos';
import { InteriorHeader, InteriorFooter } from './PdfChrome';
import { ServicesPresentation } from './ServicesPresentation';
import { SkeletonPages } from '../features/skeleton/wireframe/SkeletonDocument';

// Registrar fuentes locales
registerPdfFonts();

export interface QuoteDocumentProps {
  quote: Quote;
  skeletonDesign?: SkeletonDesign | undefined;
}

interface DetailRow {
  concept: string;
  detail?: string | undefined;
  amount: string;
}

/** Tabla de conceptos con fila de total */
const DetailTable: React.FC<{
  amountHeader: string;
  rows: DetailRow[];
  totalLabel: string;
  totalAmount: string;
}> = ({ amountHeader, rows, totalLabel, totalAmount }) => (
  <View style={[pdfStyles.table, { marginBottom: 6 }]} wrap={false}>
    <View style={pdfStyles.tableHeaderRow}>
      <Text style={[pdfStyles.tableHeaderCell, { width: '75%' }]}>Concepto</Text>
      <Text style={[pdfStyles.tableHeaderCell, { width: '25%', textAlign: 'right' }]}>{amountHeader}</Text>
    </View>
    {rows.map((r, i) => (
      <View key={i} style={pdfStyles.tableRow}>
        <View style={{ width: '75%', paddingRight: 8 }}>
          <Text style={[pdfStyles.tableCell, { fontWeight: 700, color: pdfColors.navy900 }]}>{r.concept}</Text>
          {r.detail ? (
            <Text style={[pdfStyles.tableCell, { color: pdfColors.inkMuted, fontSize: 7.8, marginTop: 1.5 }]}>
              {r.detail}
            </Text>
          ) : null}
        </View>
        <Text style={[pdfStyles.tableCellRight, { width: '25%' }]}>{r.amount}</Text>
      </View>
    ))}
    <View style={pdfStyles.tableTotalRow}>
      <Text style={[pdfStyles.tableCell, { width: '75%', fontWeight: 700, color: pdfColors.navy900 }]}>
        {totalLabel}
      </Text>
      <Text style={[pdfStyles.tableCellRight, { width: '25%', fontWeight: 700, fontSize: 9.5 }]}>{totalAmount}</Text>
    </View>
  </View>
);

/** Tarjeta de un pago dentro del esquema de pagos */
const StepCard: React.FC<{ step: PaymentStep }> = ({ step }) => (
  <View style={[pdfStyles.stepCard, step.isDeposit ? pdfStyles.stepCardDeposit : {}]}>
    {step.percentLabel ? (
      <Text style={[pdfStyles.stepBadge, step.isDeposit ? pdfStyles.stepBadgeDeposit : {}]}>
        {step.percentLabel}
      </Text>
    ) : null}
    <Text style={pdfStyles.stepTitle}>{step.title}</Text>
    <Text style={pdfStyles.stepAmount}>{step.amount}</Text>
    <Text style={pdfStyles.stepWhen}>{step.when}</Text>
    {step.breakdown ? <Text style={pdfStyles.stepBreakdown}>{step.breakdown}</Text> : null}
  </View>
);

export const QuoteDocument: React.FC<QuoteDocumentProps> = ({ quote, skeletonDesign }) => {
  const {
    client,
    project,
    prototypeUrl,
    versionType,
    versionNote,
    projectType,
    planId,
    extraPages,
    subscriptionId,
    hosting,
    currency,
    exchangeRate,
    catalog,
    issuer,
    issuedOn,
  } = quote;

  // Cálculo de totales
  const pricing = calculatePricing({
    projectType,
    planId,
    extraPages,
    subscriptionId,
    hosting,
    currency,
    exchangeRate,
    catalog,
    quoteMode: quote.quoteMode,
    customConfig: quote.customConfig,
  });

  const paymentPlan = buildPaymentPlan(quote, pricing);
  const includeServices = shouldIncludeServices(quote);

  const custom = quote.quoteMode === 'custom' ? quote.customConfig : undefined;
  const isCustom = !!custom;

  const plan = catalog.plans.find((p) => p.id === planId) || catalog.plans[0]!;
  const subscription = catalog.subscriptions.find((s) => s.id === subscriptionId);

  // Formato de fecha larga en español
  const dateParts = issuedOn.split('-');
  const dateObj = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
  const formattedDate = dateObj.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const versionText =
    versionType === 'first'
      ? 'Primera cotización'
      : versionType === 'revision'
      ? `Revisión: ${versionNote || 'Detalle'}`
      : 'Cotización final';

  const modalityText = isCustom
    ? 'Presupuesto Personalizado (A medida)'
    : projectType === 'construccion'
    ? 'Construcción y mantención'
    : 'Venta con código fuente';

  // ---------------------------------------------------------------------------
  // Filas de detalle ("¿Qué incluye?")
  // ---------------------------------------------------------------------------
  const detailRows: DetailRow[] = [];
  let detailTotalLabel = 'Total';
  let monthlyRows: DetailRow[] = [];

  if (custom) {
    const isRecurring = !custom.isOneTimePayment && custom.paymentType === 'recurring';
    detailRows.push({
      concept: custom.itemName || 'Presupuesto Personalizado',
      detail: custom.description || undefined,
      amount: isRecurring ? pricing.formatted.monthlyTotal : pricing.formatted.baseAmount,
    });
    detailTotalLabel = isRecurring
      ? `Total ${custom.billingPeriod === 'yearly' ? 'anual' : 'mensual'}`
      : 'Total del servicio';
  } else {
    detailRows.push({
      concept: plan.name,
      detail: projectType === 'construccion' ? plan.build.desc : plan.sale.desc,
      amount: pricing.formatted.baseAmount,
    });
    if (extraPages > 0) {
      detailRows.push({
        concept: 'Páginas adicionales',
        detail: `${extraPages} ${extraPages === 1 ? 'página extra' : 'páginas extra'}`,
        amount: pricing.formatted.extraAmount,
      });
    }
    detailTotalLabel = 'Total del desarrollo (pago único)';

    if (projectType === 'construccion' && pricing.monthlyTotal > 0) {
      monthlyRows = [];
      if (subscription && pricing.subscriptionAmount > 0) {
        monthlyRows.push({
          concept: `Mantención Plan ${subscription.name}`,
          detail: subscription.desc,
          amount: pricing.formatted.subscriptionAmount,
        });
      }
      if (hosting && pricing.hostingAmount > 0) {
        monthlyRows.push({
          concept: 'Hosting (alojamiento web)',
          detail: 'Servidor donde queda publicado tu sitio',
          amount: pricing.formatted.hostingAmount,
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Plazos y entrega
  // ---------------------------------------------------------------------------
  let deliveryText: string;
  if (custom) {
    const days = custom.deliveryDays || catalog.deliveryBusinessDays;
    const upfront =
      !custom.requiresDeposit &&
      (custom.noDepositTiming === 'upfront' ||
        custom.depositOption === 'upfront' ||
        custom.depositOption === 'full_upfront');
    deliveryText = custom.deliveryConditions
      ? custom.deliveryConditions
      : custom.requiresDeposit
      ? `Plazo estimado de ${days} días hábiles desde la confirmación del abono inicial y la recepción de los antecedentes solicitados. El saldo se paga contra entrega, con el trabajo aprobado.`
      : upfront
      ? `Plazo estimado de ${days} días hábiles desde la acreditación del pago total y la recepción de los antecedentes requeridos. No quedan pagos pendientes al momento de la entrega.`
      : `Plazo estimado de ${days} días hábiles. El pago total se realiza contra entrega, una vez finalizado y aprobado el trabajo.`;
  } else {
    deliveryText =
      projectType === 'construccion'
        ? `Plazo promedio de ${catalog.deliveryBusinessDays} días hábiles desde la recepción del abono inicial y los contenidos necesarios. El sitio se publica una vez pagado el saldo junto al primer mes de mantención.`
        : `Plazo estimado de ${catalog.deliveryBusinessDays} días hábiles. El código fuente se entrega (repositorio GitHub o archivo comprimido) una vez pagado el saldo restante.`;
  }

  const steps = paymentPlan.steps;
  const useCards = steps.length <= 3;

  return (
    <Document
      title={`Presupuesto_${client}_${project}`}
      author={issuer.name}
      subject="Propuesta de Servicios y Desarrollo Web"
      creator="Creador de Presupuestos SV"
      language="es-CL"
    >
      {/* =========================================================================
          PÁGINA 1: PORTADA EDITORIAL (Fondo Azul Marino)
          ========================================================================= */}
      <Page size="A4" style={pdfStyles.coverPage}>
        <View style={pdfStyles.coverHeader}>
          <Image src={ISOLOGO_WHITE_BASE64} style={pdfStyles.coverLogo} />
          <View>
            <Text style={pdfStyles.coverBrandText}>{issuer.name}</Text>
            <Text style={pdfStyles.coverDocSubtitle}>{issuer.brandSubtitle}</Text>
          </View>
        </View>

        <View style={pdfStyles.coverMain}>
          <Text style={pdfStyles.coverTitle}>Propuesta de</Text>
          <Text style={pdfStyles.coverTitle}>{isCustom ? 'Servicios' : 'Servicios Web'}</Text>
          <Text style={pdfStyles.coverDescription}>{issuer.serviceTagline}</Text>

          <View style={pdfStyles.coverClientBox}>
            <Text style={pdfStyles.coverPreparedFor}>PREPARADO PARA:</Text>
            <Text style={pdfStyles.coverClientName}>{client}</Text>
            <Text style={pdfStyles.coverProjectTag}>{project}</Text>
          </View>
        </View>

        <View style={pdfStyles.coverFooter}>
          <Text>{formattedDate}</Text>
          <Text>{issuer.footerBrand}</Text>
        </View>
      </Page>

      {/* =========================================================================
          PÁGINA 2: RESUMEN DE LA COTIZACIÓN
          ========================================================================= */}
      <Page size="A4" style={pdfStyles.interiorPage}>
        <InteriorHeader brand={issuer.name} tag={issuer.brandSubtitle} />

        <Text style={pdfStyles.eyebrow}>Tu cotización</Text>
        <Text style={pdfStyles.pageTitle}>Resumen de la cotización</Text>

        {/* Metadatos */}
        <View style={pdfStyles.metaStrip}>
          {[
            ['Cliente', client],
            ['Proyecto', project],
            ['Fecha de emisión', formattedDate],
            ['Modalidad', modalityText],
            ['Versión', versionText],
          ].map(([label, value]) => (
            <View key={label} style={pdfStyles.metaCell}>
              <Text style={pdfStyles.metaCellLabel}>{label}</Text>
              <Text style={pdfStyles.metaCellValue}>{value}</Text>
            </View>
          ))}
          <View style={pdfStyles.metaCell}>
            <Text style={pdfStyles.metaCellLabel}>Prototipo</Text>
            {prototypeUrl ? (
              <Link src={prototypeUrl} style={[pdfStyles.metaCellValue, { color: pdfColors.navy700 }]}>
                Ver prototipo interactivo
              </Link>
            ) : (
              <Text style={[pdfStyles.metaCellValue, { color: pdfColors.inkMuted, fontWeight: 400 }]}>
                No aplica
              </Text>
            )}
          </View>
        </View>

        {/* 1. Qué incluye */}
        <Text style={pdfStyles.blockLabel}>1 · Qué incluye</Text>
        <DetailTable
          amountHeader={`Monto (${currency})`}
          rows={detailRows}
          totalLabel={detailTotalLabel}
          totalAmount={
            custom && !custom.isOneTimePayment && custom.paymentType === 'recurring'
              ? pricing.formatted.monthlyTotal
              : pricing.formatted.initialTotal
          }
        />
        {monthlyRows.length > 0 && (
          <DetailTable
            amountHeader={`Mensual (${currency})`}
            rows={monthlyRows}
            totalLabel="Total mensual (desde la publicación)"
            totalAmount={pricing.formatted.monthlyTotal}
          />
        )}

        {/* 2. Total y esquema de pagos */}
        <View wrap={false}>
          <Text style={pdfStyles.blockLabel}>2 · Cuánto y cuándo se paga</Text>
          <View style={pdfStyles.totalHero}>
            <View style={{ flex: 1, paddingRight: 14 }}>
              <Text style={pdfStyles.totalHeroLabel}>{paymentPlan.totalLabel}</Text>
              <Text style={pdfStyles.totalHeroCaption}>{paymentPlan.totalCaption}</Text>
            </View>
            <Text style={pdfStyles.totalHeroAmount}>
              {paymentPlan.totalAmount}
              {paymentPlan.totalSuffix ? (
                <Text style={pdfStyles.totalHeroSuffix}> {paymentPlan.totalSuffix}</Text>
              ) : null}
            </Text>
          </View>

          {useCards ? (
            <View style={pdfStyles.stepsRow}>
              {steps.map((s, i) => (
                <StepCard key={i} step={s} />
              ))}
            </View>
          ) : (
            <View style={pdfStyles.table}>
              <View style={pdfStyles.tableHeaderRow}>
                <Text style={[pdfStyles.tableHeaderCell, { width: '25%' }]}>Cuota</Text>
                <Text style={[pdfStyles.tableHeaderCell, { width: '50%' }]}>Cuándo</Text>
                <Text style={[pdfStyles.tableHeaderCell, { width: '25%', textAlign: 'right' }]}>Monto</Text>
              </View>
              {steps.map((s, i) => (
                <View
                  key={i}
                  style={[pdfStyles.stepListRow, s.isDeposit ? { backgroundColor: '#FCF8EE' } : {}]}
                >
                  <Text style={[pdfStyles.tableCell, { width: '25%', fontWeight: 700, color: pdfColors.navy900 }]}>
                    {s.title}
                  </Text>
                  <Text style={[pdfStyles.tableCell, { width: '50%', color: pdfColors.inkMuted }]}>{s.when}</Text>
                  <Text style={[pdfStyles.tableCellRight, { width: '25%' }]}>{s.amount}</Text>
                </View>
              ))}
            </View>
          )}

          {paymentPlan.recurring && (
            <View style={pdfStyles.recurringBox}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={pdfStyles.stepTitle}>{paymentPlan.recurring.label}</Text>
                <Text style={pdfStyles.stepWhen}>{paymentPlan.recurring.detail}</Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: 700, color: pdfColors.navy900 }}>
                {paymentPlan.recurring.amount}
                <Text style={{ fontSize: 8.5, fontWeight: 500, color: pdfColors.inkMuted }}>
                  {' '}
                  {paymentPlan.recurring.periodLabel}
                </Text>
              </Text>
            </View>
          )}
        </View>

        {/* 3. Plazos y datos de pago */}
        <View wrap={false}>
          <Text style={pdfStyles.blockLabel}>3 · Plazos y forma de pago</Text>
          <View style={[pdfStyles.twoCols, { marginBottom: 4 }]}>
            <View style={[pdfStyles.callout, { flex: 1, marginTop: 0, marginBottom: 0 }]}>
              <Text style={{ fontWeight: 700, fontSize: 8.5, marginBottom: 2 }}>Plazo de entrega</Text>
              <Text style={{ fontSize: 8, lineHeight: 1.35 }}>{deliveryText}</Text>
            </View>
            <View style={[pdfStyles.callout, { flex: 1, marginTop: 0, marginBottom: 0, borderLeftColor: pdfColors.brass }]}>
              <Text style={{ fontWeight: 700, fontSize: 8.5, marginBottom: 2 }}>Datos para transferencia</Text>
              {issuer.bankDetails.map((line, idx) => (
                <Text key={idx} style={{ fontSize: 8, lineHeight: 1.35 }}>{line}</Text>
              ))}
            </View>
          </View>
        </View>

        {currency === 'USD' && exchangeRate && (
          <Text style={{ marginTop: 4, fontSize: 7.2, color: pdfColors.inkMuted }}>
            * Valores expresados en USD al tipo de cambio de referencia de {exchangeRate} CLP por 1 USD.{' '}
            {quote.exchangeNote || ''}
          </Text>
        )}

        {includeServices && (
          <Text style={{ marginTop: 4, fontSize: 7.2, color: pdfColors.inkMuted }}>
            En las páginas siguientes encontrarás un anexo con una breve presentación de los servicios
            y sus condiciones.
          </Text>
        )}

        <InteriorFooter left={`${client} · ${project}`} />
      </Page>

      {/* =========================================================================
          PÁGINAS 3+: ANEXO OPCIONAL "PRESENTACIÓN DE SERVICIOS"
          ========================================================================= */}
      {includeServices && <ServicesPresentation quote={quote} />}

      {/* Renderizar el Esqueleto de Diseño al final si está incluido */}
      {skeletonDesign && <SkeletonPages design={skeletonDesign} />}
    </Document>
  );
};
