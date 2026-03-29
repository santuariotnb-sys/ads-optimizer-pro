import type { VercelRequest, VercelResponse } from '@vercel/node';

const META_APP_ID = process.env.META_APP_ID || '';
const META_APP_SECRET = process.env.META_APP_SECRET || '';
const REDIRECT_URI = process.env.META_REDIRECT_URI || 'https://ads-optimizer-pro.vercel.app/auth/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://ads-optimizer-pro.vercel.app';
const API_VERSION = 'v21.0';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, error, error_description } = req.query;

  if (error) {
    return res.redirect(`${FRONTEND_URL}?error=${encodeURIComponent(String(error_description || error))}`);
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  try {
    // Exchange code for short-lived token
    const tokenUrl = `https://graph.facebook.com/${API_VERSION}/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_secret=${META_APP_SECRET}&code=${code}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return res.redirect(`${FRONTEND_URL}?error=${encodeURIComponent(tokenData.error.message)}`);
    }

    // Exchange short-lived token for long-lived token (60 days)
    const longLivedUrl = `https://graph.facebook.com/${API_VERSION}/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`;
    const longLivedRes = await fetch(longLivedUrl);
    const longLivedData = await longLivedRes.json();

    if (longLivedData.error) {
      return res.redirect(`${FRONTEND_URL}?error=${encodeURIComponent(longLivedData.error.message)}`);
    }

    // Redirect to frontend with token in hash (not query param for security)
    const redirectUrl = `${FRONTEND_URL}#access_token=${longLivedData.access_token}&expires_in=${longLivedData.expires_in || 5184000}`;
    return res.redirect(redirectUrl);
  } catch {
    return res.redirect(`${FRONTEND_URL}?error=${encodeURIComponent('Falha na autenticação')}`);
  }
}
