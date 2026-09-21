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
  if (typeof process !== 'undefined' && process.cwd && src.startsWith('/node_modules/')) {
    return process.cwd() + src;
  }
  return src;
}

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

  fontsRegistered = true;
}
