import type { CAPIPayload, DeliveryResult } from './types.ts';
import { getMetaEndpoint } from './capi-builder.ts';

const BACKOFF_MS = [1000, 5000, 30000];
const MAX_RETRIES = 3;

export async function sendToMeta(
  payload: CAPIPayload,
  pixelId: string
): Promise<DeliveryResult> {
  const url = getMetaEndpoint(pixelId);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await response.json();

      if (response.status === 200) {
        return { status: 200, body, attempts: attempt + 1 };
      }

      // Rate limit — retry
      if (response.status === 429 && attempt < MAX_RETRIES) {
        await delay(BACKOFF_MS[attempt]);
        continue;
      }

      // Client error (not rate limit) — don't retry
      if (response.status >= 400 && response.status < 500) {
        return { status: response.status, body, attempts: attempt + 1 };
      }

      // Server error — retry
      if (response.status >= 500 && attempt < MAX_RETRIES) {
        await delay(BACKOFF_MS[attempt]);
        continue;
      }

      return { status: response.status, body, attempts: attempt + 1 };
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        await delay(BACKOFF_MS[attempt]);
        continue;
      }
      return { status: 0, body: { error: String(error) }, attempts: attempt + 1 };
    }
  }

  return { status: 0, body: { error: 'max_retries_exceeded' }, attempts: MAX_RETRIES + 1 };
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
