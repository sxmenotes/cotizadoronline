import { Font } from '@react-pdf/renderer';

// Importar archivos WOFF con sufijo ?url para que Vite los resuelva como URLs estáticas
import newsreader400 from '@fontsource/newsreader/files/newsreader-latin-400-normal.woff?url';
import newsreader500 from '@fontsource/newsreader/files/newsreader-latin-500-normal.woff?url';
import newsreader600 from '@fontsource/newsreader/files/newsreader-latin-600-normal.woff?url';

import inter400 from '@fontsource/inter/files/inter-latin-400-normal.woff?url';
import inter500 from '@fontsource/inter/files/inter-latin-500-normal.woff?url';
import inter600 from '@fontsource/inter/files/inter-latin-600-normal.woff?url';
import inter700 from '@fontsource/inter/files/inter-latin-700-normal.woff?url';

let fontsRegistered = false;

function resolveFontSrc(src: string): string {
  if (typeof process !== 'undefined' && process.cwd && (src.startsWith('/node_modules/') || src.startsWith('/fonts/'))) {
    const p = src.startsWith('/fonts/') ? '/public' + src : src;
    return process.cwd() + p;
  }
  return src;
}

export const LOCAL_FONTS_MAP: Record<string, string> = {
  'Playfair Display': '/fonts/playfair-display.ttf',
  'Lato': '/fonts/lato.ttf',
  'Cormorant Garamond': '/fonts/cormorant-garamond.ttf',
  'Montserrat': '/fonts/montserrat.ttf',
  'Poppins': '/fonts/poppins.ttf',
  'Open Sans': '/fonts/open-sans.ttf',
  'DM Serif Display': '/fonts/dm-serif-display.ttf',
  'DM Sans': '/fonts/dm-sans.ttf',
  'Lora': '/fonts/lora.ttf',
  'Source Sans 3': '/fonts/source-sans-3.ttf',
  'Oswald': '/fonts/oswald.ttf',
  'Roboto': '/fonts/roboto.ttf',
  'Space Grotesk': '/fonts/space-grotesk.ttf',
  'Quicksand': '/fonts/quicksand.ttf',
  'Nunito': '/fonts/nunito.ttf',
  'Fraunces': '/fonts/fraunces.ttf',
  'Manrope': '/fonts/manrope.ttf',
};

export function registerPdfFonts(): void {
  if (fontsRegistered) return;

  // Desactivar separación silábica automática
  Font.registerHyphenationCallback((word) => [word]);

  Font.register({
    family: 'Newsreader',
    fonts: [
      { src: resolveFontSrc(newsreader400), fontWeight: 400 },
      { src: resolveFontSrc(newsreader500), fontWeight: 500 },
      { src: resolveFontSrc(newsreader600), fontWeight: 600 },
    ],
  });

  Font.register({
    family: 'Inter',
    fonts: [
      { src: resolveFontSrc(inter400), fontWeight: 400 },
      { src: resolveFontSrc(inter500), fontWeight: 500 },
      { src: resolveFontSrc(inter600), fontWeight: 600 },
      { src: resolveFontSrc(inter700), fontWeight: 700 },
    ],
  });

  // Registrar todas las fuentes locales de diseño para el PDF
  for (const [family, relativePath] of Object.entries(LOCAL_FONTS_MAP)) {
    try {
      Font.register({
        family,
        src: resolveFontSrc(relativePath),
      });
    } catch (e) {
      console.warn(`No se pudo registrar la fuente local ${family}:`, e);
    }
  }

  fontsRegistered = true;
}

export function registerDynamicFont(fontFamily: string): void {
  registerPdfFonts();

  if (fontFamily === 'Inter' || fontFamily === 'Newsreader') {
    return;
  }

  const relativePath = LOCAL_FONTS_MAP[fontFamily];
  if (relativePath) {
    try {
      Font.register({
        family: fontFamily,
        src: resolveFontSrc(relativePath),
      });
    } catch (error) {
      console.warn(`No se pudo registrar la fuente ${fontFamily} en PDF`, error);
    }
  } else {
    console.warn(`Fuente no soportada en PDF: ${fontFamily}. Usando Inter por defecto.`);
  }
}

