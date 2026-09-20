import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const authPath = path.resolve('src/config/auth.json');
if (!fs.existsSync(authPath)) {
  console.error('Error: No se encontró src/config/auth.json. Ejecuta npm run set-password');
  process.exit(1);
}

const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));

// Comprobar si coincide con la clave de desarrollo "desarrollo-cambiar"
const saltBuf = Buffer.from(auth.salt, 'base64');
const testHash = crypto.pbkdf2Sync('desarrollo-cambiar', saltBuf, auth.iterations, 32, 'sha256').toString('base64');

if (auth.hash === testHash) {
  if (process.env.ALLOW_DEV_PASSWORD === '1') {
    console.warn('⚠️ Advertencia: Construyendo con contraseña de desarrollo (ALLOW_DEV_PASSWORD=1)');
  } else {
    console.error('❌ Error de seguridad: auth.json aún tiene la contraseña de desarrollo predeterminada.');
    console.error('Ejecuta `npm run set-password -- "<tu_clave_segura>"` antes de construir para producción.');
    console.error('O define ALLOW_DEV_PASSWORD=1 solo para entornos de prueba locales.');
    process.exit(1);
  }
}

console.log('✓ Verificación de credenciales de publicación completada.');
