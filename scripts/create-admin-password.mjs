#!/usr/bin/env node
/**
 * Utility script to generate a secure scrypt password hash and session secret
 * for the GSDD Foundation Admin Portal.
 *
 * Usage:
 *   node scripts/create-admin-password.mjs [optional-password]
 */

import { randomBytes, scrypt } from 'node:crypto';
import readline from 'node:readline';

const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function derive(password, salt) {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, SCRYPT_KEY_LENGTH, SCRYPT_OPTIONS, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
}

async function main() {
  let password = process.argv[2];

  if (!password) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    password = await new Promise((resolve) => {
      rl.question('Enter admin password to hash: ', (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }

  if (!password || password.length < 8) {
    console.error('Password must be at least 8 characters long.');
    process.exit(1);
  }

  const salt = randomBytes(16).toString('hex');
  const derived = await derive(password, salt);
  const hashHex = derived.toString('hex').toLowerCase();
  const passwordHash = `${salt}:${hashHex}`;
  const sessionSecret = randomBytes(32).toString('hex');

  console.log('\n--- Generated Admin Configuration ---');
  console.log(`ADMIN_PASSWORD_HASH=${passwordHash}`);
  console.log(`ADMIN_SESSION_SECRET=${sessionSecret}`);
  console.log('\nCopy these values to .env.local or Google Cloud Secret Manager.');
}

main().catch((err) => {
  console.error('Error generating hash:', err);
  process.exit(1);
});
