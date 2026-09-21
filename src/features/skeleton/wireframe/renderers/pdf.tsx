import React from 'react';
import { View } from '@react-pdf/renderer';
import { PdfText } from '../../../../pdf/PdfText';
import type { WNode, Space, Role } from '../types';
import type { SkeletonDesign } from '../../../../domain/types';
import { getContrastingTextColor } from '../presets';

export interface PdfWireframeRendererProps {
  node: WNode;
  design: SkeletonDesign;
  k: number; // Factor de escala (ej: 0.38 para encajar en A4)
}

function getSpacingPt(space: Space | undefined, density: SkeletonDesign['style']['density'], k: number): number {
  if (!space) return 0;
  const multiplier = density === 'compact' ? 0.75 : density === 'wide' ? 1.3 : 1;
  const baseMap: Record<Space, number> = {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 36,
  };
  return Math.round(baseMap[space] * multiplier * k);
}

function getBorderRadiusPt(radiusType: SkeletonDesign['style']['radius'], k: number): number {
  if (radiusType === 'square') return 0;
  if (radiusType === 'round') return Math.max(2, Math.round(12 * k));
  return Math.max(1, Math.round(4 * k));
}

function getFontSizePt(
  role: 'display' | 'h2' | 'h3' | 'body' | 'label',
  scale: SkeletonDesign['typography']['scale'],
  k: number
): { size: number; isBold: boolean } {
  const scaleMultiplier = scale === 'compact' ? 0.85 : scale === 'wide' ? 1.15 : 1;
  let base = 10;

  switch (role) {
    case 'display':
      base = 22;
      break;
    case 'h2':
      base = 16;
      break;
    case 'h3':
      base = 12;
      break;
    case 'body':
      base = 9;
      break;
    case 'label':
      base = 7.5;
      break;
  }

  const calculated = Math.round(base * scaleMultiplier * k);
  return {
    size: Math.max(4, calculated),
    isBold: role === 'display' || role === 'h2' || role === 'h3' || role === 'label',
  };
}

function resolveColor(role: Role | undefined, palette: SkeletonDesign['palette']): string | undefined {
  if (!role) return undefined;
  return palette[role];
}

export const PdfWireframeRenderer: React.FC<PdfWireframeRendererProps> = ({ node, design, k }) => {
  const { palette, style } = design;

  switch (node.t) {
    case 'box': {
      const padPt = getSpacingPt(node.pad, style.density, k);
      const gapPt = getSpacingPt(node.gap, style.density, k);
      const borderRadius = node.radius ? getBorderRadiusPt(style.radius, k) : 0;
      const bgColor = resolveColor(node.bg, palette);

      const widthProp: { width?: number | string } = {};
      if (typeof node.w === 'number') {
        widthProp.width = Math.round(node.w * k);
      } else if (typeof node.w === 'string') {
        widthProp.width = node.w;
      }

      const heightProp: { height?: number } = {};
      if (typeof node.h === 'number') {
        heightProp.height = Math.round(node.h * k);
      }

      return (
        <View
          style={{
            display: 'flex',
            flexDirection: node.dir === 'row' ? 'row' : 'column',
            gap: gapPt,
            padding: padPt,
            backgroundColor: bgColor || 'transparent',
            borderWidth: node.border ? 0.5 : 0,
            borderColor: `${palette.text}25`,
            borderStyle: 'solid',
            borderRadius,
            alignItems:
              node.align === 'center'
                ? 'center'
                : node.align === 'end'
                ? 'flex-end'
                : node.align === 'stretch'
                ? 'stretch'
                : 'flex-start',
            justifyContent:
              node.justify === 'center'
                ? 'center'
                : node.justify === 'between'
                ? 'space-between'
                : 'flex-start',
            flexGrow: node.grow ?? 0,
            ...widthProp,
            ...heightProp,
          }}
        >
          {node.children.map((child, idx) => (
            <PdfWireframeRenderer key={idx} node={child} design={design} k={k} />
          ))}
        </View>
      );
    }

    case 'text': {
      const fontInfo = getFontSizePt(node.role, design.typography.scale, k);
      const textColor = resolveColor(node.color, palette) || palette.text;

      return (
        <PdfText
          style={{
            fontFamily: 'Inter',
            fontSize: fontInfo.size,
            fontWeight: fontInfo.isBold ? 600 : 400,
            color: textColor,
            textAlign: node.align || 'left',
            letterSpacing: node.role === 'label' ? 0.5 : 0,
            textTransform: node.role === 'label' ? 'uppercase' : 'none',
          }}
        >
          {node.text}
        </PdfText>
      );
    }

    case 'bars': {
      const barHeight = Math.max(2, Math.round(6 * k));
      const barGap = Math.max(1, Math.round(4 * k));

      return (
        <View style={{ display: 'flex', flexDirection: 'column', gap: barGap, width: '100%' }}>
          {Array.from({ length: node.lines }).map((_, idx) => {
            const wPercent = node.widths?.[idx] ?? (idx === node.lines - 1 ? 70 : 100);
            return (
              <View
                key={idx}
                style={{
                  width: `${wPercent}%`,
                  height: barHeight,
                  backgroundColor: `${palette.text}20`,
                  borderRadius: 1.5,
                }}
              />
            );
          })}
        </View>
      );
    }

    case 'button': {
      const isSolid = node.variant === 'solid';
      const bgColor = isSolid ? palette.primary : 'transparent';
      const textColor = isSolid
        ? getContrastingTextColor(palette.primary)
        : palette.primary;
      const borderRadius = getBorderRadiusPt(style.radius, k);
      const fontSize = Math.max(4, Math.round(8 * k));
      const padY = Math.max(2, Math.round(4 * k));
      const padX = Math.max(4, Math.round(8 * k));

      return (
        <View
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: padY,
            paddingHorizontal: padX,
            backgroundColor: bgColor,
            borderWidth: isSolid ? 0 : 0.75,
            borderColor: palette.primary,
            borderStyle: 'solid',
            borderRadius,
          }}
        >
          <PdfText
            style={{
              fontFamily: 'Inter',
              fontSize,
              fontWeight: 600,
              color: textColor,
            }}
          >
            {node.label}
          </PdfText>
        </View>
      );
    }

    case 'image': {
      const borderRadius = getBorderRadiusPt(style.radius, k);
      const imgHeight = Math.max(20, Math.round(75 * k));

      return (
        <View
          style={{
            width: '100%',
            height: imgHeight,
            backgroundColor: `${palette.text}10`,
            borderWidth: 0.5,
            borderColor: `${palette.text}30`,
            borderStyle: 'dashed',
            borderRadius,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PdfText
            style={{
              fontFamily: 'Inter',
              fontSize: Math.max(4, Math.round(6 * k)),
              color: `${palette.text}50`,
              textTransform: 'uppercase',
            }}
          >
            [Imagen Referencial]
          </PdfText>
        </View>
      );
    }

    case 'divider': {
      return (
        <View
          style={{
            width: '100%',
            height: 0.5,
            backgroundColor: `${palette.text}20`,
            marginVertical: Math.max(1, Math.round(3 * k)),
          }}
        />
      );
    }

    default:
      return null;
  }
};
