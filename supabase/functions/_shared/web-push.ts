// Raw Web Push implementation for Deno (zero external dependencies)
// Implements RFC 8291 (Message Encryption) + RFC 8292 (VAPID)

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface VapidKeys {
  publicKey: string;
  privateKey: string;
  subject: string;
}

interface PushResult {
  success: boolean;
  status: number;
  expired?: boolean;
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: object,
  vapidKeys: VapidKeys
): Promise<PushResult> {
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));

  // 1. Import VAPID private key
  const vapidPrivateRaw = base64UrlDecode(vapidKeys.privateKey);

  // 2. Build VAPID JWT
  const endpoint = new URL(subscription.endpoint);
  const audience = `${endpoint.protocol}//${endpoint.host}`;
  const vapidToken = await createVapidJwt(vapidPrivateRaw, audience, vapidKeys.subject);

  // 3. Encrypt payload (RFC 8291 aes128gcm)
  const encrypted = await encryptPayload(
    payloadBytes,
    base64UrlDecode(subscription.p256dh),
    base64UrlDecode(subscription.auth)
  );

  // 4. Send to push service
  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `vapid t=${vapidToken}, k=${vapidKeys.publicKey}`,
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      'TTL': '86400',
      'Urgency': 'high',
    },
    body: encrypted,
  });

  if (response.status === 404 || response.status === 410) {
    return { success: false, status: response.status, expired: true };
  }

  return { success: response.status >= 200 && response.status < 300, status: response.status };
}

// --- VAPID JWT ---

async function createVapidJwt(privateKeyRaw: Uint8Array, audience: string, subject: string): Promise<string> {
  // Import the raw private key as ECDSA P-256
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    buildPkcs8FromRaw(privateKeyRaw),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const header = base64UrlEncode(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const now = Math.floor(Date.now() / 1000);
  const claims = base64UrlEncode(JSON.stringify({
    aud: audience,
    exp: now + 43200, // 12 hours
    sub: subject,
  }));

  const signingInput = new TextEncoder().encode(`${header}.${claims}`);
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    signingInput
  );

  // Convert DER signature to raw r||s (64 bytes)
  const rawSig = derToRaw(new Uint8Array(signature));
  return `${header}.${claims}.${base64UrlEncodeBytes(rawSig)}`;
}

// Build PKCS8 wrapper around raw 32-byte EC private key
function buildPkcs8FromRaw(rawKey: Uint8Array): ArrayBuffer {
  // PKCS8 header for P-256
  const header = new Uint8Array([
    0x30, 0x81, 0x87, 0x02, 0x01, 0x00, 0x30, 0x13,
    0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02,
    0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d,
    0x03, 0x01, 0x07, 0x04, 0x6d, 0x30, 0x6b, 0x02,
    0x01, 0x01, 0x04, 0x20,
  ]);
  // We don't include the public key in PKCS8 — crypto.subtle can derive it
  const result = new Uint8Array(header.length + rawKey.length);
  result.set(header);
  result.set(rawKey, header.length);
  return result.buffer;
}

// Convert DER-encoded ECDSA signature to raw 64-byte format
function derToRaw(der: Uint8Array): Uint8Array {
  // Some implementations return raw directly
  if (der.length === 64) return der;

  const raw = new Uint8Array(64);
  // DER: 0x30 <len> 0x02 <rlen> <r> 0x02 <slen> <s>
  let offset = 2; // skip 0x30 <len>
  offset += 1; // skip 0x02
  const rLen = der[offset++];
  const rStart = rLen > 32 ? offset + (rLen - 32) : offset;
  const rDest = rLen < 32 ? 32 - rLen : 0;
  raw.set(der.slice(rStart, offset + rLen), rDest);
  offset += rLen;
  offset += 1; // skip 0x02
  const sLen = der[offset++];
  const sStart = sLen > 32 ? offset + (sLen - 32) : offset;
  const sDest = sLen < 32 ? 64 - sLen : 32;
  raw.set(der.slice(sStart, offset + sLen), sDest);
  return raw;
}

// --- Payload Encryption (RFC 8291 + RFC 8188 aes128gcm) ---

async function encryptPayload(
  payload: Uint8Array,
  p256dhRaw: Uint8Array,
  authSecret: Uint8Array
): Promise<Uint8Array> {
  // 1. Generate ephemeral ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  // 2. Import subscriber's public key
  const subscriberKey = await crypto.subtle.importKey(
    'raw',
    p256dhRaw,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // 3. ECDH shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'ECDH', public: subscriberKey },
      localKeyPair.privateKey,
      256
    )
  );

  // 4. Export local public key (uncompressed, 65 bytes)
  const localPublicKey = new Uint8Array(
    await crypto.subtle.exportKey('raw', localKeyPair.publicKey)
  );

  // 5. Derive IKM using auth secret (RFC 8291 Section 3.3)
  const authInfo = buildInfo('WebPush: info\0', p256dhRaw, localPublicKey);
  const ikm = await hkdf(authSecret, sharedSecret, authInfo, 32);

  // 6. Generate 16-byte salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // 7. Derive CEK and nonce (RFC 8188)
  const cekInfo = buildCekInfo('Content-Encoding: aes128gcm\0');
  const nonceInfo = buildCekInfo('Content-Encoding: nonce\0');
  const cek = await hkdf(salt, ikm, cekInfo, 16);
  const nonce = await hkdf(salt, ikm, nonceInfo, 12);

  // 8. Pad payload (add delimiter 0x02)
  const padded = new Uint8Array(payload.length + 1);
  padded.set(payload);
  padded[payload.length] = 2; // delimiter

  // 9. Encrypt with AES-128-GCM
  const aesKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, padded)
  );

  // 10. Build aes128gcm header: salt(16) + rs(4) + idlen(1) + keyid(65) + ciphertext
  const rs = 4096;
  const header = new Uint8Array(16 + 4 + 1 + 65);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, rs);
  header[20] = 65; // keyid length
  header.set(localPublicKey, 21);

  const result = new Uint8Array(header.length + ciphertext.length);
  result.set(header);
  result.set(ciphertext, header.length);
  return result;
}

function buildInfo(prefix: string, subscriberKey: Uint8Array, localKey: Uint8Array): Uint8Array {
  const prefixBytes = new TextEncoder().encode(prefix);
  const info = new Uint8Array(prefixBytes.length + subscriberKey.length + localKey.length);
  info.set(prefixBytes);
  info.set(subscriberKey, prefixBytes.length);
  info.set(localKey, prefixBytes.length + subscriberKey.length);
  return info;
}

function buildCekInfo(prefix: string): Uint8Array {
  const bytes = new TextEncoder().encode(prefix);
  const info = new Uint8Array(bytes.length + 1);
  info.set(bytes);
  info[bytes.length] = 1;
  return info;
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', ikm, { name: 'HKDF' }, false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    key,
    length * 8
  );
  return new Uint8Array(derived);
}

// --- Base64url helpers ---

function base64UrlDecode(str: string): Uint8Array {
  const padding = '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + padding).replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
