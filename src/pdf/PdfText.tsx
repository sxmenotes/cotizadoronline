import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';

export interface PdfTextProps {
  style?: Style | Style[] | undefined;
  children?: React.ReactNode;
  render?:
    | ((props: {
        pageNumber: number;
        totalPages: number;
        subPageNumber: number;
        subPageTotalPages: number;
      }) => React.ReactNode)
    | undefined;
  fixed?: boolean | undefined;
  wrap?: boolean | undefined;
}

function resolveStyle(style: Style | Style[] | undefined): Style | Style[] {
  const base: Style = { fontFamily: 'Inter' };
  if (!style) return base;
  if (Array.isArray(style)) return [base, ...style];
  return [base, style];
}

/**
 * Componente Text blindado para @react-pdf/renderer v4.
 * 1. Inyecta siempre `fontFamily: 'Inter'` por defecto para evitar que caiga
 *    en la fuente de sistema no registrada (Helvetica) y active el bug de unitsPerEm.
 * 2. Maneja cadenas con saltos de línea (\n) separándolas en líneas independientes,
 *    ya que \n dentro de un nodo Text en @react-pdf/renderer v4 provoca un error
 *    irrecuperable de fontSubstitution (unitsPerEm undefined).
 */
export const PdfText: React.FC<PdfTextProps> = ({ style, children, render, fixed, wrap }) => {
  const computedStyle = resolveStyle(style);

  if (typeof children === 'string' && children.includes('\n')) {
    const lines = children.split('\n');
    return (
      <View>
        {lines.map((line, idx) => (
          <Text
            key={idx}
            style={computedStyle}
            {...(render !== undefined ? { render } : {})}
            {...(fixed !== undefined ? { fixed } : {})}
            {...(wrap !== undefined ? { wrap } : {})}
          >
            {line || ' '}
          </Text>
        ))}
      </View>
    );
  }

  return (
    <Text
      style={computedStyle}
      {...(render !== undefined ? { render } : {})}
      {...(fixed !== undefined ? { fixed } : {})}
      {...(wrap !== undefined ? { wrap } : {})}
    >
      {children}
    </Text>
  );
};

export default PdfText;
