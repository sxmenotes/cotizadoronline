import React from 'react';
import { Document, Page, View, Image, StyleSheet, Font } from '@react-pdf/renderer';
import type { SkeletonDesign } from '../../../domain/types';
import { PdfText } from '../../../pdf/PdfText';
import { ISOLOGO_BLACK_BASE64 } from '../../../pdf/brandLogos';
import { PdfWireframeRenderer } from './renderers/pdf';
import { registerPdfFonts } from '../../../pdf/fonts';
import { getWireframeBlockTree, getGlobalNavbarTree, getGlobalFooterTree, BLOCK_METAS } from './blocks';

// Registrar fuentes locales Inter, Newsreader y todas las de diseño
registerPdfFonts();

// Estilos base A4 para el documento del Esqueleto
const styles = StyleSheet.create({  page: {
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 36,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Inter',
  },
  fixedHeader: {
    position: 'absolute',
    top: 18,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    width: 14,
    height: 14,
  },
  headerBrand: {
    fontSize: 8.5,
    fontWeight: 700,
    letterSpacing: 1.2,
    color: '#0F172A',
  },
  headerTag: {
    fontSize: 7,
    fontWeight: 600,
    letterSpacing: 1,
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  fixedFooter: {
    position: 'absolute',
    bottom: 18,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: '#E2E8F0',
  },
  footerText: {
    fontSize: 7.5,
    color: '#64748B',
  },
  // Página 1: Resumen
  titleSection: {
    marginTop: 10,
    marginBottom: 10,
  },
  eyebrow: {
    fontSize: 8,
    fontWeight: 600,
    color: '#B8860B',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#0F172A',
    fontFamily: 'Newsreader',
    marginBottom: 6,
  },
  metaGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
    gap: 12,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 7,
    fontWeight: 600,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 9.5,
    fontWeight: 600,
    color: '#0F172A',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#0F172A',
    fontFamily: 'Newsreader',
    borderBottomWidth: 0.5,
    borderBottomColor: '#CBD5E1',
    paddingBottom: 3,
    marginTop: 6,
    marginBottom: 6,
  },
  paletteGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  paletteCard: {
    flex: 1,
    padding: 5,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  colorSwatch: {
    width: '100%',
    height: 16,
    borderRadius: 3,
    marginBottom: 3,
    borderWidth: 0.5,
    borderColor: '#00000015',
  },
  colorRole: {
    fontSize: 6.5,
    fontWeight: 600,
    color: '#475569',
    textTransform: 'uppercase',
  },
  colorHex: {
    fontSize: 7,
    fontFamily: 'Inter',
    color: '#0F172A',
  },
  didacticBox: {
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#EAB308',
    borderRadius: 6,
    padding: 8,
    marginTop: 6,
    marginBottom: 8,
  },
  didacticTitle: {
    fontSize: 8.5,
    fontWeight: 700,
    color: '#854D0E',
    marginBottom: 2,
  },
  didacticText: {
    fontSize: 7.5,
    color: '#713F12',
    lineHeight: 1.3,
  },
  glossaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  glossaryItem: {
    width: '49%',
    backgroundColor: '#F8FAFC',
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    borderRadius: 5,
    padding: 5,
  },
  glossaryBadge: {
    fontSize: 7.5,
    fontWeight: 700,
    color: '#0F172A',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  glossaryDesc: {
    fontSize: 7,
    color: '#475569',
    lineHeight: 1.3,
  },
  // Páginas 2+: Maqueta
  mockupPageHeader: {
    marginTop: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  mockupPageTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#0F172A',
    fontFamily: 'Newsreader',
  },
  mockupContainer: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  desktopColumn: {
    width: 320,
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  mobileColumn: {
    width: 155,
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  columnHeader: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  columnLabel: {
    fontSize: 7,
    fontWeight: 600,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionBadgeContainer: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  sectionBadgeText: {
    fontSize: 6,
    fontWeight: 600,
    color: '#64748B',
    textTransform: 'uppercase',
  },
});

export interface SkeletonDocumentProps {
  design: SkeletonDesign;
}

export const SkeletonPages: React.FC<SkeletonDocumentProps> = ({ design }) => {
  const {
    project,
    palette,
    typography,
    pages,
    global: globalConfig,
    notes,
    createdAt,
  } = design;

  // Formato de fecha
  const dateFormatted = new Date(design.updatedAt || createdAt).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Lista única de tipos de sección para el glosario didáctico
  const sectionTypesUsed = Array.from(
    new Set(pages.flatMap((p) => p.sections.map((s) => s.type)))
  );

  return [
    /* PÁGINA 1: RESUMEN EDITORIAL Y GLOSARIO DIDÁCTICO */
    <Page key="resumen" size="A4" style={styles.page}>
      {/* Cabecera Fija */}
        <View style={styles.fixedHeader} fixed>
          <View style={styles.headerLeft}>
            <Image src={ISOLOGO_BLACK_BASE64} style={styles.headerLogo} />
            <PdfText style={styles.headerBrand}>SAMUEL VALENZUELA</PdfText>
          </View>
          <PdfText style={styles.headerTag}>ESQUELETO DE DISEÑO WEB</PdfText>
        </View>

        <View style={styles.titleSection}>
          <PdfText style={styles.eyebrow}>Arquitectura & Wireframes</PdfText>
          <PdfText style={styles.mainTitle}>{design.name}</PdfText>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <PdfText style={styles.metaLabel}>Cliente / Razón Social</PdfText>
              <PdfText style={styles.metaValue}>{project.client}</PdfText>
            </View>
            <View style={styles.metaItem}>
              <PdfText style={styles.metaLabel}>Proyecto</PdfText>
              <PdfText style={styles.metaValue}>{project.project}</PdfText>
            </View>
            <View style={styles.metaItem}>
              <PdfText style={styles.metaLabel}>Fecha de emisión</PdfText>
              <PdfText style={styles.metaValue}>{dateFormatted}</PdfText>
            </View>
            <View style={styles.metaItem}>
              <PdfText style={styles.metaLabel}>Páginas estimadas</PdfText>
              <PdfText style={styles.metaValue}>{pages.length} página(s)</PdfText>
            </View>
          </View>
        </View>

        {/* Muestra de la Paleta de Colores */}
        <PdfText style={styles.sectionTitle}>Paleta de Color del Proyecto</PdfText>
        <View style={styles.paletteGrid}>
          {[
            { label: 'Primario', hex: palette.primary },
            { label: 'Secundario', hex: palette.secondary },
            { label: 'Fondo', hex: palette.background },
            { label: 'Texto', hex: palette.text },
            { label: 'Acento', hex: palette.accent },
          ].map((item, idx) => (
            <View key={idx} style={styles.paletteCard}>
              <View style={[styles.colorSwatch, { backgroundColor: item.hex }]} />
              <PdfText style={styles.colorRole}>{item.label}</PdfText>
              <PdfText style={styles.colorHex}>{item.hex}</PdfText>
            </View>
          ))}
        </View>

        {/* Tipografía */}
        <PdfText style={styles.sectionTitle}>Sistema Tipográfico</PdfText>
        <View style={[styles.metaGrid, { marginBottom: 12 }]}>
          <View style={styles.metaItem}>
            <PdfText style={styles.metaLabel}>Fuente de Títulos y Destacados</PdfText>
            <PdfText style={styles.metaValue}>{typography.headingFont}</PdfText>
            <PdfText style={{ fontFamily: Font.getRegisteredFontFamilies().includes(typography.headingFont) ? typography.headingFont : 'Inter', fontSize: 18, marginTop: 4, color: '#0F172A' }}>AaBbCc 123</PdfText>
          </View>
          <View style={styles.metaItem}>
            <PdfText style={styles.metaLabel}>Fuente de Cuerpo y Botones</PdfText>
            <PdfText style={styles.metaValue}>{typography.bodyFont}</PdfText>
            <PdfText style={{ fontFamily: Font.getRegisteredFontFamilies().includes(typography.bodyFont) ? typography.bodyFont : 'Inter', fontSize: 14, marginTop: 4, color: '#475569' }}>AaBbCc 123</PdfText>
          </View>
          <View style={styles.metaItem}>
            <PdfText style={styles.metaLabel}>Escala Visual</PdfText>
            <PdfText style={styles.metaValue}>{typography.scale.toUpperCase()}</PdfText>
          </View>
        </View>

        {/* Caja de Aviso Didáctico (Movida hacia arriba) */}
        <View style={styles.didacticBox}>
          <PdfText style={styles.didacticTitle}>Nota Didáctica sobre la Maqueta</PdfText>
          <PdfText style={styles.didacticText}>
            Este esqueleto presenta la distribución y el orden estratégico de las secciones acordado para el sitio web.
            Los textos, botones e imágenes en gris son estrictamente referenciales para ilustrar la jerarquía visual y los pesos estructurales, y no representan el diseño visual (UI) definitivo.
          </PdfText>
        </View>

        {/* Glosario Didáctico de Secciones */}
        <PdfText style={styles.sectionTitle}>Glosario Didáctico de Secciones</PdfText>
        <View style={styles.glossaryGrid}>
          {sectionTypesUsed.map((secType) => {
            const meta = BLOCK_METAS[secType];
            if (!meta) return null;
            return (
              <View key={secType} style={styles.glossaryItem}>
                <PdfText style={styles.glossaryBadge}>{meta.name}</PdfText>
                <PdfText style={styles.glossaryDesc}>{meta.didacticExplanation}</PdfText>
              </View>
            );
          })}
        </View>

        {notes && notes.trim().length > 0 && (
          <View style={{ marginTop: 6 }}>
            <PdfText style={styles.sectionTitle}>Notas y Consideraciones Especiales</PdfText>
            <PdfText style={{ fontSize: 8, color: '#475569', lineHeight: 1.3 }}>{notes}</PdfText>
          </View>
        )}

        {/* Pie Fijo */}
        <View style={styles.fixedFooter} fixed>
          <PdfText style={styles.footerText}>
            {project.client} · {project.project}
          </PdfText>
          <PdfText
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>,

      /* PÁGINAS 2 A N: MAQUETA DE CADA PÁGINA DEL SITIO */
      ...pages.map((sitePage, pageIdx) => {
        // Factor de escala k para que quepa en A4
        // kDesktop = 0.28, kMobile = 0.22
        const kDesktop = 0.26;
        const kMobile = 0.20;

        return (
          <Page key={sitePage.id} size="A4" style={styles.page}>
            {/* Cabecera Fija */}
            <View style={styles.fixedHeader} fixed>
              <View style={styles.headerLeft}>
                <Image src={ISOLOGO_BLACK_BASE64} style={styles.headerLogo} />
                <PdfText style={styles.headerBrand}>SAMUEL VALENZUELA</PdfText>
              </View>
              <PdfText style={styles.headerTag}>ESQUELETO DE DISEÑO WEB</PdfText>
            </View>

            {/* Título de la página del sitio */}
            <View style={styles.mockupPageHeader}>
              <PdfText style={styles.mockupPageTitle}>
                Página {pageIdx + 1} de {pages.length}: {sitePage.name}
              </PdfText>
              <PdfText style={{ fontSize: 8, color: '#64748B' }}>
                {sitePage.sections.length} secciones diagramadas
              </PdfText>
            </View>

            {/* Contenedor lado a lado: Escritorio (65%) y Móvil (35%) */}
            <View style={styles.mockupContainer}>
              {/* Columna Escritorio */}
              <View style={styles.desktopColumn}>
                <View style={styles.columnHeader}>
                  <PdfText style={styles.columnLabel}>Vista Escritorio (Desktop)</PdfText>
                  <PdfText style={{ fontSize: 6.5, color: '#94A3B8' }}>1280px equiv.</PdfText>
                </View>

                {globalConfig.navbar.enabled && (
                  <View>
                    <View style={styles.sectionBadgeContainer}>
                      <PdfText style={styles.sectionBadgeText}>Navegación Superior</PdfText>
                    </View>
                    <PdfWireframeRenderer
                      node={getGlobalNavbarTree(globalConfig.navbar.variant)}
                      design={design}
                      k={kDesktop}
                    />
                  </View>
                )}

                {sitePage.sections.map((section, sIdx) => {
                  const tree = getWireframeBlockTree(section.type, section.variant, section.label);
                  return (
                    <View key={section.id || sIdx}>
                      <View style={styles.sectionBadgeContainer}>
                        <PdfText style={styles.sectionBadgeText}>
                          {section.label || BLOCK_METAS[section.type].name}
                        </PdfText>
                      </View>
                      <PdfWireframeRenderer node={tree} design={design} k={kDesktop} />
                    </View>
                  );
                })}

                {globalConfig.footer.enabled && (
                  <View>
                    <View style={styles.sectionBadgeContainer}>
                      <PdfText style={styles.sectionBadgeText}>Pie de Página</PdfText>
                    </View>
                    <PdfWireframeRenderer
                      node={getGlobalFooterTree(globalConfig.footer.variant)}
                      design={design}
                      k={kDesktop}
                    />
                  </View>
                )}
              </View>

              {/* Columna Móvil */}
              <View style={styles.mobileColumn}>
                <View style={styles.columnHeader}>
                  <PdfText style={styles.columnLabel}>Móvil (390px)</PdfText>
                  <PdfText style={{ fontSize: 6.5, color: '#94A3B8' }}>Responsive</PdfText>
                </View>

                {globalConfig.navbar.enabled && (
                  <View>
                    <PdfWireframeRenderer
                      node={getGlobalNavbarTree(globalConfig.navbar.variant)}
                      design={design}
                      k={kMobile}
                    />
                  </View>
                )}

                {sitePage.sections.map((section, sIdx) => {
                  const tree = getWireframeBlockTree(section.type, section.variant, section.label);
                  return (
                    <View key={section.id || sIdx}>
                      <View style={styles.sectionBadgeContainer}>
                        <PdfText style={styles.sectionBadgeText}>
                          {section.label || BLOCK_METAS[section.type].name}
                        </PdfText>
                      </View>
                      <PdfWireframeRenderer node={tree} design={design} k={kMobile} />
                    </View>
                  );
                })}

                {globalConfig.footer.enabled && (
                  <View>
                    <PdfWireframeRenderer
                      node={getGlobalFooterTree(globalConfig.footer.variant)}
                      design={design}
                      k={kMobile}
                    />
                  </View>
                )}
              </View>
            </View>

            {/* Pie Fijo */}
            <View style={styles.fixedFooter} fixed>
              <PdfText style={styles.footerText}>
                {project.client} · {project.project}
              </PdfText>
              <PdfText
                style={styles.footerText}
                render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
              />
            </View>
          </Page>
        );
      }),
  ];
};

export const SkeletonDocument: React.FC<SkeletonDocumentProps> = ({ design }) => {
  return (
    <Document
      title={`Esqueleto_Web_${design.project.client.replace(/\s+/g, '_')}`}
      author="Sistema"
      subject={`Arquitectura y Wireframes para ${design.project.project}`}
      creator="Creador de Presupuestos SV"
      language="es-CL"
    >
      <SkeletonPages design={design} />
    </Document>
  );
};

export default SkeletonDocument;
