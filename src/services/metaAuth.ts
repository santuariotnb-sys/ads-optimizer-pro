import { META_APP_ID, META_REDIRECT_URI } from '../utils/constants';

const SCOPES = [
  'ads_management',
  'ads_read',
].join(',');

export function getMetaLoginUrl(): string {
  const params = new URLSearchParams({
    client_id: META_APP_ID,
    redirect_uri: META_REDIRECT_URI,
    scope: SCOPES,
    response_type: 'code',
    display: 'popup',
  });
  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
}

export function openMetaLogin(): void {
  window.location.href = getMetaLoginUrl();
}

export function parseCallbackToken(): string | null {
  const hash = window.location.hash;
  if (!hash.includes('access_token')) return null;
  const params = new URLSearchParams(hash.substring(1));
  return params.get('access_token');
}
