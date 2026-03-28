import type { CAPIEventPayload, CAPIUserData, CAPICustomData, CalculatedData, AutoCollectedData } from '../../types/capi';
import { hashSHA256 } from '../../utils/hash';

/**
 * Gera event_id único para deduplicação com Pixel.
 * Formato: "evt_{timestamp}_{random_8_chars}"
 */
export function generateEventId(): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const random = Math.random().toString(36).substring(2, 10);
  return `evt_${timestamp}_${random}`;
}

/**
 * Normaliza e hash PII para user_data CAPI.
 * TODAS as PII devem ser SHA256(lowercase(trim(value))).
 */
export async function buildUserData(params: {
  email?: string;
  phone?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  gender?: 'm' | 'f';
  dateOfBirth?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  clientIp?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
}): Promise<CAPIUserData> {
  const userData: CAPIUserData = {};

  if (params.email) userData.em = [await hashSHA256(params.email)];
  if (params.phone) userData.ph = [await hashSHA256(params.phone.replace(/\D/g, ''))];
  if (params.userId) userData.external_id = [await hashSHA256(params.userId)];
  if (params.firstName) userData.fn = await hashSHA256(params.firstName);
  if (params.lastName) userData.ln = await hashSHA256(params.lastName);
  if (params.gender) userData.ge = await hashSHA256(params.gender);
  if (params.dateOfBirth) userData.db = await hashSHA256(params.dateOfBirth.replace(/\D/g, ''));
  if (params.city) userData.ct = await hashSHA256(params.city.replace(/\s/g, ''));
  if (params.state) userData.st = await hashSHA256(params.state);
  if (params.zip) userData.zp = await hashSHA256(params.zip.substring(0, 5));
  if (params.country) userData.country = await hashSHA256(params.country);
  if (params.clientIp) userData.client_ip_address = params.clientIp;
  if (params.userAgent) userData.client_user_agent = params.userAgent;
  if (params.fbp) userData.fbp = params.fbp;
  if (params.fbc) userData.fbc = params.fbc;

  return userData;
}

/**
 * Monta custom_data enriquecido com dados calculados.
 */
export function buildCustomData(
  calculated: CalculatedData,
  collected: Partial<AutoCollectedData>,
  eventSpecific: Partial<CAPICustomData> = {}
): CAPICustomData {
  return {
    ...eventSpecific,
    predicted_ltv: calculated.predicted_ltv,
    customer_type: calculated.customer_type,
    funnel_stage: calculated.funnel_stage,
    engagement_score: calculated.engagement_score,
    buyer_prediction_score: calculated.buyer_prediction_score,
    margin_tier: calculated.margin_tier,
    funnel_velocity: calculated.funnel_velocity,
    time_on_page: collected.time_on_page,
    scroll_depth: collected.scroll_depth,
    video_watched: collected.video_watched_pct,
    session_count: collected.session_count,
  };
}

/**
 * Monta payload CAPI completo pronto para envio.
 */
export async function buildCAPIPayload(params: {
  eventName: string;
  sourceUrl: string;
  userData: CAPIUserData;
  customData: CAPICustomData;
}): Promise<CAPIEventPayload> {
  return {
    event_name: params.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: generateEventId(),
    event_source_url: params.sourceUrl,
    action_source: 'website',
    opt_out: false,
    user_data: params.userData,
    custom_data: params.customData,
  };
}

/**
 * Valida payload antes do envio — garante campos obrigatórios.
 */
export function validatePayload(payload: CAPIEventPayload): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!payload.event_name) errors.push('event_name obrigatório');
  if (!payload.event_time) errors.push('event_time obrigatório');
  if (!payload.event_id) errors.push('event_id obrigatório');
  if (!payload.event_source_url) errors.push('event_source_url obrigatório');

  const ud = payload.user_data;
  if (!ud.em?.length && !ud.ph?.length && !ud.external_id?.length) {
    errors.push('Pelo menos um identificador (email, phone ou external_id) é necessário para match');
  }
  if (!ud.client_ip_address) errors.push('client_ip_address recomendado para melhor EMQ');
  if (!ud.client_user_agent) errors.push('client_user_agent recomendado para melhor EMQ');

  return { valid: errors.length === 0, errors };
}

/**
 * Estima contribuição EMQ de um payload.
 */
export function estimateEMQContribution(userData: CAPIUserData): number {
  let score = 0;
  if (userData.em?.length) score += 2.0;
  if (userData.ph?.length) score += 1.5;
  if (userData.external_id?.length) score += 1.5;
  if (userData.client_ip_address) score += 0.5;
  if (userData.client_user_agent) score += 0.5;
  if (userData.fbp) score += 0.5;
  if (userData.fbc) score += 0.5;
  if (userData.fn) score += 0.3;
  if (userData.ln) score += 0.3;
  if (userData.ct) score += 0.2;
  if (userData.st) score += 0.2;
  if (userData.zp) score += 0.2;
  if (userData.country) score += 0.2;
  if (userData.ge) score += 0.1;
  if (userData.db) score += 0.1;
  return Math.round(Math.min(score, 10) * 10) / 10;
}
