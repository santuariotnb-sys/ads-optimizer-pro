import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_VERSION = 'v21.0';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pixel_id, access_token } = req.query;

  if (!pixel_id || !access_token) {
    return res.status(400).json({ error: 'Missing pixel_id or access_token' });
  }

  try {
    const url = `https://graph.facebook.com/${API_VERSION}/${pixel_id}?fields=data_use_setting,event_time_max,event_time_min,is_unified_pixel,name,id&access_token=${access_token}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.json(data);
  } catch {
    return res.status(500).json({ error: 'Falha ao buscar dados do pixel' });
  }
}
