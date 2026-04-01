import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_VERSION = 'v21.0';

interface CAPIEvent {
  event_name: string;
  event_time: number;
  event_id: string;
  event_source_url: string;
  action_source: string;
  user_data: Record<string, unknown>;
  custom_data: Record<string, unknown>;
}

/**
 * POST /api/capi/event
 *
 * Accepts two formats:
 * 1. Tracking script (new): { pixel_id, events: [CAPIEvent], is_synthetic? }
 *    → access_token read from env var META_ACCESS_TOKEN
 * 2. Direct API call (legacy): { pixel_id, access_token, events: [CAPIEvent], test_event_code? }
 *    → access_token from body (backward compat)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS for sendBeacon from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pixel_id, events, test_event_code, is_synthetic } = req.body;

  // access_token: prefer env var, fallback to body (legacy direct calls)
  const accessToken = process.env.META_ACCESS_TOKEN || req.body.access_token;

  if (!pixel_id || !accessToken || !events?.length) {
    return res.status(400).json({
      error: 'Missing required fields: pixel_id + events (access_token from env or body)',
    });
  }

  // Skip forwarding to Meta for synthetic/internal events — log only
  if (is_synthetic) {
    return res.json({
      success: true,
      synthetic: true,
      events_received: events.length,
      message: 'Synthetic event logged (not forwarded to Meta)',
    });
  }

  // Server-side enrichment: IP and User Agent from the HTTP request
  const clientIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    '';
  const clientUa = req.headers['user-agent'] || '';

  const enrichedEvents = events.map((event: CAPIEvent) => {
    const userData = event.user_data || {};
    return {
      event_name: event.event_name,
      event_time: event.event_time,
      event_id: event.event_id,
      event_source_url: event.event_source_url,
      action_source: event.action_source || 'website',
      user_data: {
        ...userData,
        // Server-side IP/UA — always override (client can't know real IP)
        client_ip_address: clientIp,
        client_user_agent: (userData.client_user_agent as string) || clientUa,
      },
      custom_data: event.custom_data || {},
    };
  });

  try {
    const body: Record<string, unknown> = {
      data: JSON.stringify(enrichedEvents),
      access_token: accessToken,
    };
    if (test_event_code) body.test_event_code = test_event_code;

    const url = `https://graph.facebook.com/${API_VERSION}/${pixel_id}/events`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data,
        pixel_id,
        events_attempted: enrichedEvents.length,
      });
    }

    return res.json({
      success: true,
      ...data,
      events_sent: enrichedEvents.length,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao enviar evento CAPI',
      detail: String(err),
    });
  }
}
