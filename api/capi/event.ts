import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_VERSION = 'v21.0';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pixel_id, access_token, events, test_event_code } = req.body;

  if (!pixel_id || !access_token || !events?.length) {
    return res.status(400).json({ error: 'Missing required fields: pixel_id, access_token, events' });
  }

  // Server-side enrichment: add IP and User Agent from the request
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';
  const clientUa = req.headers['user-agent'] || '';

  const enrichedEvents = events.map((event: Record<string, unknown>) => ({
    ...event,
    user_data: {
      ...(event.user_data as Record<string, unknown>),
      client_ip_address: (event.user_data as Record<string, unknown>)?.client_ip_address || clientIp,
      client_user_agent: (event.user_data as Record<string, unknown>)?.client_user_agent || clientUa,
    },
  }));

  try {
    const body: Record<string, unknown> = { data: JSON.stringify(enrichedEvents) };
    if (test_event_code) body.test_event_code = test_event_code;

    const url = `https://graph.facebook.com/${API_VERSION}/${pixel_id}/events?access_token=${access_token}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.json(data);
  } catch {
    return res.status(500).json({ error: 'Falha ao enviar evento CAPI' });
  }
}
