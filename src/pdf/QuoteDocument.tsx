import React from 'react';
import {
  Document,
  Page,
  View,
  Image,
  Link,
} from '@react-pdf/renderer';
import { PdfText as Text } from './PdfText';
import type { Quote } from '../domain/types';
import { calculatePricing } from '../domain/pricing';
import { resolveTokens } from '../domain/tokens';
import { registerPdfFonts } from './fonts';
import { pdfStyles, pdfColors } from './styles';
import { ISOLOGO_WHITE_BASE64, ISOLOGO_BLACK_BASE64 } from './brandLogos';

// Registrar fuentes locales
registerPdfFonts();

export interface QuoteDocumentProps {
  quote: Quote;
}

export const QuoteDocument: React.FC<QuoteDocumentProps> = ({ quote }) => {
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
    terms,
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
  });

  const tokenContext = {
    catalog,
    currency,
    exchangeRate,
  };

  const plan = catalog.plans.find((p) => p.id === planId) || catalog.plans[0]!;
  const subscription = catalog.subscriptions.find((s) => s.id === subscriptionId);

  // Formato de fecha larga en español
  const dateParts = issuedOn.split('-');
  const dateObj = new Date(
    Number(dateParts[0]),
    Number(dateParts[1]) - 1,
    Number(dateParts[2])
  );
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
        {/* Cabecera Portada */}
        <View style={pdfStyles.coverHeader}>
          <Image src={ISOLOGO_WHITE_BASE64} style={pdfStyles.coverLogo} />
          <View>
            <Text style={pdfStyles.coverBrandText}>{issuer.name}</Text>
            <Text style={pdfStyles.coverDocSubtitle}>{issuer.brandSubtitle}</Text>
          </View>
        </View>

        {/* Bloque Central Portada */}
        <View style={pdfStyles.coverMain}>
          <Text style={pdfStyles.coverTitle}>Propuesta de</Text>
          <Text style={pdfStyles.coverTitle}>Servicios Web</Text>
          <Text style={pdfStyles.coverDescription}>{issuer.serviceTagline}</Text>

          <View style={pdfStyles.coverClientBox}>
            <Text style={pdfStyles.coverPreparedFor}>PREPARADO PARA:</Text>
            <Text style={pdfStyles.coverClientName}>{client}</Text>
            <Text style={pdfStyles.coverProjectTag}>{project}</Text>
          </View>
        </View>

        {/* Pie de Portada */}
        <View style={pdfStyles.coverFooter}>
          <Text>{formattedDate}</Text>
          <Text>{issuer.footerBrand}</Text>
        </View>
      </Page>

      {/* =========================================================================
          PÁGINA 2: DETALLE DE COTIZACIÓN & RESUMEN FINANCIERO
          ========================================================================= */}
      <Page size="A4" style={pdfStyles.interiorPage}>
          {/* Cabecera Fija */}
          <View style={pdfStyles.fixedHeader} fixed>
            <View style={pdfStyles.headerBrand}>
              <Image src={ISOLOGO_BLACK_BASE64} style={pdfStyles.headerLogo} />
              <Text style={pdfStyles.headerBrandTitle}>{issuer.name}</Text>
            </View>
            <Text style={pdfStyles.headerDocTag}>{issuer.brandSubtitle}</Text>
          </View>

        {/* Título de Página */}
        <Text style={pdfStyles.pageTitle}>Detalle de la cotización</Text>

        {/* Metadatos */}
        <View style={pdfStyles.metaGrid}>
          <View style={pdfStyles.metaItem}>
            <Text>
              <Text style={pdfStyles.metaLabel}>Cliente: </Text>
              {client}
            </Text>
          </View>
          <View style={pdfStyles.metaItem}>
            <Text>
              <Text style={pdfStyles.metaLabel}>Proyecto: </Text>
              {project}
            </Text>
          </View>
          <View style={pdfStyles.metaItem}>
            <Text>
              <Text style={pdfStyles.metaLabel}>Modalidad: </Text>
              {projectType === 'construccion'
                ? 'Construcción y mantención'
                : 'Venta con código fuente'}
            </Text>
          </View>
          <View style={pdfStyles.metaItem}>
            <Text>
              <Text style={pdfStyles.metaLabel}>Versión: </Text>
              {versionText}
            </Text>
          </View>
          <View style={pdfStyles.metaItem}>
            <Text>
              <Text style={pdfStyles.metaLabel}>Fecha de emisión: </Text>
              {formattedDate}
            </Text>
          </View>
          <View style={pdfStyles.metaItem}>
            <Text>
              <Text style={pdfStyles.metaLabel}>Prototipo: </Text>
              {prototypeUrl ? (
                <Link src={prototypeUrl} style={{ color: pdfColors.navy700 }}>
                  Ver prototipo interactivo
                </Link>
              ) : (
                'No proporciona / No aplica'
              )}
            </Text>
          </View>
        </View>

        {/* Tabla 1: Inversión Inicial */}
        <Text style={pdfStyles.sectionTitle}>1. Inversión inicial (Desarrollo)</Text>
        <View style={pdfStyles.table} wrap={false}>
          <View style={pdfStyles.tableHeaderRow}>
            <Text style={[pdfStyles.tableHeaderCell, { width: '40%' }]}>CONCEPTO</Text>
            <Text style={[pdfStyles.tableHeaderCell, { width: '40%' }]}>DETALLE</Text>
            <Text style={[pdfStyles.tableHeaderCell, { width: '20%', textAlign: 'right' }]}>
              MONTO ({currency})
            </Text>
          </View>

          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, { width: '40%', fontWeight: 700 }]}>
              {plan.name}
            </Text>
            <Text style={[pdfStyles.tableCell, { width: '40%', color: pdfColors.inkMuted }]}>
              {projectType === 'construccion' ? plan.build.desc : plan.sale.desc}
            </Text>
            <Text style={[pdfStyles.tableCellRight, { width: '20%' }]}>
              {pricing.formatted.baseAmount}
            </Text>
          </View>

          {extraPages > 0 && (
            <View style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.tableCell, { width: '40%', fontWeight: 700 }]}>
                Páginas adicionales
              </Text>
              <Text style={[pdfStyles.tableCell, { width: '40%', color: pdfColors.inkMuted }]}>
                {extraPages} página(s) extra(s)
              </Text>
              <Text style={[pdfStyles.tableCellRight, { width: '20%' }]}>
                {pricing.formatted.extraAmount}
              </Text>
            </View>
          )}
        </View>

        {/* Tabla 2: Suscripción y Alojamiento (Solo Construcción) */}
        {projectType === 'construccion' && subscription && (
          <>
            <Text style={pdfStyles.sectionTitle}>2. Soporte mensual y alojamiento</Text>
            <View style={pdfStyles.table} wrap={false}>
              <View style={pdfStyles.tableHeaderRow}>
                <Text style={[pdfStyles.tableHeaderCell, { width: '40%' }]}>SERVICIO</Text>
                <Text style={[pdfStyles.tableHeaderCell, { width: '40%' }]}>COBERTURA</Text>
                <Text style={[pdfStyles.tableHeaderCell, { width: '20%', textAlign: 'right' }]}>
                  MENSUAL ({currency})
                </Text>
              </View>

              <View style={pdfStyles.tableRow}>
                <Text style={[pdfStyles.tableCell, { width: '40%', fontWeight: 700 }]}>
                  Plan {subscription.name}
                </Text>
                <Text style={[pdfStyles.tableCell, { width: '40%', color: pdfColors.inkMuted }]}>
                  {subscription.desc}
                </Text>
                <Text style={[pdfStyles.tableCellRight, { width: '20%' }]}>
                  {pricing.formatted.subscriptionAmount}
                </Text>
              </View>

              {hosting && (
                <View style={pdfStyles.tableRow}>
                  <Text style={[pdfStyles.tableCell, { width: '40%', fontWeight: 700 }]}>
                    Alojamiento Web (Hosting)
                  </Text>
                  <Text style={[pdfStyles.tableCell, { width: '40%', color: pdfColors.inkMuted }]}>
                    {catalog.hosting.label}
                  </Text>
                  <Text style={[pdfStyles.tableCellRight, { width: '20%' }]}>
                    {pricing.formatted.hostingAmount}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Caja de Resumen Financiero */}
        <View style={pdfStyles.summaryBox} wrap={false}>
          <View style={pdfStyles.summaryRow}>
            <Text style={{ color: pdfColors.inkMuted }}>Total inversión inicial:</Text>
            <Text style={{ fontWeight: 700 }}>{pricing.formatted.initialTotal}</Text>
          </View>
          <View style={pdfStyles.summaryRow}>
            <Text style={{ color: pdfColors.inkMuted }}>
              Abono inicial para iniciar ({catalog.depositPercent}%):
            </Text>
            <Text style={{ fontWeight: 700, color: pdfColors.navy700 }}>
              {pricing.formatted.deposit}
            </Text>
          </View>
          <View style={pdfStyles.summaryRowHighlight}>
            <Text>Saldo contraentrega:</Text>
            <Text>{pricing.formatted.balance}</Text>
          </View>
        </View>

        {/* Condiciones de Entrega */}
        <View style={pdfStyles.callout} wrap={false}>
          <Text style={{ fontWeight: 700, marginBottom: 2 }}>Plazos y Entrega:</Text>
          <Text>
            {projectType === 'construccion'
              ? `El desarrollo del sitio tiene un plazo promedio de ${catalog.deliveryBusinessDays} días hábiles una vez recibido el abono inicial y los contenidos necesarios. Contraentrega: Una vez pagado el saldo restante más el primer mes de mantención/hosting, se publica el sitio web.`
              : `El desarrollo tiene un plazo estimado de ${catalog.deliveryBusinessDays} días hábiles. El traspaso del código fuente se realizará una vez pagado el saldo total restante, en forma de repositorio GitHub o archivo comprimido.`}
          </Text>
        </View>

        {/* Datos Bancarios */}
        <View style={{ marginTop: 6 }} wrap={false}>
          <Text style={{ fontWeight: 700, fontSize: 8.5, color: pdfColors.navy900 }}>
            Datos para transferencia bancaria:
          </Text>
          {issuer.bankDetails.map((line, idx) => (
            <Text key={idx} style={{ fontSize: 8, color: pdfColors.inkMuted }}>
              • {line}
            </Text>
          ))}
        </View>

        {/* Nota USD si aplica */}
        {currency === 'USD' && exchangeRate && (
          <Text style={{ marginTop: 8, fontSize: 7.5, color: pdfColors.inkMuted }}>
            * Valores expresados en USD al tipo de cambio de referencia de {exchangeRate} CLP por 1 USD. {quote.exchangeNote || ''}
          </Text>
        )}

        {/* Pie Fijo */}
        <View style={pdfStyles.fixedFooter} fixed>
          <Text>
            {client} · {project}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>

      {/* =========================================================================
          PÁGINAS 3 A N: CLÁUSULAS Y PÁGINAS NORMATIVAS (terms)
          ========================================================================= */}
      {terms.pages.map((termsPage) => {
        // Filtrar secciones que tengan bloques visibles según projectType
        const visibleSections = termsPage.sections
          .map((sec) => ({
            ...sec,
            blocks: sec.blocks.filter(
              (b) => !b.showWhen?.projectType || b.showWhen.projectType === projectType
            ),
          }))
          .filter((sec) => sec.blocks.length > 0);

        if (visibleSections.length === 0) return null;

        return (
          <Page key={termsPage.pageNumber} size="A4" style={pdfStyles.interiorPage}>
            {/* Cabecera Fija */}
            <View style={pdfStyles.fixedHeader} fixed>
              <View style={pdfStyles.headerBrand}>
                <Image src={ISOLOGO_BLACK_BASE64} style={pdfStyles.headerLogo} />
                <Text style={pdfStyles.headerBrandTitle}>{issuer.name}</Text>
              </View>
              <Text style={pdfStyles.headerDocTag}>{issuer.documentTag}</Text>
            </View>

            {/* Secciones de la página */}
            {visibleSections.map((sec) => (
              <View key={sec.id} style={{ marginBottom: 12 }}>
                {sec.title ? (
                  <Text style={pdfStyles.sectionTitle}>{sec.title}</Text>
                ) : null}

                {sec.blocks.map((block, bIdx) => {
                  if (block.type === 'paragraph') {
                    return (
                      <Text key={bIdx} style={{ marginBottom: 6 }}>
                        {resolveTokens(block.content, tokenContext)}
                      </Text>
                    );
                  }

                  if (block.type === 'callout') {
                    return (
                      <View key={bIdx} style={pdfStyles.callout} wrap={false}>
                        {block.title && (
                          <Text style={{ fontWeight: 700, marginBottom: 2 }}>
                            {block.title}
                          </Text>
                        )}
                        <Text>{resolveTokens(block.content, tokenContext)}</Text>
                      </View>
                    );
                  }

                  if (block.type === 'list') {
                    return (
                      <View key={bIdx} style={{ marginBottom: 6, paddingLeft: 8 }} wrap={false}>
                        {block.items.map((it, iIdx) => (
                          <Text key={iIdx} style={{ marginBottom: 2 }}>
                            • {resolveTokens(it, tokenContext)}
                          </Text>
                        ))}
                      </View>
                    );
                  }

                  if (block.type === 'tags') {
                    return (
                      <View key={bIdx} style={pdfStyles.tagList} wrap={false}>
                        {block.tags.map((tg, tIdx) => (
                          <View key={tIdx} style={pdfStyles.tagBadge}>
                            <Text>{resolveTokens(tg, tokenContext)}</Text>
                          </View>
                        ))}
                      </View>
                    );
                  }

                  if (block.type === 'table') {
                    return (
                      <View key={bIdx} style={pdfStyles.table} wrap={false}>
                        {block.rows.map((row, rIdx) => (
                          <View
                            key={rIdx}
                            style={rIdx === 0 ? pdfStyles.tableHeaderRow : pdfStyles.tableRow}
                          >
                            {row.map((cell, cIdx) => (
                              <Text
                                key={cIdx}
                                style={[
                                  rIdx === 0 ? pdfStyles.tableHeaderCell : pdfStyles.tableCell,
                                  { flex: 1 },
                                ]}
                              >
                                {resolveTokens(cell, tokenContext)}
                              </Text>
                            ))}
                          </View>
                        ))}
                      </View>
                    );
                  }

                  if (block.type === 'catalogTable') {
                    return (
                      <View key={bIdx} style={pdfStyles.table} wrap={false}>
                        <View style={pdfStyles.tableHeaderRow}>
                          <Text style={[pdfStyles.tableHeaderCell, { width: '40%' }]}>PLAN</Text>
                          <Text style={[pdfStyles.tableHeaderCell, { width: '40%' }]}>ALCANCE</Text>
                          <Text style={[pdfStyles.tableHeaderCell, { width: '20%', textAlign: 'right' }]}>
                            VALOR
                          </Text>
                        </View>
                        {block.source === 'plans'
                          ? catalog.plans.map((p) => (
                              <View key={p.id} style={pdfStyles.tableRow}>
                                <Text style={[pdfStyles.tableCell, { width: '40%', fontWeight: 700 }]}>
                                  {p.name}
                                </Text>
                                <Text style={[pdfStyles.tableCell, { width: '40%', color: pdfColors.inkMuted }]}>
                                  {projectType === 'construccion' ? p.build.desc : p.sale.desc}
                                </Text>
                                <Text style={[pdfStyles.tableCellRight, { width: '20%' }]}>
                                  {currency === 'CLP'
                                    ? `$${(projectType === 'construccion' ? p.build.price : p.sale.price).toLocaleString('es-CL')} CLP`
                                    : `US$${((projectType === 'construccion' ? p.build.price : p.sale.price) / (exchangeRate || 950)).toFixed(2)}`}
                                </Text>
                              </View>
                            ))
                          : catalog.subscriptions.map((s) => (
                              <View key={s.id} style={pdfStyles.tableRow}>
                                <Text style={[pdfStyles.tableCell, { width: '40%', fontWeight: 700 }]}>
                                  {s.name}
                                </Text>
                                <Text style={[pdfStyles.tableCell, { width: '40%', color: pdfColors.inkMuted }]}>
                                  {s.desc}
                                </Text>
                                <Text style={[pdfStyles.tableCellRight, { width: '20%' }]}>
                                  {currency === 'CLP'
                                    ? `$${s.price.toLocaleString('es-CL')} CLP/mes`
                                    : `US$${(s.price / (exchangeRate || 950)).toFixed(2)}/mes`}
                                </Text>
                              </View>
                            ))}
                      </View>
                    );
                  }

                  return null;
                })}
              </View>
            ))}

            {/* Pie Fijo */}
            <View style={pdfStyles.fixedFooter} fixed>
              <Text>
                {client} · {project}
              </Text>
              <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
            </View>
          </Page>
        );
      })}
    </Document>
  );
};
