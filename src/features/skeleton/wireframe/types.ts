import type { SectionType } from '../../../domain/types';

export type Space = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type Role = 'primary' | 'secondary' | 'background' | 'text' | 'accent';

export type WNode =
  | {
      t: 'box';
      dir: 'row' | 'col';
      gap?: Space | undefined;
      pad?: Space | undefined;
      bg?: Role | undefined;
      border?: boolean | undefined;
      radius?: boolean | undefined;
      align?: 'start' | 'center' | 'end' | 'stretch' | undefined;
      justify?: 'start' | 'center' | 'between' | 'around' | undefined;
      grow?: number | undefined;
      w?: number | string | undefined;
      h?: number | undefined;
      children: WNode[];
    }
  | {
      t: 'text';
      role: 'display' | 'h2' | 'h3' | 'body' | 'label';
      text: string;
      align?: 'left' | 'center' | 'right' | undefined;
      color?: Role | undefined;
    }
  | {
      t: 'bars';
      lines: number;
      widths?: number[] | undefined;
    }
  | {
      t: 'button';
      label: string;
      variant: 'solid' | 'outline';
    }
  | {
      t: 'image';
      ratio: number;
      icon?: 'image' | 'user' | 'map' | 'play' | undefined;
    }
  | {
      t: 'divider';
    };

export interface BlockVariantInfo {
  variantIndex: number;
  name: string;
  description: string;
}

export interface BlockMeta {
  type: SectionType;
  name: string;
  category: 'header' | 'content' | 'conversion' | 'footer';
  icon: string;
  didacticExplanation: string;
  clientPurpose: string;
  variants: BlockVariantInfo[];
}

export interface PalettePreset {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
}

export interface FontPairPreset {
  id: string;
  name: string;
  headingFont: string;
  bodyFont: string;
}
