import type { BrowserEvent, EnrichedIdentity, CAPIPayload, CAPIEvent } from './types.ts';

export function buildCAPIPayload(
  event: BrowserEvent,
  identity: EnrichedIdentity,
  predictedLtv: number,
  clientIp: string,
  userAgent: string,
  accessToken: string,
): CAPIPayload {
  const userData: Record<string, unknown> = {};

  if (identity.email_hash) userData.em = [identity.email_hash];
  if (identity.phone_hash) userData.ph = [identity.phone_hash];
  if (identity.external_id_hash) userData.external_id = [identity.external_id_hash];
  if (identity.fn_hash) userData.fn = identity.fn_hash;
  if (identity.ln_hash) userData.ln = identity.ln_hash;
  if (clientIp !== 'unknown') userData.client_ip_address = clientIp;
  if (userAgent) userData.client_user_agent = userAgent;
  if (identity.fbp) userData.fbp = identity.fbp;
  if (identity.fbc) userData.fbc = identity.fbc;

  const customData: Record<string, unknown> = {};

  if (event.conversion?.value != null) {
    customData.value = event.conversion.value;
    customData.currency = event.conversion.currency || 'BRL';
  }
  if (event.conversion?.content_name) customData.content_name = event.conversion.content_name;
  if (event.conversion?.content_ids) customData.content_ids = event.conversion.content_ids;
  if (event.conversion?.num_items) customData.num_items = event.conversion.num_items;
  if (event.conversion?.order_id) customData.order_id = event.conversion.order_id;

  if (predictedLtv > 0) customData.predicted_ltv = predictedLtv;
  if (identity.customer_type !== 'unknown') customData.customer_type = identity.customer_type;

  if (event.behavior.time_on_page > 0) customData.time_on_page = event.behavior.time_on_page;
  if (event.behavior.scroll_depth > 0) customData.scroll_depth = event.behavior.scroll_depth;
  if (event.behavior.video_watched_pct > 0) customData.video_watched = event.behavior.video_watched_pct;

  const capiEvent: CAPIEvent = {
    event_name: event.event_name,
    event_time: Math.floor(event.timestamp / 1000),
    event_id: event.event_id,
    event_source_url: event.event_source_url,
    action_source: 'website',
    opt_out: false,
    user_data: userData,
    custom_data: customData,
  };

  return {
    data: [capiEvent],
    access_token: accessToken,
  };
}

export function getMetaEndpoint(pixelId: string): string {
  const version = Deno.env.get('META_API_VERSION') || 'v21.0';
  return `https://graph.facebook.com/${version}/${pixelId}/events`;
}
