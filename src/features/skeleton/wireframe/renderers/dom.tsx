import React from 'react';
import type { WNode, Space, Role } from '../types';
import type { SkeletonDesign } from '../../../../domain/types';
import { getContrastingTextColor } from '../presets';
import { Image, User, MapPin, Play } from 'lucide-react';

export interface DomRendererProps {
  node: WNode;
  design: SkeletonDesign;
}

// Mapeo de espaciados según densidad
function getSpacingPx(space: Space | undefined, density: SkeletonDesign['style']['density']): number {
  if (!space) return 0;
  const multiplier = density === 'compact' ? 0.75 : density === 'wide' ? 1.3 : 1;
  const baseMap: Record<Space, number> = {
    xs: 6,
    sm: 12,
    md: 20,
    lg: 32,
    xl: 48,
  };
  return Math.round(baseMap[space] * multiplier);
}

// Mapeo de radio de borde
function getBorderRadiusPx(radiusType: SkeletonDesign['style']['radius']): number {
  if (radiusType === 'square') return 0;
  if (radiusType === 'round') return 16;
  return 6; // soft
}

// Mapeo de tamaño de tipografía según rol y escala
function getFontSize(
  role: 'display' | 'h2' | 'h3' | 'body' | 'label',
  scale: SkeletonDesign['typography']['scale']
): { size: string; weight: number; isHeading: boolean } {
  const scaleMultiplier = scale === 'compact' ? 0.85 : scale === 'wide' ? 1.15 : 1;

  switch (role) {
    case 'display':
      return { size: `${Math.round(28 * scaleMultiplier)}px`, weight: 700, isHeading: true };
    case 'h2':
      return { size: `${Math.round(20 * scaleMultiplier)}px`, weight: 600, isHeading: true };
    case 'h3':
      return { size: `${Math.round(15 * scaleMultiplier)}px`, weight: 600, isHeading: true };
    case 'body':
      return { size: `${Math.round(12 * scaleMultiplier)}px`, weight: 400, isHeading: false };
    case 'label':
      return { size: `${Math.round(10 * scaleMultiplier)}px`, weight: 600, isHeading: false };
  }
}

// Resolver color por rol
function resolveColor(role: Role | undefined, palette: SkeletonDesign['palette']): string | undefined {
  if (!role) return undefined;
  return palette[role];
}

export const DomWireframeRenderer: React.FC<DomRendererProps> = ({ node, design }) => {
  const { palette, typography, style } = design;

  switch (node.t) {
    case 'box': {
      const padPx = getSpacingPx(node.pad, style.density);
      const gapPx = getSpacingPx(node.gap, style.density);
      const borderRadius = node.radius ? `${getBorderRadiusPx(style.radius)}px` : undefined;
      const bgColor = resolveColor(node.bg, palette);

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: node.dir === 'row' ? 'row' : 'column',
            gap: `${gapPx}px`,
            padding: `${padPx}px`,
            backgroundColor: bgColor || 'transparent',
            border: node.border ? `1px solid ${palette.text}20` : 'none',
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
            flexGrow: node.grow ?? undefined,
            width: typeof node.w === 'number' ? `${node.w}px` : node.w || 'auto',
            height: typeof node.h === 'number' ? `${node.h}px` : node.h || 'auto',
            boxSizing: 'border-box',
          }}
        >
          {node.children.map((child, idx) => (
            <DomWireframeRenderer key={idx} node={child} design={design} />
          ))}
        </div>
      );
    }

    case 'text': {
      const fontInfo = getFontSize(node.role, typography.scale);
      const fontFam = fontInfo.isHeading ? typography.headingFont : typography.bodyFont;
      const textColor = resolveColor(node.color, palette) || palette.text;

      return (
        <div
          style={{
            fontFamily: `"${fontFam}", Inter, sans-serif`,
            fontSize: fontInfo.size,
            fontWeight: fontInfo.weight,
            color: textColor,
            textAlign: node.align || 'left',
            lineHeight: 1.25,
            letterSpacing: node.role === 'label' ? '0.05em' : 'normal',
            textTransform: node.role === 'label' ? 'uppercase' : 'none',
          }}
        >
          {node.text}
        </div>
      );
    }

    case 'bars': {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
          {Array.from({ length: node.lines }).map((_, idx) => {
            const wPercent = node.widths?.[idx] ?? (idx === node.lines - 1 ? 70 : 100);
            return (
              <div
                key={idx}
                style={{
                  width: `${wPercent}%`,
                  height: '8px',
                  backgroundColor: `${palette.text}18`,
                  borderRadius: '3px',
                }}
              />
            );
          })}
        </div>
      );
    }

    case 'button': {
      const isSolid = node.variant === 'solid';
      const bgColor = isSolid ? palette.primary : 'transparent';
      const textColor = isSolid
        ? getContrastingTextColor(palette.primary)
        : palette.primary;
      const border = isSolid ? 'none' : `1.5px solid ${palette.primary}`;
      const borderRadius = `${getBorderRadiusPx(style.radius)}px`;

      return (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 14px',
            backgroundColor: bgColor,
            color: textColor,
            border,
            borderRadius,
            fontSize: '11px',
            fontWeight: 600,
            fontFamily: `"${typography.bodyFont}", Inter, sans-serif`,
            boxSizing: 'border-box',
            userSelect: 'none',
          }}
        >
          {node.label}
        </div>
      );
    }

    case 'image': {
      const borderRadius = `${getBorderRadiusPx(style.radius)}px`;
      return (
        <div
          style={{
            width: '100%',
            paddingBottom: `${Math.round(100 / (node.ratio || 1.33))}%`,
            position: 'relative',
            backgroundColor: `${palette.text}10`,
            border: `1px dashed ${palette.text}25`,
            borderRadius,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: `${palette.text}40`,
            }}
          >
            {node.icon === 'user' ? (
              <User style={{ width: '20px', height: '20px' }} />
            ) : node.icon === 'map' ? (
              <MapPin style={{ width: '20px', height: '20px' }} />
            ) : node.icon === 'play' ? (
              <Play style={{ width: '20px', height: '20px' }} />
            ) : (
              <Image style={{ width: '20px', height: '20px' }} />
            )}
            <span style={{ fontSize: '9px', marginTop: '4px', textTransform: 'uppercase' }}>
              Imagen Referencial
            </span>
          </div>
        </div>
      );
    }

    case 'divider': {
      return (
        <div
          style={{
            width: '100%',
            height: '1px',
            backgroundColor: `${palette.text}15`,
            margin: '4px 0',
          }}
        />
      );
    }

    default:
      return null;
  }
};
