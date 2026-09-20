import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const password = process.argv[2];
if (!password) {
  console.error('Uso: node scripts/set-password.mjs "<contraseña>"');
  process.exit(1);
}

const salt = crypto.randomBytes(16);
const iterations = 210000;
const keylen = 32;
const digest = 'sha256';

const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest);

const authConfig = {
  algorithm: 'PBKDF2-SHA256',
  iterations,
  salt: salt.toString('base64'),
  hash: derivedKey.toString('base64'),
};

const configDir = path.resolve('src/config');
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

fs.writeFileSync(
  path.join(configDir, 'auth.json'),
  JSON.stringify(authConfig, null, 2) + '\n',
  'utf8'
);

console.log('✓ Hash de autenticación generado exitosamente en src/config/auth.json');
