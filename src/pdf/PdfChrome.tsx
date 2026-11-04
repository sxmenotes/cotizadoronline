import React from 'react';
import { View, Image } from '@react-pdf/renderer';
import { PdfText as Text } from './PdfText';
import { pdfStyles } from './styles';
import { ISOLOGO_BLACK_BASE64 } from './brandLogos';

/** Cabecera fija de páginas interiores */
export const InteriorHeader: React.FC<{ brand: string; tag: string }> = ({ brand, tag }) => (
  <View style={pdfStyles.fixedHeader} fixed>
    <View style={pdfStyles.headerBrand}>
      <Image src={ISOLOGO_BLACK_BASE64} style={pdfStyles.headerLogo} />
      <Text style={pdfStyles.headerBrandTitle}>{brand}</Text>
    </View>
    <Text style={pdfStyles.headerDocTag}>{tag}</Text>
  </View>
);

/** Pie fijo de páginas interiores con numeración global */
export const InteriorFooter: React.FC<{ left: string }> = ({ left }) => (
  <View style={pdfStyles.fixedFooter} fixed>
    <Text>{left}</Text>
    <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
  </View>
);

/** Fila con viñeta (evita glifos fuera del subconjunto latino de Inter) */
export const Bullet: React.FC<{ mark?: string; color?: string; children: React.ReactNode }> = ({
  mark = '•',
  color,
  children,
}) => (
  <View style={pdfStyles.bulletRow}>
    <Text style={[pdfStyles.bulletDot, color ? { color } : {}]}>{mark}</Text>
    <Text style={pdfStyles.bulletText}>{children}</Text>
  </View>
);

