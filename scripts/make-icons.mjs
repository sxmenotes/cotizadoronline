import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const inputLogo = path.resolve('public/brand/isologo_black.png');
if (!fs.existsSync(inputLogo)) {
  console.error('No se encontró public/brand/isologo_black.png');
  process.exit(1);
}

const publicDir = path.resolve('public');

async function generateIcons() {
  // favicon-32.png: 32x32 con padding suave sobre fondo transparente o claro (#FBFAF7)
  const logo32 = await sharp(inputLogo)
    .resize(26, 26, { fit: 'inside' })
    .toBuffer();

  await sharp({
    create: {
      width: 32,
      height: 32,
      channels: 4,
      background: { r: 251, g: 250, b: 247, alpha: 1 } // #FBFAF7
    }
  })
    .composite([{ input: logo32, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'favicon-32.png'));

  // apple-touch-icon.png: 180x180 sobre fondo #FBFAF7
  const logo180 = await sharp(inputLogo)
    .resize(140, 140, { fit: 'inside' })
    .toBuffer();

  await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 251, g: 250, b: 247, alpha: 1 }
    }
  })
    .composite([{ input: logo180, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  console.log('✓ Favicons generados exitosamente en public/');
}

generateIcons().catch(err => {
  console.error('Error generando iconos:', err);
  process.exit(1);
});
