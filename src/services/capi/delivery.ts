import type { CAPIEventPayload, CAPIEventLog } from '../../types/capi';
import { API_VERSION, GRAPH_API_BASE } from '../../utils/constants';
import { estimateEMQContribution } from './payload';

const MAX_EVENTS_PER_REQUEST = 1000;
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 30000];

/**
 * Envia eventos para o Meta Conversions API.
 * POST https://graph.facebook.com/v21.0/{pixel_id}/events
 */
export async function sendToMeta(
  pixelId: string,
  accessToken: string,
  events: CAPIEventPayload[],
  testEventCode?: string
): Promise<{ success: boolean; response?: unknown; error?: string }> {
  const url = `${GRAPH_API_BASE}/${API_VERSION}/${pixelId}/events`;

  const body: Record<string, unknown> = {
    data: events,
    access_token: accessToken,
  };

  if (testEventCode) {
    body.test_event_code = testEventCode;
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, response: data };
      }

      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
        continue;
      }

      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: `HTTP ${response.status}: ${JSON.stringify(errorData)}` };
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
        continue;
      }
      return { success: false, error: String(err) };
    }
  }

  return { success: false, error: 'Max retries exceeded' };
}

/**
 * Envia batch de eventos respeitando limite de 1000 por request.
 */
export async function sendBatch(
  pixelId: string,
  accessToken: string,
  events: CAPIEventPayload[],
  testEventCode?: string
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const results = { sent: 0, failed: 0, errors: [] as string[] };

  for (let i = 0; i < events.length; i += MAX_EVENTS_PER_REQUEST) {
    const batch = events.slice(i, i + MAX_EVENTS_PER_REQUEST);
    const result = await sendToMeta(pixelId, accessToken, batch, testEventCode);

    if (result.success) {
      results.sent += batch.length;
    } else {
      results.failed += batch.length;
      if (result.error) results.errors.push(result.error);
    }
  }

  return results;
}

/**
 * Cria log entry de um evento enviado.
 */
export function createEventLog(
  event: CAPIEventPayload,
  status: 'sent' | 'failed' | 'retrying',
  responseCode?: number,
  isSynthetic: boolean = false
): CAPIEventLog {
  const userDataFields = Object.entries(event.user_data)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k]) => k);

  const customDataFields = Object.entries(event.custom_data)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k]) => k);

  return {
    id: event.event_id,
    event_name: event.event_name,
    event_id: event.event_id,
    timestamp: new Date().toISOString(),
    status,
    response_code: responseCode,
    user_data_fields: userDataFields,
    custom_data_fields: customDataFields,
    is_synthetic: isSynthetic,
    value: event.custom_data.value,
    emq_contribution: estimateEMQContribution(event.user_data),
  };
}
