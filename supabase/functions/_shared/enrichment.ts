import { sha256 } from './hash.ts';
import type { BrowserEvent, EnrichedIdentity } from './types.ts';
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function enrichIdentity(
  supabase: SupabaseClient,
  event: BrowserEvent,
  ip: string,
  userId: string
): Promise<EnrichedIdentity> {
  const identity: EnrichedIdentity = {
    email_hash: null,
    phone_hash: null,
    external_id_hash: null,
    fn_hash: null,
    ln_hash: null,
    fbp: event.visitor.fbp,
    fbc: event.visitor.fbc,
    ip,
    ua: event.visitor.user_agent,
    customer_type: 'unknown',
    purchase_count: 0,
    total_spent: 0,
    predicted_ltv: 0,
    first_seen: null,
    emq_estimate: 0,
  };

  // Hash identity fields if present
  if (event.identity?.email) {
    const normalized = event.identity.email.toLowerCase().trim();
    identity.email_hash = await sha256(normalized);

    await supabase.from('visitor_identities').upsert({
      user_id: userId,
      email_hash: identity.email_hash,
      fbp: event.visitor.fbp,
      fbc: event.visitor.fbc,
      session_id: event.visitor.session_id,
      last_seen: new Date().toISOString(),
    }, { onConflict: 'user_id,email_hash' });
  }

  if (event.identity?.phone) {
    const digits = event.identity.phone.replace(/\D/g, '');
    const withCountry = digits.startsWith('55') ? digits : '55' + digits;
    identity.phone_hash = await sha256(withCountry);
  }

  if (event.identity?.external_id) {
    identity.external_id_hash = await sha256(event.identity.external_id);
  }

  if (event.identity?.first_name) {
    identity.fn_hash = await sha256(event.identity.first_name.toLowerCase().trim());
  }

  if (event.identity?.last_name) {
    identity.ln_hash = await sha256(event.identity.last_name.toLowerCase().trim());
  }

  // Recover identity from fbp if no explicit identity
  if (!identity.email_hash && event.visitor.fbp) {
    const { data } = await supabase
      .from('visitor_identities')
      .select('email_hash, phone_hash, external_id_hash')
      .eq('user_id', userId)
      .eq('fbp', event.visitor.fbp)
      .limit(1)
      .maybeSingle();

    if (data) {
      identity.email_hash = data.email_hash || identity.email_hash;
      identity.phone_hash = data.phone_hash || identity.phone_hash;
      identity.external_id_hash = data.external_id_hash || identity.external_id_hash;
    }
  }

  // Lookup purchase history
  if (identity.email_hash) {
    const { data: purchases } = await supabase
      .from('purchases')
      .select('value, created_at')
      .eq('user_id', userId)
      .eq('email_hash', identity.email_hash)
      .order('created_at', { ascending: false });

    if (purchases && purchases.length > 0) {
      identity.purchase_count = purchases.length;
      identity.total_spent = purchases.reduce((sum: number, p: { value: number }) => sum + Number(p.value), 0);
      identity.customer_type = purchases.length === 1 ? 'returning' : 'vip';
      identity.first_seen = purchases[purchases.length - 1].created_at;
    }
  }

  if (identity.customer_type === 'unknown') {
    identity.customer_type = 'new';
  }

  identity.emq_estimate = estimateEMQ(identity);

  return identity;
}

export async function calculatePredictedLTV(
  supabase: SupabaseClient,
  userId: string,
  funnelId: string | undefined,
  customerType: string
): Promise<number> {
  const query = supabase
    .from('funnel_config')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (funnelId) {
    query.eq('id', funnelId);
  }

  const { data: config } = await query.limit(1).maybeSingle();
  if (!config) return 0;

  const ltv = Number(config.front_price)
    + (Number(config.bump1_price) * Number(config.bump1_rate))
    + (Number(config.bump2_price) * Number(config.bump2_rate))
    + (Number(config.upsell_price) * Number(config.upsell_rate))
    + (Number(config.downsell_price) * Number(config.downsell_rate) * (1 - Number(config.upsell_rate)));

  const multiplier = customerType === 'vip' ? 2.5 : customerType === 'returning' ? 1.5 : 1;
  return Math.round(ltv * multiplier * 100) / 100;
}

export function calculateEngagement(behavior: BrowserEvent['behavior']): number {
  const scrollFactor = (behavior.scroll_depth / 100) * 2;
  const timeFactor = Math.min(behavior.time_on_page / 300, 1) * 3;
  const videoFactor = Math.min(behavior.video_watched_pct / 100, 1) * 3;
  const pagesFactor = Math.min(behavior.pages_viewed / 5, 1) * 2;
  return Math.round((scrollFactor + timeFactor + videoFactor + pagesFactor) * 10) / 10;
}

function estimateEMQ(identity: EnrichedIdentity): number {
  let score = 0;
  if (identity.email_hash) score += 2.0;
  if (identity.phone_hash) score += 1.5;
  if (identity.external_id_hash) score += 1.5;
  if (identity.ip && identity.ip !== 'unknown') score += 0.5;
  if (identity.ua) score += 0.5;
  if (identity.fbp) score += 0.5;
  if (identity.fbc) score += 0.5;
  if (identity.fn_hash) score += 0.3;
  if (identity.ln_hash) score += 0.3;
  return Math.min(Math.round(score * 10) / 10, 10);
}
