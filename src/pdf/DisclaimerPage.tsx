import React from 'react';
import { Page, View } from '@react-pdf/renderer';
import { PdfText as Text } from './PdfText';
import { pdfStyles, pdfColors } from './styles';
import { InteriorHeader, InteriorFooter, Bullet } from './PdfChrome';
import { formatCatalogPrice, STATIC_PUBLICATION_SURCHARGE_CLP } from '../domain/pricing';
import type { Quote } from '../domain/types';

const DISCLAIMER_TAG = 'CONDICIONES Y DESCARGO DE RESPONSABILIDAD';
const GREEN = '#2E7D50';
const BRASS_DARK = '#7A5A1E';

interface ClauseProps {
  num: number;
  title: string;
  body: string;
}

const ClauseCard: React.FC<ClauseProps> = ({ num, title, body }) => (
  <View
    style={{
      borderWidth: 1,
      borderColor: pdfColors.hairline,
      borderRadius: 6,
      paddingTop: 8,
      paddingBottom: 8,
      paddingLeft: 11,
      paddingRight: 11,
      marginBottom: 7,
      backgroundColor: pdfColors.white,
    }}
    wrap={false}
  >
    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 3 }}>
      <Text
        style={{
          width: 17,
          height: 17,
          borderRadius: 8.5,
          backgroundColor: pdfColors.navy700,
          color: pdfColors.white,
          fontSize: 8,
          fontWeight: 700,
          textAlign: 'center',
          paddingTop: 3.5,
        }}
      >
        {String(num)}
      </Text>
      <Text style={{ fontSize: 9.2, fontWeight: 700, color: pdfColors.navy900, flex: 1 }}>{title}</Text>
    </View>
    <Text style={{ fontSize: 8.2, lineHeight: 1.42, color: pdfColors.ink, paddingLeft: 24 }}>{body}</Text>
  </View>
);

export const DisclaimerPage: React.FC<{ quote: Quote; depositFormatted: string }> = ({
  quote,
  depositFormatted,
}) => {
  const { client, project, projectType, planId, catalog, issuer, currency, exchangeRate } = quote;
  const isStatic = projectType === 'estatica';
  const plan = catalog.plans.find((p) => p.id === planId) || catalog.plans[0]!;
  const price = (clp: number) => formatCatalogPrice(clp, currency, exchangeRate);
  const staticSurcharge = price(STATIC_PUBLICATION_SURCHARGE_CLP);
  const extraPageCost = price(catalog.extraPagePrice);

  const modalityTitle = isStatic
    ? 'Publicación estática (sin mantención mensual)'
    : 'Venta completa con entrega de código fuente';

  const clauses: ClauseProps[] = isStatic
    ? [
        {
          num: 1,
          title: 'Naturaleza del servicio de Publicación Estática',
          body: `Esta modalidad contempla el diseño, construcción y publicación inicial del sitio web (${plan.name}) mediante un pago único que incluye el valor base de construcción más un adicional fijo de ${staticSurcharge}, sin suscripción ni cobros de mantención mensual de ningún tipo.`,
        },
        {
          num: 2,
          title: 'Sitio cerrado a ediciones y modificaciones posteriores',
          body: 'Una vez aprobado el proyecto y publicado el sitio web en su versión definitiva, este queda cerrado y no podrá modificarse ni editarse a futuro bajo el alcance de esta cotización. El servicio no incluye panel autoadministrable, soporte continuo, monitoreo ni actualizaciones de contenido.',
        },
        {
          num: 3,
          title: 'Cambios futuros sujetos a valores adicionales',
          body: `Cualquier solicitud de modificación posterior a la publicación —como cambios de textos, precios, fotografías, datos de contacto, ajustes de diseño, nuevas secciones o páginas adicionales (referencia: ${extraPageCost} por página extra)— no está incluida y deberá cotizarse y pagarse de forma independiente según la complejidad de lo solicitado.`,
        },
        {
          num: 4,
          title: 'Propiedad del código fuente y límites de responsabilidad técnica',
          body: 'La Publicación Estática comprende la puesta en línea del sitio operativo, pero no incluye la entrega ni cesión de los archivos de código fuente editables (los cuales corresponden a la modalidad de Venta con código fuente). El desarrollador entrega el sitio funcionando correctamente al momento de su publicación y no se responsabiliza por caídas, vencimiento o configuración futura de dominios del cliente, cambios en servicios de terceros o interrupciones posteriores al cierre del proyecto.',
        },
      ]
    : [
        {
          num: 1,
          title: 'Naturaleza de la Venta con Código Fuente',
          body: `Esta modalidad contempla el diseño, desarrollo y entrega íntegra de los archivos de código fuente del sitio web (${plan.name}, en HTML, CSS y JavaScript o TypeScript), otorgando al cliente autonomía total para alojarlo, publicarlo y administrarlo por su cuenta o con terceros, sin pagos mensuales.`,
        },
        {
          num: 2,
          title: 'Ausencia de soporte, mantención mensual y alojamiento',
          body: 'Con la aprobación del proyecto y el traspaso formal del código fuente (vía repositorio GitHub o archivo comprimido) finaliza íntegramente el servicio. Esta modalidad no incluye hosting, dominio, publicación administrada, soporte técnico, mantención ni futuras actualizaciones.',
        },
        {
          num: 3,
          title: 'Exención de responsabilidad por manipulación del código fuente',
          body: 'El desarrollador garantiza el correcto funcionamiento del sitio al momento de su entrega. El desarrollador no se hace responsable bajo ninguna circunstancia por errores, fallos de funcionamiento, vulnerabilidades de seguridad, pérdida de datos o daños de cualquier índole que surjan por la incorrecta manipulación, edición, despliegue o modificación del código fuente con posterioridad a la entrega, ya sea con o sin programas, plugins, terceros o agentes externos (incluyendo herramientas de inteligencia artificial).',
        },
        {
          num: 4,
          title: 'Solicitudes o modificaciones posteriores sujetas a valores adicionales',
          body: 'Una vez entregado el código fuente, cualquier requerimiento de soporte, reparación de errores originados por intervención externa, cambios de contenido, ajustes de diseño o nuevas funcionalidades será considerado un servicio nuevo y estará sujeto a evaluación y cotización adicional.',
        },
      ];

  const includedItems = isStatic
    ? [
        `Diseño y construcción completa del sitio (${plan.name})`,
        `Publicación definitiva en línea (incluye cargo fijo único de ${staticSurcharge})`,
        'Pago único sin cobros ni suscripciones mensuales',
      ]
    : [
        `Diseño y desarrollo completo del sitio (${plan.name})`,
        'Entrega íntegra del código fuente editable (GitHub o archivo .zip)',
        'Autonomía total del cliente, sin suscripciones mensuales',
      ];

  const excludedItems = isStatic
    ? [
        'Ediciones o cambios posteriores una vez publicado el sitio',
        'Mantención mensual, soporte continuo o actualizaciones futuras',
        'Entrega del código fuente editable (se cotiza en modalidad Venta)',
        'Todo cambio futuro estará sujeto a cotización y valores adicionales',
      ]
    : [
        'Soporte técnico, mantención mensual o actualizaciones posteriores',
        'Hosting (servidor web) y dominio (deben ser gestionados por el cliente)',
        'Garantía sobre errores causados por edición externa del código entregado',
        'Todo cambio o soporte posterior estará sujeto a valores adicionales',
      ];

  return (
    <Page size="A4" style={pdfStyles.interiorPage}>
      <InteriorHeader brand={issuer.name} tag={DISCLAIMER_TAG} />

      <Text style={pdfStyles.eyebrow}>Condiciones obligatorias de la modalidad cotizada</Text>
      <Text style={pdfStyles.pageTitle}>Descargo de responsabilidad</Text>

      {/* Banner resumen de la modalidad */}
      <View
        style={{
          backgroundColor: pdfColors.navy50,
          borderWidth: 1,
          borderColor: pdfColors.navy700,
          borderRadius: 6,
          paddingTop: 9,
          paddingBottom: 9,
          paddingLeft: 12,
          paddingRight: 12,
          marginBottom: 10,
        }}
        wrap={false}
      >
        <Text style={{ fontSize: 7.2, fontWeight: 700, letterSpacing: 1, color: pdfColors.navy700, textTransform: 'uppercase' }}>
          Modalidad seleccionada para {client}
        </Text>
        <Text style={{ fontSize: 11, fontWeight: 700, color: pdfColors.navy900, marginTop: 2 }}>
          {modalityTitle} · {plan.name}
        </Text>
        <Text style={{ fontSize: 8, color: pdfColors.inkMuted, marginTop: 2, lineHeight: 1.35 }}>
          {isStatic
            ? 'Por favor lee con atención el alcance de esta modalidad: al no contemplar un plan de mantención mensual, el sitio se entrega publicado y cerrado a modificaciones futuras.'
            : 'Por favor lee con atención el alcance de esta modalidad: al entregarse el código fuente sin plan de mantención, el cliente asume la administración total del sitio.'}
        </Text>
      </View>

      {/* Resumen comparativo rápido en 2 columnas */}
      <View style={[pdfStyles.twoCols, { marginBottom: 10 }]} wrap={false}>
        <View style={[pdfStyles.colCard, pdfStyles.colCardYes]}>
          <Text style={[pdfStyles.colCardTitle, { color: GREEN, marginBottom: 4 }]}>
            Qué incluye esta modalidad
          </Text>
          {includedItems.map((it, idx) => (
            <Bullet key={idx} mark="+" color={GREEN}>
              {it}
            </Bullet>
          ))}
        </View>
        <View style={[pdfStyles.colCard, pdfStyles.colCardNo]}>
          <Text style={[pdfStyles.colCardTitle, { color: BRASS_DARK, marginBottom: 4 }]}>
            Qué NO incluye / Límites del servicio
          </Text>
          {excludedItems.map((it, idx) => (
            <Bullet key={idx} mark="-" color={BRASS_DARK}>
              {it}
            </Bullet>
          ))}
        </View>
      </View>

      {/* Cláusulas detalladas */}
      <Text style={pdfStyles.blockLabel}>Cláusulas de alcance y responsabilidad</Text>
      {clauses.map((c) => (
        <ClauseCard key={c.num} num={c.num} title={c.title} body={c.body} />
      ))}

      {/* Cuadro de conformidad del cliente */}
      <View
        style={{
          backgroundColor: '#FCF8EE',
          borderLeftWidth: 3,
          borderLeftColor: pdfColors.brass,
          borderRadius: 4,
          paddingTop: 8,
          paddingBottom: 8,
          paddingLeft: 11,
          paddingRight: 11,
          marginTop: 4,
        }}
        wrap={false}
      >
        <Text style={{ fontSize: 8.5, fontWeight: 700, color: pdfColors.navy900, marginBottom: 2 }}>
          Conformidad y aceptación de condiciones
        </Text>
        <Text style={{ fontSize: 7.9, lineHeight: 1.4, color: pdfColors.ink }}>
          La aceptación de este presupuesto y el pago del abono inicial ({depositFormatted}) para dar
          inicio al proyecto «{project}» implican que el cliente ha leído, comprende y acepta en su
          totalidad las condiciones de alcance y el presente descargo de responsabilidad.
        </Text>
      </View>

      <InteriorFooter left={`${client} · ${project}`} />
    </Page>
  );
};

