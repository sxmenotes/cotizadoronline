import React from 'react';
import { Page, View } from '@react-pdf/renderer';
import { PdfText as Text } from './PdfText';
import { pdfStyles, pdfColors } from './styles';
import { InteriorHeader, InteriorFooter, Bullet } from './PdfChrome';
import { formatCatalogPrice } from '../domain/pricing';
import type { Quote } from '../domain/types';

/**
 * Anexo "Presentación de servicios".
 * Separado de la cotización mediante una portada propia. Todo el contenido se
 * deriva del catálogo guardado en la cotización, por lo que precios y planes
 * siempre coinciden con lo configurado en Ajustes.
 */

const ANNEX_TAG = 'Anexo · Presentación de servicios';

const GREEN = '#2E7D50';
const BRASS_DARK = '#7A5A1E';

// Condiciones de páginas nuevas por suscripción (claves del catálogo por defecto)
const NEW_PAGE_RULES: Record<string, (extra: string) => string> = {
  basico: (extra) => `Cada página nueva se cotiza aparte: ${extra} c/u.`,
  full: (extra) => `1 página nueva sin costo al año. Las siguientes: ${extra} c/u.`,
  premium: () => 'Igual que Full, con prioridad de agendamiento sobre otros clientes.',
};

const SectionHead: React.FC<{ num: number; title: string; lead?: string }> = ({ num, title, lead }) => (
  <View style={pdfStyles.svcSectionHead} wrap={false}>
    <Text style={pdfStyles.svcSectionNum}>{String(num)}</Text>
    <View style={{ flex: 1 }}>
      <Text style={pdfStyles.svcSectionTitle}>{title}</Text>
      {lead ? <Text style={pdfStyles.svcSectionLead}>{lead}</Text> : null}
    </View>
  </View>
);

export const ServicesPresentation: React.FC<{ quote: Quote }> = ({ quote }) => {
  const { catalog, issuer, currency, exchangeRate, client, project } = quote;
  const price = (clp: number) => formatCatalogPrice(clp, currency, exchangeRate);
  const isStandard = quote.quoteMode !== 'custom';
  const isBuild = quote.projectType === 'construccion';
  const footerLeft = `${client} · ${project}`;

  const paidSubs = catalog.subscriptions.filter((s) => s.price > 0);
  const minSub = paidSubs.length ? Math.min(...paidSubs.map((s) => s.price)) : 0;
  const extra = price(catalog.extraPagePrice);
  const hosting = price(catalog.hosting.monthlyPrice);
  const examplePlan = catalog.plans[0];
  const minBuild = catalog.plans.length ? Math.min(...catalog.plans.map((p) => p.build.price)) : 0;
  const minSale = catalog.plans.length ? Math.min(...catalog.plans.map((p) => p.sale.price)) : 0;

  const index = [
    { t: 'Construcción de tu sitio web', s: 'Planes y valores de desarrollo' },
    { t: 'Mantención mensual', s: 'Soporte continuo para tu sitio' },
    { t: 'Cambios incluidos y cambios cotizados aparte', s: 'Qué cubre tu mensualidad' },
    { t: 'Dominio y hosting', s: 'Cómo funcionan y quién los contrata' },
    { t: 'Venta con código fuente', s: 'Tu sitio completo, sin mensualidad' },
    { t: '¿Qué opción me conviene?', s: 'Comparación rápida' },
  ];

  return (
    <>
      {/* =====================================================================
          PORTADA DEL ANEXO
          ===================================================================== */}
      <Page size="A4" style={pdfStyles.annexCoverPage}>
        <View>
          <Text style={pdfStyles.eyebrow}>Anexo informativo</Text>
          <Text style={pdfStyles.annexTitle}>Presentación</Text>
          <Text style={pdfStyles.annexTitle}>de servicios</Text>
          <Text style={pdfStyles.annexLead}>
            Una breve guía sobre cómo trabajo, los planes disponibles y sus condiciones, para que
            puedas entender con claridad cada alternativa.
          </Text>

          <View style={pdfStyles.annexNotice}>
            <Text style={{ fontWeight: 700, fontSize: 9, color: pdfColors.navy900, marginBottom: 2 }}>
              Esta sección es solo referencial.
            </Text>
            <Text style={{ fontSize: 9, lineHeight: 1.45 }}>
              Los montos de tu propuesta están en la página 2, "Resumen de la cotización". Lo que
              sigue no modifica ni agrega cobros a lo cotizado.
            </Text>
          </View>
        </View>

        <View>
          <Text style={[pdfStyles.blockLabel, { marginBottom: 2 }]}>Contenido</Text>
          {index.map((it, i) => (
            <View key={i} style={pdfStyles.annexIndexRow}>
              <Text style={pdfStyles.annexIndexNum}>{String(i + 1).padStart(2, '0')}</Text>
              <View style={{ flex: 1 }}>
                <Text style={pdfStyles.annexIndexText}>{it.t}</Text>
                <Text style={pdfStyles.annexIndexSub}>{it.s}</Text>
              </View>
            </View>
          ))}
        </View>

        <View
          style={[
            pdfStyles.coverFooter,
            { borderTopColor: pdfColors.hairline, color: pdfColors.inkMuted },
          ]}
        >
          <Text>{issuer.footerBrand}</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>

      {/* =====================================================================
          1 y 2: CONSTRUCCIÓN + MANTENCIÓN
          ===================================================================== */}
      <Page size="A4" style={pdfStyles.interiorPage}>
        <InteriorHeader brand={issuer.name} tag={ANNEX_TAG} />

        <SectionHead
          num={1}
          title="Construcción de tu sitio web"
          lead="Pago único por el diseño y desarrollo de tu sitio. Al contratarlo, puedes suscribirte a un plan de mantención mensual."
        />
        <View style={pdfStyles.cardsRow} wrap={false}>
          {catalog.plans.map((p) => {
            const active = isStandard && isBuild && p.id === quote.planId;
            return (
              <View key={p.id} style={[pdfStyles.planCard, active ? pdfStyles.planCardActive : {}]}>
                {active ? <Text style={pdfStyles.activeBadge}>Tu plan</Text> : null}
                <Text style={pdfStyles.planCardName}>{p.name}</Text>
                <Text style={pdfStyles.planCardPrice}>{price(p.build.price)}</Text>
                <Text style={pdfStyles.planCardPriceNote}>
                  Pago único · {p.pages} {p.pages === 1 ? 'página' : 'páginas'}
                </Text>
                <Text style={pdfStyles.planCardDesc}>{p.build.desc}</Text>
              </View>
            );
          })}
        </View>
        <View style={pdfStyles.noteLine} wrap={false}>
          <Text>
            <Text style={{ fontWeight: 700 }}>¿Necesitas más páginas? </Text>
            Cada página adicional a las de tu plan cuesta {extra}.
          </Text>
        </View>

        {paidSubs.length > 0 && (
          <>
            <SectionHead
              num={2}
              title="Mantención mensual"
              lead="Mantiene tu sitio funcionando, actualizado y con soporte continuo. Elige el nivel que mejor se ajuste a ti."
            />
            <View style={pdfStyles.cardsRow} wrap={false}>
              {paidSubs.map((s) => {
                const active = isStandard && isBuild && s.id === quote.subscriptionId;
                return (
                  <View key={s.id} style={[pdfStyles.planCard, active ? pdfStyles.planCardActive : {}]}>
                    {active ? <Text style={pdfStyles.activeBadge}>Tu plan</Text> : null}
                    <Text style={pdfStyles.planCardName}>Plan {s.name}</Text>
                    <Text style={pdfStyles.planCardPrice}>{price(s.price)}</Text>
                    <Text style={pdfStyles.planCardPriceNote}>por mes</Text>
                    <Text style={pdfStyles.planCardDesc}>{s.desc}</Text>
                  </View>
                );
              })}
            </View>
            <View style={pdfStyles.noteLine} wrap={false}>
              <Text>
                <Text style={{ fontWeight: 700 }}>Importante: </Text>
                el hosting se cobra aparte en todos los planes ({hosting} al mes) y el dominio no
                está incluido. Más detalle en la sección 4.
              </Text>
            </View>
          </>
        )}

        <InteriorFooter left={footerLeft} />
      </Page>

      {/* =====================================================================
          3 y 4: CAMBIOS + DOMINIO Y HOSTING
          ===================================================================== */}
      <Page size="A4" style={pdfStyles.interiorPage}>
        <InteriorHeader brand={issuer.name} tag={ANNEX_TAG} />

        <SectionHead
          num={3}
          title="¿Qué cambios incluye la mantención?"
          lead="Para que sepas exactamente qué cubre tu mensualidad y qué se cotiza aparte."
        />
        <View style={pdfStyles.twoCols} wrap={false}>
          <View style={[pdfStyles.colCard, pdfStyles.colCardYes]}>
            <Text style={[pdfStyles.colCardTitle, { color: GREEN }]}>Cambio menor</Text>
            <Text style={pdfStyles.colCardSubtitle}>Incluido en tu plan mensual</Text>
            <Bullet mark="+" color={GREEN}>Editar textos existentes (precios, horarios, etc.)</Bullet>
            <Bullet mark="+" color={GREEN}>Reemplazar una imagen o foto por otra</Bullet>
            <Bullet mark="+" color={GREEN}>Actualizar datos de contacto o redes sociales</Bullet>
            <Bullet mark="+" color={GREEN}>Ajustar un color, botón o detalle puntual</Bullet>
          </View>
          <View style={[pdfStyles.colCard, pdfStyles.colCardNo]}>
            <Text style={[pdfStyles.colCardTitle, { color: BRASS_DARK }]}>Cambio mayor</Text>
            <Text style={pdfStyles.colCardSubtitle}>Se cotiza aparte según complejidad*</Text>
            <Bullet mark="•" color={BRASS_DARK}>Agregar o eliminar una sección completa</Bullet>
            <Bullet mark="•" color={BRASS_DARK}>Rediseñar la estructura o el diseño general</Bullet>
            <Bullet mark="•" color={BRASS_DARK}>Integrar funciones nuevas (formularios, pagos)</Bullet>
            <Bullet mark="•" color={BRASS_DARK}>Crear una página nueva fuera de lo pactado</Bullet>
          </View>
        </View>
        <View style={pdfStyles.twoCols} wrap={false}>
          <View style={pdfStyles.exampleBox}>
            <Text style={pdfStyles.exampleLabel}>Ejemplo · Cambio menor</Text>
            <Text style={{ fontSize: 8 }}>Cambiar el teléfono en el pie de página.</Text>
          </View>
          <View style={pdfStyles.exampleBox}>
            <Text style={pdfStyles.exampleLabel}>Ejemplo · Cambio mayor</Text>
            <Text style={{ fontSize: 8 }}>Agregar una nueva sección de "Testimonios" con diseño propio.</Text>
          </View>
        </View>
        <Text style={pdfStyles.smallPrint}>
          * El Plan Premium incluye un cambio mayor al mes sin costo adicional.
        </Text>

        {paidSubs.some((s) => NEW_PAGE_RULES[s.id]) && (
          <View wrap={false}>
            <Text style={pdfStyles.blockLabel}>Páginas nuevas durante la suscripción</Text>
            <View style={pdfStyles.table}>
              <View style={pdfStyles.tableHeaderRow}>
                <Text style={[pdfStyles.tableHeaderCell, { width: '25%' }]}>Plan</Text>
                <Text style={[pdfStyles.tableHeaderCell, { width: '75%' }]}>Condición</Text>
              </View>
              {paidSubs
                .filter((s) => NEW_PAGE_RULES[s.id])
                .map((s) => (
                  <View key={s.id} style={pdfStyles.tableRow}>
                    <Text style={[pdfStyles.tableCell, { width: '25%', fontWeight: 700 }]}>{s.name}</Text>
                    <Text style={[pdfStyles.tableCell, { width: '75%' }]}>{NEW_PAGE_RULES[s.id]!(extra)}</Text>
                  </View>
                ))}
            </View>
          </View>
        )}

        <SectionHead num={4} title="Dominio y hosting" />
        <View wrap={false}>
          <View style={pdfStyles.twoCols}>
            <View style={[pdfStyles.planCard]}>
              <Text style={pdfStyles.exampleLabel}>Hosting (servidor)</Text>
              <Text style={pdfStyles.planCardPrice}>{hosting}</Text>
              <Text style={pdfStyles.planCardPriceNote}>por mes, aparte en todos los planes</Text>
              <Text style={pdfStyles.planCardDesc}>
                Es el espacio donde tu sitio queda publicado y disponible las 24 horas.
              </Text>
            </View>
            <View style={[pdfStyles.planCard]}>
              <Text style={pdfStyles.exampleLabel}>Dominio (tusitio.cl)</Text>
              <Text style={[pdfStyles.planCardPrice, { fontSize: 11 }]}>Lo contrata el cliente</Text>
              <Text style={pdfStyles.planCardPriceNote}>no incluido en ningún plan</Text>
              <Text style={pdfStyles.planCardDesc}>
                Recomendamos dominios .cl a través de NIC Chile, quedando siempre a tu nombre.
              </Text>
            </View>
          </View>
          <Bullet>
            Configuración: te entrego instrucciones para enlazar tu dominio con el hosting, o puedo
            hacerlo por ti si me compartes el acceso a tu administrador de dominio.
          </Bullet>
          <Bullet>
            Si cancelas la suscripción antes de 12 meses, el dominio y hosting ya contratados no son
            reembolsables, ya que corresponden a gastos pagados por adelantado.
          </Bullet>
        </View>

        <InteriorFooter left={footerLeft} />
      </Page>

      {/* =====================================================================
          5 y 6: VENTA CON CÓDIGO FUENTE + COMPARACIÓN
          ===================================================================== */}
      <Page size="A4" style={pdfStyles.interiorPage}>
        <InteriorHeader brand={issuer.name} tag={ANNEX_TAG} />

        <SectionHead
          num={5}
          title="Venta con código fuente"
          lead="Si prefieres no tener mensualidad, puedes adquirir tu sitio completo con su código fuente (HTML, CSS y JavaScript o TypeScript) para administrarlo tú o con quien prefieras."
        />
        <View style={pdfStyles.cardsRow} wrap={false}>
          {catalog.plans.map((p) => {
            const active = isStandard && !isBuild && p.id === quote.planId;
            return (
              <View key={p.id} style={[pdfStyles.planCard, active ? pdfStyles.planCardActive : {}]}>
                {active ? <Text style={pdfStyles.activeBadge}>Tu plan</Text> : null}
                <Text style={pdfStyles.planCardName}>{p.name}</Text>
                <Text style={pdfStyles.planCardPrice}>{price(p.sale.price)}</Text>
                <Text style={pdfStyles.planCardPriceNote}>Pago único · sin mensualidad</Text>
                <Text style={pdfStyles.planCardDesc}>{p.sale.desc}</Text>
              </View>
            );
          })}
        </View>
        <View style={pdfStyles.twoCols} wrap={false}>
          <View style={[pdfStyles.colCard, pdfStyles.colCardYes]}>
            <Text style={[pdfStyles.colCardTitle, { color: GREEN, marginBottom: 6 }]}>Incluye</Text>
            <Bullet mark="+" color={GREEN}>Sitio completo, listo para publicar</Bullet>
            <Bullet mark="+" color={GREEN}>Código fuente entregado por GitHub o archivo comprimido</Bullet>
            <Bullet mark="+" color={GREEN}>Autonomía total sobre tu sitio</Bullet>
          </View>
          <View style={[pdfStyles.colCard, pdfStyles.colCardNo]}>
            <Text style={[pdfStyles.colCardTitle, { color: BRASS_DARK, marginBottom: 6 }]}>No incluye</Text>
            <Bullet mark="-" color={BRASS_DARK}>Soporte ni mantención</Bullet>
            <Bullet mark="-" color={BRASS_DARK}>Actualizaciones futuras</Bullet>
            <Bullet mark="-" color={BRASS_DARK}>Hosting ni dominio</Bullet>
          </View>
        </View>

        {examplePlan && examplePlan.sale.price > examplePlan.build.price && (
          <View wrap={false}>
            <Text style={pdfStyles.blockLabel}>¿Ya tienes tu sitio con mantención y quieres el código?</Text>
            <Text style={{ fontSize: 8.5, marginBottom: 6, lineHeight: 1.45 }}>
              Se descuenta lo que ya pagaste por la construcción. Nunca pagas dos veces por lo mismo.
            </Text>
            <View style={pdfStyles.formulaBox}>
              <View style={pdfStyles.formulaItem}>
                <Text style={pdfStyles.formulaValue}>{price(examplePlan.sale.price)}</Text>
                <Text style={pdfStyles.formulaCaption}>Venta {examplePlan.name}</Text>
              </View>
              <Text style={pdfStyles.formulaOp}>−</Text>
              <View style={pdfStyles.formulaItem}>
                <Text style={pdfStyles.formulaValue}>{price(examplePlan.build.price)}</Text>
                <Text style={pdfStyles.formulaCaption}>Construcción ya pagada</Text>
              </View>
              <Text style={pdfStyles.formulaOp}>=</Text>
              <View style={pdfStyles.formulaItem}>
                <Text style={[pdfStyles.formulaValue, { color: pdfColors.navy700 }]}>
                  {price(examplePlan.sale.price - examplePlan.build.price)}
                </Text>
                <Text style={pdfStyles.formulaCaption}>Pagas por el código</Text>
              </View>
            </View>
          </View>
        )}

        <Text style={pdfStyles.smallPrint}>
          Descargo de responsabilidad: el desarrollador no se hace responsable por errores o daños
          derivados de la manipulación del código fuente por terceros, con o sin herramientas o
          agentes externos.
        </Text>

        <View wrap={false}>
          <SectionHead num={6} title="¿Qué opción me conviene?" />
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeaderRow}>
              <Text style={[pdfStyles.tableHeaderCell, { width: '28%' }]}> </Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '36%' }]}>Construcción + mantención</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '36%' }]}>Venta con código</Text>
            </View>
            {[
              ['Pago inicial', `Menor (desde ${price(minBuild)})`, `Mayor (desde ${price(minSale)})`],
              ['Mensualidad', minSub > 0 ? `Sí, desde ${price(minSub)}` : 'Según plan', 'No'],
              ['Soporte y cambios', 'Incluidos según tu plan', 'No incluidos'],
              ['Código fuente', 'Puedes comprarlo después', 'Se entrega al finalizar'],
              ['Ideal para', 'Quien prefiere despreocuparse', 'Quien tiene equipo técnico propio'],
            ].map((row, i) => (
              <View key={i} style={pdfStyles.tableRow}>
                <Text style={[pdfStyles.tableCell, { width: '28%', fontWeight: 700, color: pdfColors.navy900 }]}>
                  {row[0]}
                </Text>
                <Text style={[pdfStyles.tableCell, { width: '36%' }]}>{row[1]}</Text>
                <Text style={[pdfStyles.tableCell, { width: '36%' }]}>{row[2]}</Text>
              </View>
            ))}
          </View>
        </View>

        <InteriorFooter left={footerLeft} />
      </Page>
    </>
  );
};

