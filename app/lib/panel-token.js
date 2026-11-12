// Shared Edge + Node.js compatible Web Crypto HMAC helper for the
// Software Update Panel Password unlock cookie (`gsdd_panel_unlock`).
// Intentionally avoids Node-only built-ins so Next.js middleware can import it directly.

export const PANEL_UNLOCK_COOKIE = 'gsdd_panel_unlock';
export const PANEL_UNLOCK_TTL_SECONDS = 1800; // 30 minutes

const encoder = new TextEncoder();

function toHex(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let out = '';
  for (let i = 0; i < bytes.length; i += 1) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

function fromHex(hex) {
  if (typeof hex !== 'string' || hex.length === 0 || hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) {
    return null;
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

async function importHmacKey(secret) {
  const clean = typeof secret === 'string' ? secret.trim() : '';
  if (clean.length < 16) return null;
  return globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(`gsdd-panel-unlock:${clean}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signPanelUnlockToken(secret, ttlSeconds = PANEL_UNLOCK_TTL_SECONDS) {
  const key = await importHmacKey(secret);
  if (!key) return null;
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `p1.${expiresAt}`;
  const sig = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return `${payload}.${toHex(sig)}`;
}

export async function verifyPanelUnlockToken(token, secret) {
  if (typeof token !== 'string' || token.length < 20 || token.length > 256) return false;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'p1') return false;
  if (!/^[0-9]{1,12}$/.test(parts[1])) return false;

  const expiresAt = Number(parts[1]);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(expiresAt) || expiresAt <= now || expiresAt > now + 86400) {
    return false;
  }

  const sigBytes = fromHex(parts[2]);
  if (!sigBytes) return false;

  const key = await importHmacKey(secret);
  if (!key) return false;

  const payload = `p1.${parts[1]}`;
  return globalThis.crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(payload));
}
