import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_VERSION = 'v21.0';
const MAX_EVENTS_PER_REQUEST = 1000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pixel_id, access_token, events, test_event_code } = req.body;

  if (!pixel_id || !access_token || !events?.length) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || '';
  const clientUa = req.headers['user-agent'] || '';

  // Chunk events into batches of 1000
  const chunks: any[][] = [];
  for (let i = 0; i < events.length; i += MAX_EVENTS_PER_REQUEST) {
    chunks.push(events.slice(i, i + MAX_EVENTS_PER_REQUEST));
  }

  const results = await Promise.allSettled(
    chunks.map(async (chunk) => {
      const enriched = chunk.map((event: any) => ({
        ...event,
        user_data: {
          ...event.user_data,
          client_ip_address: event.user_data?.client_ip_address || clientIp,
          client_user_agent: event.user_data?.client_user_agent || clientUa,
        },
      }));

      const body: any = { data: JSON.stringify(enriched) };
      if (test_event_code) body.test_event_code = test_event_code;

      const url = `https://graph.facebook.com/${API_VERSION}/${pixel_id}/events?access_token=${access_token}`;
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
