import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_VERSION = 'v21.0';
const MAX_EVENTS_PER_REQUEST = 1000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pixel_id, events, test_event_code } = req.body;
  const accessToken = process.env.META_ACCESS_TOKEN || req.body.access_token;

  if (!pixel_id || !accessToken || !events?.length) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || '';
  const clientUa = req.headers['user-agent'] || '';

  // Chunk events into batches of 1000
  const chunks: Record<string, unknown>[][] = [];
  for (let i = 0; i < events.length; i += MAX_EVENTS_PER_REQUEST) {
    chunks.push(events.slice(i, i + MAX_EVENTS_PER_REQUEST));
  }

  const results = await Promise.allSettled(
    chunks.map(async (chunk) => {
      const enriched = chunk.map((event: Record<string, unknown>) => ({
        ...event,
        user_data: {
          ...(event.user_data as Record<string, unknown>),
          client_ip_address: (event.user_data as Record<string, unknown>)?.client_ip_address || clientIp,
          client_user_agent: (event.user_data as Record<string, unknown>)?.client_user_agent || clientUa,
        },
      }));

      const body: Record<string, unknown> = {
        data: JSON.stringify(enriched),
        access_token: accessToken,
      };
      if (test_event_code) body.test_event_code = test_event_code;

      const url = `https://graph.facebook.com/${API_VERSION}/${pixel_id}/events`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return response.json();
    })
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  return res.json({
    total: events.length,
    batches: chunks.length,
    sent,
    failed,
    results: results.map(r => r.status === 'fulfilled' ? r.value : { error: 'batch failed' }),
  });
}
