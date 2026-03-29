import { META_APP_ID, META_REDIRECT_URI } from '../utils/constants';

const SCOPES = [
  'ads_management',
  'ads_read',
  'business_management',
  'pages_read_engagement',
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
  const url = getMetaLoginUrl();
  const width = 600;
  const height = 700;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;
  window.open(url, 'meta-login', `width=${width},height=${height},left=${left},top=${top}`);
}

export function parseCallbackToken(): string | null {
  const hash = window.location.hash;
  if (!hash.includes('access_token')) return null;
  const params = new URLSearchParams(hash.substring(1));
  return params.get('access_token');
}
